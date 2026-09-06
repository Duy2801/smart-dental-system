import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Button } from '~src/components/ui';
import type { BookingDate } from '../../types';

type SchedulePickerProps = {
  blockedRanges?: string[];
  blockedTimes?: string[];
  dates: BookingDate[];
  isLoadingTimes?: boolean;
  onBack: () => void;
  onContinue: () => void;
  onSelectDate: (id: string) => void;
  onSelectTime: (time: string) => void;
  selectedDateId: string;
  selectedTime: string;
  slotIntervalMinutes?: number;
  times: string[];
};

const toMinutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return (hour || 0) * 60 + (minute || 0);
};

const formatDisplayDate = (dateId: string) => {
  const date = new Date(`${dateId}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateId;

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
  }).format(date);
};

const parseLocalDate = (dateId: string) => {
  const [year, month, day] = dateId.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const toDateId = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function SchedulePicker({
  dates = [],
  times = [],
  blockedTimes = [],
  blockedRanges = [],
  isLoadingTimes = false,
  slotIntervalMinutes = 30,
  selectedDateId,
  selectedTime,
  onSelectDate,
  onSelectTime,
  onBack,
  onContinue,
}: SchedulePickerProps) {
  const initialCalendarDate = parseLocalDate(selectedDateId) ?? new Date();
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [calendarYear, setCalendarYear] = useState(
    initialCalendarDate.getFullYear(),
  );
  const [calendarMonth, setCalendarMonth] = useState(
    initialCalendarDate.getMonth(),
  );

  const safeDates = useMemo(() => (Array.isArray(dates) ? dates : []), [dates]);
  const safeTimes = Array.isArray(times) ? times : [];
  const safeBlockedTimes = Array.isArray(blockedTimes) ? blockedTimes : [];
  const openDateIds = useMemo(
    () => new Set(safeDates.filter(date => date.isOpen).map(date => date.id)),
    [safeDates],
  );

  const visibleTimes = Array.from(
    new Set([...safeTimes, ...safeBlockedTimes]),
  ).sort((left, right) => toMinutes(left) - toMinutes(right));

  const selectedDateLabel = selectedDateId
    ? formatDisplayDate(selectedDateId)
    : 'Chọn ngày';
  const isStepComplete =
    Boolean(selectedDateId) && Boolean(selectedTime) && !isLoadingTimes;

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const days: Array<{ dateStr: string; day: number } | null> = [];

    for (let index = 0; index < firstDayIndex; index += 1) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(calendarYear, calendarMonth, day);
      days.push({ dateStr: toDateId(date), day });
    }

    return days;
  }, [calendarMonth, calendarYear]);

  useEffect(() => {
    const date = parseLocalDate(selectedDateId);
    if (!date) return;

    setCalendarYear(date.getFullYear());
    setCalendarMonth(date.getMonth());
  }, [selectedDateId]);

  const handleSelectCalendarDate = (dateId: string) => {
    if (!openDateIds.has(dateId)) return;

    onSelectDate(dateId);
    setDateModalVisible(false);
  };

  return (
    <View className="space-y-5">
      <View style={styles.dateSelectPanel}>
        <View style={styles.dateSelectHeader}>
          <View style={styles.dateTitleRow}>
            <View style={styles.stepNumberBadge}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.dateSelectTitle}>Chọn Ngày & Khung Giờ</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => setDateModalVisible(true)}
            style={styles.dateInput}
          >
            <Text numberOfLines={1} style={styles.dateInputText}>
              {selectedDateLabel}
            </Text>
            <FontAwesome6
              color="#334155"
              iconStyle="regular"
              name="calendar-days"
              size={14}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-black uppercase tracking-wider text-slate-700">
            Khung giờ còn trống
          </Text>
          <Text className="text-[10px] font-bold text-slate-400">
            {slotIntervalMinutes} phút/lượt
          </Text>
        </View>

        {blockedRanges.length > 0 ? (
          <View className="mt-2.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5">
            <Text className="text-[10px] font-black uppercase text-amber-700">
              Đã có lịch hẹn trong khung:
            </Text>
            <Text className="mt-0.5 text-xs font-bold text-amber-900">
              {blockedRanges.join(', ')}
            </Text>
          </View>
        ) : null}

        {isLoadingTimes && selectedDateId ? (
          <View style={styles.timeLoadingBox}>
            <ActivityIndicator color="#0058bc" size="small" />
            <Text style={styles.timeLoadingText}>
              Đang tải khung giờ trống thật từ phòng khám...
            </Text>
          </View>
        ) : visibleTimes.length === 0 ? (
          <View className="mt-4 rounded-xl bg-slate-50 p-6 items-center justify-center">
            <FontAwesome6
              color="#94A3B8"
              iconStyle="solid"
              name="clock"
              size={22}
            />
            <Text className="mt-2 text-xs font-bold text-slate-500 text-center">
              {selectedDateId
                ? 'Ngày này đã kín lịch hoặc phòng khám không làm việc.'
                : 'Vui lòng chọn ngày khám ở trên để xem khung giờ.'}
            </Text>
          </View>
        ) : (
          <View className="mt-3 flex-row flex-wrap gap-2">
            {visibleTimes.map(time => {
              const isSelected = time === selectedTime;
              const isBlocked = blockedTimes.includes(time);

              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isBlocked}
                  key={time}
                  onPress={() => onSelectTime(time)}
                  style={[
                    styles.timeChip,
                    isSelected && styles.timeChipSelected,
                    isBlocked && styles.timeChipBlocked,
                  ]}
                >
                  <Text
                    style={[
                      styles.timeText,
                      isSelected
                        ? styles.timeTextSelected
                        : isBlocked
                          ? styles.timeTextBlocked
                          : styles.timeTextNormal,
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

      <View className="flex-row gap-2.5 pt-3 border-t border-slate-100">
        <Button variant="outline" onPress={onBack} className="flex-1">
          Quay lại
        </Button>
        <Button disabled={!isStepComplete} onPress={onContinue} className="flex-1">
          Tiếp tục: Chọn bác sĩ
        </Button>
      </View>

      <Modal
        animationType="fade"
        hardwareAccelerated
        onRequestClose={() => setDateModalVisible(false)}
        statusBarTranslucent
        transparent
        visible={dateModalVisible}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setDateModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.dateModalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Chọn Ngày Khám</Text>
              <TouchableOpacity
                hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
                onPress={() => setDateModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <FontAwesome6
                  color="#64748B"
                  iconStyle="solid"
                  name="xmark"
                  size={14}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.quickDateRow}>
              {[
                { label: 'Hôm nay', offset: 0 },
                { label: 'Ngày mai', offset: 1 },
                { label: 'Sau 3 ngày', offset: 3 },
                { label: 'Tuần sau', offset: 7 },
              ].map(quickDate => {
                const target = new Date();
                target.setDate(target.getDate() + quickDate.offset);
                const dateId = toDateId(target);
                const isSelected = selectedDateId === dateId;
                const isDisabled = !openDateIds.has(dateId);

                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isDisabled}
                    key={quickDate.label}
                    onPress={() => handleSelectCalendarDate(dateId)}
                    style={[
                      styles.quickDateBtn,
                      isSelected && styles.quickDateBtnSelected,
                      isDisabled && styles.quickDateBtnDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickDateBtnText,
                        isSelected && styles.quickDateBtnTextSelected,
                        isDisabled && styles.quickDateBtnTextDisabled,
                      ]}
                    >
                      {quickDate.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarMonthRow}>
              <TouchableOpacity
                onPress={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(year => year - 1);
                  } else {
                    setCalendarMonth(month => month - 1);
                  }
                }}
                style={styles.calNavBtn}
              >
                <FontAwesome6
                  color="#0058bc"
                  iconStyle="solid"
                  name="chevron-left"
                  size={13}
                />
              </TouchableOpacity>

              <Text style={styles.calendarMonthText}>
                Tháng {String(calendarMonth + 1).padStart(2, '0')} /{' '}
                {calendarYear}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(year => year + 1);
                  } else {
                    setCalendarMonth(month => month + 1);
                  }
                }}
                style={styles.calNavBtn}
              >
                <FontAwesome6
                  color="#0058bc"
                  iconStyle="solid"
                  name="chevron-right"
                  size={13}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekRow}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(dayName => (
                <Text key={dayName} style={styles.calendarWeekText}>
                  {dayName}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {calendarDays.map((item, index) => {
                if (!item) {
                  return <View key={`empty-${index}`} style={styles.calDayCell} />;
                }

                const isSelected = selectedDateId === item.dateStr;
                const isDisabled = !openDateIds.has(item.dateStr);

                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={isDisabled}
                    key={item.dateStr}
                    onPress={() => handleSelectCalendarDate(item.dateStr)}
                    style={[
                      styles.calDayCell,
                      isSelected && styles.calDayCellSelected,
                      isDisabled && styles.calDayCellDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calDayText,
                        isSelected && styles.calDayTextSelected,
                        isDisabled && styles.calDayTextDisabled,
                      ]}
                    >
                      {item.day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  calDayCell: {
    alignItems: 'center',
    borderRadius: 8,
    height: 38,
    justifyContent: 'center',
    width: '14.28%',
  },
  calDayCellDisabled: {
    opacity: 0.25,
  },
  calDayCellSelected: {
    backgroundColor: '#0058bc',
  },
  calDayText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  calDayTextDisabled: {
    color: '#94A3B8',
  },
  calDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calNavBtn: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  calendarMonthRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  calendarMonthText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  calendarWeekRow: {
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: 6,
    paddingTop: 4,
  },
  calendarWeekText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    width: '14.28%',
  },
  dateModalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  dateInput: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    minWidth: 140,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  dateTitleRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    marginRight: 10,
  },
  dateInputText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  dateOption: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateOptionDisabled: {
    opacity: 0.4,
  },
  dateOptionPrimary: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '900',
  },
  dateOptionPrimarySelected: {
    color: '#0058bc',
  },
  dateOptionSecondary: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  dateOptionSecondarySelected: {
    color: '#0058bc',
  },
  dateOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  dateOptionTextCol: {
    flex: 1,
    marginRight: 10,
  },
  dateSelectHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateSelectPanel: {
    paddingTop: 2,
  },
  dateSelectTitle: {
    color: '#0F172A',
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  modalCloseBtn: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingTop: 16,
  },
  modalHeaderTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  quickDateBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  quickDateBtnDisabled: {
    opacity: 0.45,
  },
  quickDateBtnSelected: {
    backgroundColor: '#0058bc',
  },
  quickDateBtnText: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
  },
  quickDateBtnTextDisabled: {
    color: '#94A3B8',
  },
  quickDateBtnTextSelected: {
    color: '#FFFFFF',
  },
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 8,
  },
  stepNumberBadge: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  stepNumberText: {
    color: '#0058bc',
    fontSize: 12,
    fontWeight: '800',
  },
  timeChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 38,
    justifyContent: 'center',
    width: '31%',
  },
  timeChipBlocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  timeChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0058bc',
  },
  timeLoadingBox: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  timeLoadingText: {
    color: '#0058bc',
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  timeTextBlocked: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  timeTextNormal: {
    color: '#334155',
  },
  timeTextSelected: {
    color: '#0058bc',
  },
});
