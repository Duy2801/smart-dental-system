import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Button, SheetBottomInset, toast } from '~src/components/ui';
import { queryKeys } from '~src/config/queryClient';
import {
  getAvailableConsultationSlots,
  rescheduleMyConsultation,
  type PatientConsultation,
} from '../api';

/** Giống đổi lịch khám (và web): tối đa 1 lần, trước giờ hẹn ít nhất 6 tiếng */
export const CONSULTATION_RESCHEDULE_LIMIT = 1;
export const CONSULTATION_RESCHEDULE_NOTICE_HOURS = 6;
const RESCHEDULE_DAYS = 14;
const ICT_OFFSET_MS = 7 * 60 * 60 * 1000;
const NOTICE_MS = CONSULTATION_RESCHEDULE_NOTICE_HOURS * 60 * 60 * 1000;
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Hiện nút "Đổi lịch" cho lịch đã thanh toán & đang chờ tư vấn */
export function canShowConsultationReschedule(item: PatientConsultation) {
  return item.isPaid && item.status === 'SCHEDULED';
}

export function getConsultationRescheduleBlocker(
  item: PatientConsultation,
  now = Date.now(),
): string | null {
  if (!canShowConsultationReschedule(item)) {
    return 'Chỉ đổi được lịch tư vấn đã thanh toán và chưa diễn ra.';
  }
  if ((item.rescheduleCount ?? 0) >= CONSULTATION_RESCHEDULE_LIMIT) {
    return 'Lịch tư vấn này đã được đổi 1 lần, không thể đổi thêm.';
  }
  if (new Date(item.scheduledAt).getTime() - now < NOTICE_MS) {
    return `Chỉ được đổi lịch trước giờ tư vấn ít nhất ${CONSULTATION_RESCHEDULE_NOTICE_HOURS} tiếng.`;
  }
  return null;
}

// Tính theo giờ Việt Nam (UTC+7) bằng phép cộng offset để không phụ thuộc Intl timeZone trên Hermes
function toIctDateKey(value: Date) {
  return new Date(value.getTime() + ICT_OFFSET_MS).toISOString().slice(0, 10);
}

function toIctTime(value: Date) {
  return new Date(value.getTime() + ICT_OFFSET_MS).toISOString().slice(11, 16);
}

function ictDateTime(dateKey: string, time: string) {
  return new Date(`${dateKey}T${time}:00+07:00`);
}

function formatIctDate(value: Date) {
  const key = toIctDateKey(value);
  const [year, month, day] = key.split('-');
  const weekday = WEEKDAYS[new Date(`${key}T12:00:00Z`).getUTCDay()];
  return `${weekday}, ${day}/${month}/${year}`;
}

function buildDates() {
  const [year, month, day] = toIctDateKey(new Date()).split('-').map(Number);
  return Array.from({ length: RESCHEDULE_DAYS }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day + index, 12));
    return {
      id: date.toISOString().slice(0, 10),
      weekday: WEEKDAYS[date.getUTCDay()],
      day: date.getUTCDate(),
      month: `Th${date.getUTCMonth() + 1}`,
    };
  });
}

function getErrorMessage(error: any) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return String(message[0]);
  if (typeof message === 'string' && message.trim()) return message;
  return 'Vui lòng thử lại hoặc chọn khung giờ khác.';
}

type ConsultationRescheduleModalProps = {
  consultation: PatientConsultation | null;
  onClose: () => void;
};

export function ConsultationRescheduleModal({
  consultation,
  onClose,
}: ConsultationRescheduleModalProps) {
  if (!consultation) return null;
  return (
    <RescheduleSheet
      key={consultation.id}
      consultation={consultation}
      onClose={onClose}
    />
  );
}

function RescheduleSheet({
  consultation,
  onClose,
}: {
  consultation: PatientConsultation;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const dates = useMemo(() => buildDates(), []);
  const currentStart = new Date(consultation.scheduledAt);
  const [selectedDateId, setSelectedDateId] = useState(() => {
    const currentKey = toIctDateKey(currentStart);
    return dates.some(d => d.id === currentKey) ? currentKey : dates[0]?.id ?? '';
  });
  const [pickedTime, setPickedTime] = useState('');
  const blocker = getConsultationRescheduleBlocker(consultation);

  const slotsQuery = useQuery({
    queryKey: [
      'consultation',
      'reschedule-slots',
      consultation.id,
      consultation.doctorId,
      selectedDateId,
      consultation.durationMinutes,
    ],
    queryFn: () =>
      getAvailableConsultationSlots(
        consultation.doctorId as string,
        selectedDateId,
        consultation.durationMinutes,
        consultation.id,
      ),
    enabled: Boolean(consultation.doctorId && selectedDateId && !blocker),
    staleTime: 15000,
  });

  const currentTimeKey =
    selectedDateId === toIctDateKey(currentStart) ? toIctTime(currentStart) : '';
  const times = (slotsQuery.data ?? []).filter(
    slot =>
      slot !== currentTimeKey &&
      ictDateTime(selectedDateId, slot).getTime() - Date.now() >= NOTICE_MS,
  );
  const selectedTime = times.includes(pickedTime) ? pickedTime : '';

  const rescheduleMutation = useMutation({
    mutationFn: (scheduledAt: string) =>
      rescheduleMyConsultation(consultation.id, scheduledAt),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.consultations.myList });
      void queryClient.invalidateQueries({ queryKey: ['consultation'] });
      toast.success(
        'Đã đổi lịch tư vấn',
        'Buổi tư vấn đã được dời sang thời gian mới.',
      );
      onClose();
    },
    onError: (err: any) => {
      toast.error('Không thể đổi lịch tư vấn', getErrorMessage(err));
    },
  });

  const handleConfirm = () => {
    if (blocker || !selectedDateId || !selectedTime) return;
    rescheduleMutation.mutate(ictDateTime(selectedDateId, selectedTime).toISOString());
  };

  const currentEnd = new Date(
    currentStart.getTime() + (consultation.durationMinutes || 30) * 60_000,
  );

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
            <View className="flex-1 pr-3">
              <Text className="text-base font-black text-slate-900">
                Đổi lịch tư vấn trực tuyến
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500">
                {consultation.doctor} • {consultation.duration}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
            >
              <FontAwesome6 color="#64748B" iconStyle="solid" name="xmark" size={14} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
            <View style={styles.currentBox}>
              <Text style={styles.currentLabel}>Lịch hiện tại</Text>
              <Text style={styles.currentValue}>
                {toIctTime(currentStart)} - {toIctTime(currentEnd)} · {formatIctDate(currentStart)}
              </Text>
            </View>

            {blocker ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>{blocker}</Text>
              </View>
            ) : (
              <Text style={styles.policyText}>
                Mỗi buổi tư vấn chỉ được đổi lịch 1 lần, giữ nguyên bác sĩ và thời lượng.
                Giờ mới phải cách hiện tại ít nhất {CONSULTATION_RESCHEDULE_NOTICE_HOURS} tiếng.
              </Text>
            )}

            {/* 1. Chọn ngày mới */}
            <View className="mt-3">
              <Text className="mb-2 text-xs font-black uppercase tracking-wider text-slate-700">
                1. Chọn ngày mới
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateListContent}
              >
                {dates.map(date => {
                  const isSelected = date.id === selectedDateId;
                  return (
                    <TouchableOpacity
                      key={date.id}
                      disabled={Boolean(blocker)}
                      onPress={() => {
                        setSelectedDateId(date.id);
                        setPickedTime('');
                      }}
                      style={[
                        styles.datePill,
                        isSelected && styles.datePillSelected,
                        Boolean(blocker) && styles.datePillDisabled,
                      ]}
                    >
                      <Text style={[styles.dateWeekday, isSelected ? styles.textWhite : styles.textMuted]}>
                        {date.weekday}
                      </Text>
                      <Text style={[styles.dateDay, isSelected ? styles.textWhite : styles.textDark]}>
                        {date.day}
                      </Text>
                      <Text style={[styles.dateMonth, isSelected ? styles.textWhite : styles.textMuted]}>
                        {date.month}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. Chọn giờ mới */}
            <View className="mt-3 rounded-2xl border border-slate-200 bg-white p-3.5">
              <Text className="mb-2 text-xs font-black uppercase tracking-wider text-slate-700">
                2. Khung giờ tư vấn còn trống
              </Text>

              {slotsQuery.isLoading ? (
                <View className="items-center justify-center py-6">
                  <ActivityIndicator color="#0058bc" size="small" />
                  <Text className="mt-2 text-xs text-slate-400">
                    Đang tải lịch trống của bác sĩ...
                  </Text>
                </View>
              ) : times.length === 0 ? (
                <Text className="py-4 text-center text-xs text-slate-400">
                  {blocker ? 'Không thể đổi lịch tư vấn này.' : 'Không còn giờ trống ngày này.'}
                </Text>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {times.map(time => {
                    const isSelected = time === selectedTime;
                    return (
                      <TouchableOpacity
                        key={time}
                        onPress={() => setPickedTime(time)}
                        style={[styles.timeChip, isSelected && styles.timeChipSelected]}
                      >
                        <Text
                          style={[
                            styles.timeText,
                            isSelected ? styles.timeTextSelected : styles.timeTextNormal,
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Actions */}
            <View className="gap-2 pb-2 pt-3">
              <Button
                disabled={
                  Boolean(blocker) ||
                  !selectedDateId ||
                  !selectedTime ||
                  rescheduleMutation.isPending
                }
                onPress={handleConfirm}
                className="w-full"
              >
                {rescheduleMutation.isPending ? 'Đang cập nhật...' : 'Xác nhận đổi lịch'}
              </Button>
              <Button variant="outline" onPress={onClose} className="w-full">
                Hủy bỏ
              </Button>
            </View>
          </ScrollView>
          <SheetBottomInset />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  currentBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  currentLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  currentValue: {
    color: '#0058bc',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  dateDay: {
    fontSize: 15,
    fontWeight: '900',
  },
  dateListContent: {
    paddingVertical: 2,
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: '700',
  },
  datePill: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1.5,
    height: 68,
    justifyContent: 'center',
    marginRight: 8,
    width: 50,
  },
  datePillDisabled: {
    backgroundColor: '#F8FAFC',
    opacity: 0.45,
  },
  datePillSelected: {
    backgroundColor: '#0058bc',
    borderColor: '#0058bc',
  },
  dateWeekday: {
    fontSize: 10,
    fontWeight: '800',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    width: '100%',
  },
  modalOverlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  policyText: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    color: '#475569',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 10,
    padding: 10,
  },
  textDark: {
    color: '#0F172A',
  },
  textMuted: {
    color: '#64748B',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  timeChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 36,
    justifyContent: 'center',
    width: '30%',
  },
  timeChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0058bc',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  timeTextNormal: {
    color: '#334155',
  },
  timeTextSelected: {
    color: '#0058bc',
  },
  warningBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
    padding: 10,
  },
  warningText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: '700',
  },
});
