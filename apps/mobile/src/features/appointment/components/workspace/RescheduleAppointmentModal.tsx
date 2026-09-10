import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Button } from '~src/components/ui';
import { getAppointmentOptions, reschedulePatientAppointment } from '../../api';
import type { AppointmentItem } from '../../types';

type RescheduleAppointmentModalProps = {
  appointment: AppointmentItem | null;
  onClose: () => void;
};

export function RescheduleAppointmentModal({
  appointment,
  onClose,
}: RescheduleAppointmentModalProps) {
  const queryClient = useQueryClient();
  const [selectedDateId, setSelectedDateId] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const optionsQuery = useQuery({
    queryKey: ['reschedule-options', appointment?.doctorId],
    queryFn: () => getAppointmentOptions({ doctorId: appointment?.doctorId }),
    enabled: Boolean(appointment?.doctorId),
  });

  const rescheduleMutation = useMutation({
    mutationFn: (payload: { scheduledAt: string }) =>
      reschedulePatientAppointment(appointment!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
      Alert.alert('Thành công', 'Lịch hẹn đã được dời sang thời gian mới.');
      onClose();
    },
    onError: (err: any) => {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể dời lịch hẹn. Vui lòng thử lại.');
    },
  });

  if (!appointment) return null;

  const dates = optionsQuery.data?.dates ?? [];
  const times = optionsQuery.data?.timeSlots ?? [];

  const handleConfirmReschedule = () => {
    if (!selectedDateId || !selectedTime) return;
    const scheduledAt = `${selectedDateId}T${selectedTime}:00`;
    rescheduleMutation.mutate({ scheduledAt });
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={Boolean(appointment)}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
            <View>
              <Text className="text-base font-black text-slate-900">
                Đổi lịch khám nha khoa
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500">
                BS. {appointment.doctor} • {appointment.service}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
            >
              <FontAwesome6 color="#64748B" iconStyle="solid" name="xmark" size={14} />
            </TouchableOpacity>
          </View>

          {optionsQuery.isLoading ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator color="#0058bc" size="small" />
              <Text className="mt-2 text-xs text-slate-400">Đang tải lịch trống của bác sĩ...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="mt-3 space-y-4">
              {/* 1. Chọn ngày mới */}
              <View>
                <Text className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  1. Chọn ngày mới
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 2 }}
                >
                  {dates.map(date => {
                    const isSelected = date.id === selectedDateId;
                    return (
                      <TouchableOpacity
                        key={date.id}
                        disabled={!date.isOpen}
                        onPress={() => {
                          setSelectedDateId(date.id);
                          setSelectedTime('');
                        }}
                        style={[
                          styles.datePill,
                          isSelected && styles.datePillSelected,
                          !date.isOpen && styles.datePillDisabled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateWeekday,
                            isSelected ? styles.textWhite : styles.textMuted,
                          ]}
                        >
                          {date.weekday}
                        </Text>
                        <Text
                          style={[
                            styles.dateDay,
                            isSelected ? styles.textWhite : styles.textDark,
                          ]}
                        >
                          {Number(date.day)}
                        </Text>
                        <Text
                          style={[
                            styles.dateMonth,
                            isSelected ? styles.textWhite : styles.textMuted,
                          ]}
                        >
                          {date.month}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* 2. Chọn giờ mới */}
              <View className="mt-3 rounded-2xl border border-slate-200 bg-white p-3.5">
                <Text className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                  2. Khung giờ khám còn trống
                </Text>

                {times.length === 0 ? (
                  <Text className="py-4 text-center text-xs text-slate-400">
                    {selectedDateId ? 'Không còn giờ trống ngày này.' : 'Chọn ngày ở trên để xem giờ.'}
                  </Text>
                ) : (
                  <View className="flex-row flex-wrap gap-2">
                    {times.map(time => {
                      const isSelected = time === selectedTime;
                      return (
                        <TouchableOpacity
                          key={time}
                          onPress={() => setSelectedTime(time)}
                          style={[
                            styles.timeChip,
                            isSelected && styles.timeChipSelected,
                          ]}
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
              <View className="pt-3 pb-2 gap-2">
                <Button
                  disabled={!selectedDateId || !selectedTime || rescheduleMutation.isPending}
                  onPress={handleConfirmReschedule}
                  className="w-full"
                >
                  {rescheduleMutation.isPending ? 'Đang cập nhật...' : 'Xác nhận đổi lịch'}
                </Button>
                <Button variant="outline" onPress={onClose} className="w-full">
                  Hủy bỏ
                </Button>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dateDay: {
    fontSize: 15,
    fontWeight: '900',
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
    borderColor: '#E2E8F0',
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
});
