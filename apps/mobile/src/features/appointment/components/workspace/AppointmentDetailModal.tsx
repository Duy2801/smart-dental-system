import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SheetBottomInset } from '~src/components/ui';
import { formatTimeRange } from '../../api';
import type { AppointmentItem } from '../../types';
import { STATUS_META } from './AppointmentRecordCard';

type AppointmentDetailModalProps = {
  appointment: AppointmentItem | null;
  onClose: () => void;
};

/**
 * Chi tiết lịch hẹn — cùng bố cục với ngăn chi tiết trên web:
 * trạng thái + mã, thẻ dịch vụ, bảng thông tin chính, lưu ý (chỉ khi cần) và nút ở bên trái.
 */
export function AppointmentDetailModal({
  appointment,
  onClose,
}: AppointmentDetailModalProps) {
  if (!appointment) return null;

  const status = STATUS_META[appointment.status] ?? STATUS_META.pending;
  const timeRange = formatTimeRange(
    appointment.time,
    appointment.durationMinutes || 30,
  );
  const appointmentCode = `#${appointment.id.slice(0, 8).toUpperCase()}`;
  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled';
  const isCancellationRequested = appointment.status === 'cancellation_requested';
  const isUpcoming =
    appointment.status === 'pending' ||
    appointment.status === 'confirmed' ||
    appointment.status === 'rescheduled';

  // Chỉ hiện lưu ý khi thật sự cần: hướng dẫn trước buổi hẹn, hoặc thông báo về việc hủy lịch
  const notesList = isCancellationRequested
    ? ['Yêu cầu hủy đã được ghi nhận. Lễ tân sẽ xác nhận hoàn tất thủ tục hủy.']
    : isCancelled
      ? ['Lịch hẹn đã được hủy. Bạn có thể đặt lịch khám mới bất cứ lúc nào.']
      : isUpcoming
        ? (appointment.preparation ?? [])
        : [];
  const isCancelNote = isCancelled || isCancellationRequested;

  const infoRows: Array<{ label: string; value: string; hint?: string | null }> = [
    {
      label: isCompleted ? 'Thời gian đã khám' : 'Thời gian hẹn',
      value: timeRange,
      hint: appointment.date,
    },
    {
      label: 'Bệnh nhân',
      value: appointment.patientName || '—',
      hint: appointment.patientRelationship,
    },
    { label: 'Bác sĩ', value: appointment.doctor || '—' },
    {
      label: 'Thời lượng dự kiến',
      value: `${appointment.durationMinutes || 30} phút`,
    },
  ];

  return (
    <Modal
      animationType="slide"
      transparent
      visible={Boolean(appointment)}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Đóng" onPress={onClose} style={StyleSheet.absoluteFill} />

        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerMetaRow}>
              <View
                style={[
                  styles.statusChip,
                  { backgroundColor: status.bg, borderColor: status.border },
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: status.dotColor }]} />
                <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
              </View>
              <Text style={styles.codeText}>{appointmentCode}</Text>
            </View>
            <Text style={styles.title}>Chi tiết lịch hẹn</Text>
          </View>

          {/* Body */}
          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {/* Dịch vụ */}
            <View style={[styles.serviceCard, isCancelled ? styles.serviceCardCancelled : null]}>
              <Text style={styles.sectionLabel}>Dịch vụ</Text>
              <Text style={styles.serviceName}>{appointment.service}</Text>
              {appointment.treatmentMethodName ? (
                <Text style={styles.methodName}>{appointment.treatmentMethodName}</Text>
              ) : null}
            </View>

            {/* Thông tin chính */}
            <View style={styles.infoTable}>
              {infoRows.map((row, index) => (
                <View
                  key={row.label}
                  style={[styles.infoRow, index > 0 ? styles.infoRowDivider : null]}
                >
                  <Text style={styles.infoLabel}>{row.label}</Text>
                  <View style={styles.infoValueCol}>
                    <Text numberOfLines={1} style={styles.infoValue}>
                      {row.value}
                    </Text>
                    {row.hint ? <Text style={styles.infoHint}>{row.hint}</Text> : null}
                  </View>
                </View>
              ))}
            </View>

            {/* Lưu ý */}
            {notesList.length > 0 ? (
              <View>
                <Text style={[styles.sectionLabel, styles.notesHeading]}>Lưu ý</Text>
                <View style={[styles.notesBox, isCancelNote ? styles.notesBoxCancel : null]}>
                  {notesList.map(note => (
                    <View key={note} style={styles.noteRow}>
                      <View
                        style={[
                          styles.noteDot,
                          isCancelNote ? styles.noteDotCancel : null,
                        ]}
                      />
                      <Text style={[styles.noteText, isCancelNote ? styles.noteTextCancel : null]}>
                        {note}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer: nút nằm bên trái, nút chính đứng trước */}
          <View style={styles.footer}>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={onClose}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
          <SheetBottomInset />
        </View>
      </View>
    </Modal>
  );
}

const BRAND = '#0058bc';

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  // Trên tablet giữ bảng ở giữa, không kéo giãn hết chiều ngang
  sheet: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    maxWidth: 720,
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  header: {
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 14,
    paddingTop: 18,
  },
  headerMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  codeText: {
    color: '#94A3B8',
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 6,
  },
  body: {
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  serviceCard: {
    backgroundColor: 'rgba(239, 246, 255, 0.6)',
    borderColor: '#DBEAFE',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  serviceCardCancelled: {
    backgroundColor: 'rgba(255, 241, 242, 0.6)',
    borderColor: '#FECDD3',
  },
  serviceName: {
    color: BRAND,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 4,
  },
  methodName: {
    color: '#475569',
    fontSize: 13.5,
    marginTop: 2,
  },
  infoTable: {
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
  },
  infoRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoRowDivider: {
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
  },
  infoLabel: {
    color: '#64748B',
    fontSize: 12.5,
    fontWeight: '600',
    paddingTop: 1,
  },
  infoValueCol: {
    alignItems: 'flex-end',
    flexShrink: 1,
  },
  infoValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  infoHint: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 1,
    textAlign: 'right',
  },
  notesHeading: {
    marginBottom: 8,
  },
  notesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    gap: 6,
    padding: 16,
  },
  notesBoxCancel: {
    backgroundColor: 'rgba(255, 241, 242, 0.7)',
  },
  noteRow: {
    flexDirection: 'row',
    gap: 8,
  },
  noteDot: {
    backgroundColor: '#94A3B8',
    borderRadius: 2,
    height: 4,
    marginTop: 9,
    width: 4,
  },
  noteDotCancel: {
    backgroundColor: '#F43F5E',
  },
  noteText: {
    color: '#334155',
    flex: 1,
    fontSize: 13.5,
    lineHeight: 21,
  },
  noteTextCancel: {
    color: '#9F1239',
  },
  footer: {
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: BRAND,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
