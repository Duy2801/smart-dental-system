import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { formatMoney } from '../api';
import type { TimelineStepView } from '../types';

type StepInvoiceModalProps = {
  visible: boolean;
  step: TimelineStepView | null;
  onClose: () => void;
};

export function StepInvoiceModal({ visible, step, onClose }: StepInvoiceModalProps) {
  if (!step) return null;

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.iconBox}>
                <FontAwesome6 color="#0863c5" iconStyle="solid" name="file-invoice-dollar" size={18} />
              </View>
              <View style={styles.headerTexts}>
                <Text style={styles.headerEyebrow}>Chi Tiết Hóa Đơn Bước #{step.order}</Text>
                <Text numberOfLines={1} style={styles.headerTitle}>
                  {step.title}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={styles.closeBtn}
            >
              <FontAwesome6 color="#64748B" iconStyle="solid" name="xmark" size={16} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
            {/* Status & Date */}
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.label}>Ngày thực hiện</Text>
                <Text style={styles.value}>{step.date}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{step.paymentStatusLabel}</Text>
              </View>
            </View>

            {/* Cost Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bảng kê chi phí điều trị</Text>

              <View style={styles.itemRow}>
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{step.title}</Text>
                  <Text style={styles.itemSub}>Dịch vụ kỹ thuật nha khoa</Text>
                </View>
                <Text style={styles.itemPrice}>
                  {formatMoney(step.estimatedCost)}
                </Text>
              </View>

              {step.targetTooth ? (
                <View style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>Vị trí răng điều trị</Text>
                    <Text style={styles.itemSub}>Chỉ định theo hồ sơ bệnh án</Text>
                  </View>
                  <Text style={styles.itemTooth}>🦷 {step.targetTooth}</Text>
                </View>
              ) : null}

              {/* Invoices */}
              {step.invoices.map((inv, idx) => (
                <View key={inv.id || idx} style={styles.itemRow}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemName}>Hóa đơn #{inv.invoiceCode}</Text>
                    <Text style={styles.itemSub}>
                      {inv.invoiceType || 'Thanh toán trực tiếp'}
                    </Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    {formatMoney(inv.finalAmount)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Total Section */}
            <View style={styles.totalBox}>
              <View style={styles.totalLine}>
                <Text style={styles.totalLabel}>Tổng chi phí bước:</Text>
                <Text style={styles.totalValue}>
                  {formatMoney(step.estimatedCost)}
                </Text>
              </View>

              <View style={styles.totalLine}>
                <Text style={styles.paidLabel}>Đã thanh toán:</Text>
                <Text style={styles.paidValue}>
                  {formatMoney(step.paymentAmount)}
                </Text>
              </View>

              <View style={[styles.totalLine, styles.dueLine]}>
                <Text style={styles.dueLabel}>Còn lại cần thanh toán:</Text>
                <Text style={styles.dueValue}>
                  {formatMoney(Math.max(0, step.estimatedCost - step.paymentAmount))}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            style={styles.actionBtn}
          >
            <Text style={styles.actionBtnText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 14,
    margin: 16,
    paddingVertical: 12,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  body: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  dueLabel: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  dueLine: {
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    marginTop: 6,
    paddingTop: 8,
  },
  dueValue: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '900',
  },
  header: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerEyebrow: {
    color: '#0863c5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerTexts: {
    marginLeft: 10,
    maxWidth: 220,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  headerTitleGroup: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '700',
  },
  itemPrice: {
    color: '#0863c5',
    fontSize: 13,
    fontWeight: '800',
  },
  itemRow: {
    alignItems: 'center',
    borderBottomColor: '#F8FAFC',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemSub: {
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 2,
  },
  itemTooth: {
    color: '#0863c5',
    fontSize: 12,
    fontWeight: '700',
  },
  label: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    width: '100%',
  },
  overlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  paidLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  paidValue: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
  },
  section: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    marginTop: 12,
    padding: 12,
  },
  sectionTitle: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  statusPill: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  statusPillText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  totalBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    padding: 14,
  },
  totalLabel: {
    color: '#64748B',
    fontSize: 12,
  },
  totalLine: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  totalValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
  },
  value: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
});
