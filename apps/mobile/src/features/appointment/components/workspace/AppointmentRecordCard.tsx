import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatTimeRange } from '../../api';
import type { AppointmentItem, AppointmentStatus } from '../../types';

type AppointmentRecordCardProps = {
  appointment: AppointmentItem;
  onViewDetail?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  canCancel?: boolean;
  isCancelling?: boolean;
};

const STATUS_META: Record<
  AppointmentStatus,
  { label: string; dotColor: string; bg: string; text: string; border: string }
> = {
  confirmed: {
    label: 'Đã xác nhận',
    dotColor: '#10B981',
    bg: '#ECFDF5',
    text: '#047857',
    border: '#A7F3D0',
  },
  pending: {
    label: 'Chờ xác nhận',
    dotColor: '#F59E0B',
    bg: '#FFFBEB',
    text: '#B45309',
    border: '#FDE68A',
  },
  completed: {
    label: 'Hoàn thành',
    dotColor: '#3B82F6',
    bg: '#EFF6FF',
    text: '#1D4ED8',
    border: '#BFDBFE',
  },
  cancelled: {
    label: 'Đã hủy',
    dotColor: '#EF4444',
    bg: '#FEF2F2',
    text: '#B91C1C',
    border: '#FECACA',
  },
  missed: {
    label: 'Vắng mặt',
    dotColor: '#94A3B8',
    bg: '#F8FAFC',
    text: '#64748B',
    border: '#E2E8F0',
  },
  in_progress: {
    label: 'Đang khám',
    dotColor: '#06B6D4',
    bg: '#ECFEFF',
    text: '#0E7490',
    border: '#A5F3FC',
  },
  rescheduled: {
    label: 'Đã đổi lịch',
    dotColor: '#8B5CF6',
    bg: '#F5F3FF',
    text: '#6D28D9',
    border: '#DDD6FE',
  },
};

export function AppointmentRecordCard({
  appointment,
  onViewDetail,
  onReschedule,
  onCancel,
  canCancel = false,
  isCancelling = false,
}: AppointmentRecordCardProps) {
  const meta = STATUS_META[appointment.status] ?? STATUS_META.pending;
  const timeRange = formatTimeRange(appointment.time, appointment.durationMinutes || 30);
  const notes = appointment.preparation ?? [];

  const now = Date.now();
  const scheduledTime = new Date(appointment.scheduledAt).getTime();
  const hoursUntil = (scheduledTime - now) / (1000 * 60 * 60);
  const isUpcoming =
    appointment.status === 'pending' || appointment.status === 'confirmed';
  const isUnder12Hours = isUpcoming && hoursUntil < 12 && hoursUntil > 0;

  return (
    <View style={styles.cardContainer}>
      {/* Header Row: Doctor Name + Status Badge */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2 min-w-0 flex-1">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <Text className="text-xs font-black text-[#0058bc]">
              {appointment.initials}
            </Text>
          </View>
          <View className="min-w-0 flex-1">
            <Text numberOfLines={1} className="text-sm font-black text-slate-900">
              BS. {appointment.doctor}
            </Text>
            <Text numberOfLines={1} className="text-[11px] font-bold text-[#0058bc]">
              {appointment.service}
            </Text>
          </View>
        </View>

        {/* Status Chip */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: meta.bg, borderColor: meta.border },
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: meta.dotColor }]} />
          <Text style={[styles.statusText, { color: meta.text }]}>
            {meta.label}
          </Text>
        </View>
      </View>

      {/* Date & Time Row */}
      <View className="mt-3 flex-row items-center gap-2 rounded-xl bg-slate-50 p-2.5">
        <FontAwesome6 color="#0058bc" iconStyle="solid" name="clock" size={13} />
        <Text className="text-xs font-bold text-slate-700 flex-1">
          {timeRange} • <Text className="font-medium text-slate-500">{appointment.date}</Text>
        </Text>
      </View>

      {/* Preparation Notes Tag list if any */}
      {notes.length > 0 ? (
        <View className="mt-2.5 flex-row flex-wrap gap-1.5">
          {notes.slice(0, 2).map((note, idx) => (
            <View
              key={idx}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1"
            >
              <Text numberOfLines={1} className="text-[10px] font-medium text-slate-600">
                • {note}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Action Buttons Row */}
      <View className="mt-3.5 flex-row items-center gap-2 border-t border-slate-100 pt-3">
        {onViewDetail ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onViewDetail}
            style={styles.detailButton}
          >
            <FontAwesome6 color="#64748B" iconStyle="solid" name="eye" size={12} />
            <Text style={styles.detailButtonText}>Chi tiết</Text>
          </TouchableOpacity>
        ) : null}

        {onReschedule ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onReschedule}
            style={styles.rescheduleButton}
          >
            <Text style={styles.rescheduleButtonText}>Đổi lịch</Text>
          </TouchableOpacity>
        ) : null}

        {canCancel && onCancel ? (
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isCancelling}
            onPress={onCancel}
            style={styles.cancelButton}
          >
            {isCancelling ? (
              <ActivityIndicator color="#E11D48" size="small" />
            ) : (
              <Text style={styles.cancelButtonText}>Hủy lịch</Text>
            )}
          </TouchableOpacity>
        ) : isUnder12Hours ? (
          <View style={styles.disabledCancelPill}>
            <Text style={styles.disabledCancelText}>
              Dưới 12h (Gọi lễ tân)
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderRadius: 12,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    color: '#E11D48',
    fontSize: 11,
    fontWeight: '800',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  detailButton: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    height: 36,
    justifyContent: 'center',
  },
  detailButtonText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
  },
  disabledCancelPill: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  disabledCancelText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  rescheduleButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 12,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  rescheduleButtonText: {
    color: '#0058bc',
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
