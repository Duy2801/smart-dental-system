import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Button } from '~src/components/ui';
import { formatTimeRange } from '../../api';
import type { AppointmentItem } from '../../types';

type AppointmentDetailModalProps = {
  appointment: AppointmentItem | null;
  onClose: () => void;
};

export function AppointmentDetailModal({
  appointment,
  onClose,
}: AppointmentDetailModalProps) {
  if (!appointment) return null;

  const timeRange = formatTimeRange(
    appointment.time,
    appointment.durationMinutes || 30,
  );
  const appointmentCode = `#${appointment.id.slice(0, 8).toUpperCase()}`;

  const notesList = appointment.preparation?.length
    ? appointment.preparation
    : [
        'Đến trước giờ hẹn 10-15 phút để làm thủ tục check-in tại quầy',
        'Mang theo hồ sơ điều trị hoặc kết quả chụp phim gần nhất nếu có',
      ];

  return (
    <Modal
      animationType="fade"
      transparent
      visible={Boolean(appointment)}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Top Blue Accent Bar */}
          <View className="h-1.5 w-full bg-[#0058bc] rounded-t-3xl" />

          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-100 p-4">
            <View>
              <View className="rounded-md bg-blue-50 px-2 py-0.5 self-start">
                <Text className="text-[10px] font-black uppercase text-[#0058bc]">
                  Mã cuộc hẹn: {appointmentCode}
                </Text>
              </View>
              <Text className="mt-1 text-base font-black text-slate-900">
                Chi tiết cuộc hẹn nha khoa
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100"
            >
              <FontAwesome6 color="#64748B" iconStyle="solid" name="xmark" size={14} />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView showsVerticalScrollIndicator={false} className="p-4 space-y-3">
            {/* Info Grid Card */}
            <View className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 gap-2.5">
              {/* Row 1: Bác sĩ */}
              <View className="flex-row items-start gap-2.5">
                <View className="h-7 w-7 items-center justify-center rounded-lg bg-blue-100 mt-0.5">
                  <FontAwesome6 color="#0058bc" iconStyle="solid" name="user-doctor" size={12} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase text-slate-400">
                    Bác sĩ phụ trách
                  </Text>
                  <Text className="text-sm font-black text-slate-900">
                    BS. {appointment.doctor}
                  </Text>
                </View>
              </View>

              {/* Row 2: Dịch vụ */}
              <View className="flex-row items-start gap-2.5">
                <View className="h-7 w-7 items-center justify-center rounded-lg bg-sky-100 mt-0.5">
                  <FontAwesome6 color="#0284C7" iconStyle="solid" name="tooth" size={12} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase text-slate-400">
                    Dịch vụ khám
                  </Text>
                  <Text className="text-sm font-black text-slate-900">
                    {appointment.service}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    Thời lượng dự kiến: {appointment.durationMinutes} phút
                  </Text>
                </View>
              </View>

              {/* Row 3: Thời gian */}
              <View className="flex-row items-start gap-2.5">
                <View className="h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 mt-0.5">
                  <FontAwesome6 color="#059669" iconStyle="solid" name="calendar-days" size={12} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase text-slate-400">
                    Thời gian hẹn
                  </Text>
                  <Text className="text-sm font-black text-slate-900">
                    {timeRange}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    {appointment.date}
                  </Text>
                </View>
              </View>

              {/* Row 4: Người khám */}
              {appointment.patientName ? (
                <View className="flex-row items-start gap-2.5">
                  <View className="h-7 w-7 items-center justify-center rounded-lg bg-violet-100 mt-0.5">
                    <FontAwesome6 color="#7C3AED" iconStyle="solid" name="user" size={12} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[10px] font-bold uppercase text-slate-400">
                      Bệnh nhân đi khám
                    </Text>
                    <Text className="text-sm font-black text-slate-900">
                      {appointment.patientName}
                    </Text>
                    {appointment.patientRelationship ? (
                      <Text className="text-xs text-slate-500">
                        Quan hệ: {appointment.patientRelationship}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>

            {/* Preparation Notes */}
            <View className="rounded-2xl border border-slate-200 bg-white p-3.5 mt-3">
              <Text className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Hướng dẫn & Lưu ý
              </Text>
              <View className="gap-1.5">
                {notesList.map((note, index) => (
                  <View key={index} className="flex-row items-start gap-2">
                    <Text className="text-emerald-600 font-black text-xs">✓</Text>
                    <Text className="text-xs text-slate-600 flex-1 leading-4">
                      {note}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Close Button */}
            <View className="pt-4 pb-2">
              <Button onPress={onClose} className="w-full">
                Đóng
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    elevation: 5,
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    width: '100%',
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
