import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SheetBottomInset } from '~src/components/ui';
import { formatCurrency } from '../../api';
import type { AppointmentInvoice } from '../../utils/appointmentFinancials';

type AppointmentInvoiceSheetProps = {
  invoice: AppointmentInvoice;
  patientName?: string | null;
  doctorName: string;
  treatmentMethod: string;
  onBack: () => void;
};

const BRAND = '#0058bc';

export const PAYMENT_STATE_META: Record<
  AppointmentInvoice['paymentState'],
  { label: string; bg: string; text: string; border: string }
> = {
  unpaid: {
    label: 'Chưa thanh toán',
    bg: '#FFFBEB',
    text: '#B45309',
    border: '#FDE68A',
  },
  partial: {
    label: 'Thanh toán một phần',
    bg: '#FFFBEB',
    text: '#B45309',
    border: '#FDE68A',
  },
  paid: {
    label: 'Đã thanh toán',
    bg: '#EFF6FF',
    text: BRAND,
    border: '#BFDBFE',
  },
  cancelled: {
    label: 'Đã hủy / hoàn tiền',
    bg: '#F1F5F9',
    text: '#64748B',
    border: '#E2E8F0',
  },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  CARD: 'Thẻ',
  BANK_TRANSFER: 'Chuyển khoản',
  E_WALLET: 'Ví điện tử',
  ONLINE_GATEWAY: 'Cổng thanh toán trực tuyến',
};

export const formatDateTime = (value?: string | null) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

/** Hóa đơn chi tiết — cùng nội dung với hộp hóa đơn trên web */
export function AppointmentInvoiceSheet({
  invoice,
  patientName,
  doctorName,
  treatmentMethod,
  onBack,
}: AppointmentInvoiceSheetProps) {
  const state = PAYMENT_STATE_META[invoice.paymentState];
  const items = invoice.items.length
    ? invoice.items
    : [
        {
          description: treatmentMethod,
          quantity: 1,
          unitPrice: invoice.subtotal,
          amount: invoice.subtotal,
        },
      ];
  const successfulPayments = invoice.payments.filter(
    payment => payment.status.toUpperCase() === 'SUCCESS',
  );

  const infoCards = [
    { label: 'Bệnh nhân', value: patientName || 'Bệnh nhân' },
    { label: 'Bác sĩ thực hiện', value: doctorName },
    { label: 'Ngày phát hành', value: formatDateTime(invoice.issuedAt) },
  ];

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <Text style={styles.brandText}>Smart Dental System</Text>
        <Text style={styles.title}>Hóa đơn dịch vụ nha khoa</Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeLabel}>Mã hóa đơn:</Text>
          <Text style={styles.codeValue}>{invoice.invoiceCode}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoGrid}>
          {infoCards.map(card => (
            <View key={card.label} style={styles.infoCard}>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
            </View>
          ))}
        </View>

        {/* Chi tiết dịch vụ */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Chi tiết dịch vụ</Text>
          </View>
          {items.map((item, index) => (
            <View
              key={`${item.description}-${index}`}
              style={[styles.itemRow, index > 0 ? styles.divider : null]}
            >
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.description}</Text>
                <Text style={styles.itemMeta}>
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </Text>
              </View>
              <Text style={styles.itemAmount}>
                {formatCurrency(item.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Lịch sử thanh toán */}
        <View style={[styles.panel, styles.panelPadded]}>
          <Text style={styles.sectionLabel}>Lịch sử thanh toán</Text>
          {successfulPayments.length ? (
            <View style={styles.paymentList}>
              {successfulPayments.map(payment => (
                <View key={payment.id} style={styles.paymentRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.paymentMethod}>
                      {payment.paymentMethod
                        ? PAYMENT_METHOD_LABELS[payment.paymentMethod] ??
                          payment.paymentMethod
                        : 'Chưa cập nhật'}
                    </Text>
                    <Text style={styles.paymentDate}>
                      {formatDateTime(payment.paidAt)}
                    </Text>
                  </View>
                  <Text style={styles.paymentAmount}>
                    {formatCurrency(payment.amount)}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Chưa ghi nhận giao dịch thanh toán thành công.
            </Text>
          )}
        </View>

        {/* Tổng kết */}
        <View style={[styles.panel, styles.panelPadded, styles.summaryPanel]}>
          <SummaryRow
            label="Tạm tính"
            value={formatCurrency(invoice.subtotal)}
          />
          {invoice.discountAmount > 0 ? (
            <SummaryRow
              label="Giảm giá"
              value={`-${formatCurrency(invoice.discountAmount)}`}
              valueColor="#059669"
            />
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.finalAmount)}
            </Text>
          </View>
          <SummaryRow
            label="Đã thanh toán"
            value={formatCurrency(invoice.paidAmount)}
          />
          <SummaryRow
            label="Còn phải trả"
            value={formatCurrency(invoice.remainingAmount)}
          />
          <View style={styles.stateRow}>
            <Text style={styles.stateLabel}>Trạng thái</Text>
            <View
              style={[
                styles.stateBadge,
                { backgroundColor: state.bg, borderColor: state.border },
              ]}
            >
              <Text style={[styles.stateText, { color: state.text }]}>
                ✓ {state.label}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.85}
          onPress={onBack}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
      <SheetBottomInset />
    </View>
  );
}

function SummaryRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text
        style={[styles.summaryValue, valueColor ? { color: valueColor } : null]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    maxWidth: 720,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    backgroundColor: BRAND,
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  brandText: {
    color: '#DBEAFE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  codeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  codeLabel: {
    color: '#DBEAFE',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  codeValue: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  body: {
    backgroundColor: '#F8FAFC',
    gap: 12,
    padding: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DBEAFE',
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: 140,
    flexGrow: 1,
    padding: 12,
  },
  cardLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardValue: {
    color: '#0F172A',
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 3,
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  panelPadded: {
    padding: 14,
  },
  panelHeader: {
    backgroundColor: 'rgba(239, 246, 255, 0.7)',
    borderBottomColor: '#DBEAFE',
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  panelTitle: {
    color: BRAND,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  itemRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  divider: {
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    color: '#1E293B',
    fontSize: 13.5,
    fontWeight: '700',
  },
  itemMeta: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  itemAmount: {
    color: BRAND,
    flexShrink: 0,
    fontSize: 13.5,
    fontWeight: '800',
  },
  sectionLabel: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  paymentList: {
    gap: 8,
    marginTop: 10,
  },
  paymentRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(239, 246, 255, 0.5)',
    borderColor: '#DBEAFE',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  paymentMethod: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
  },
  paymentDate: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  paymentAmount: {
    color: BRAND,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 12.5,
    marginTop: 8,
  },
  summaryPanel: {
    borderColor: '#DBEAFE',
    gap: 7,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  summaryValue: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  totalRow: {
    alignItems: 'center',
    borderTopColor: '#DBEAFE',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  totalLabel: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  totalValue: {
    color: BRAND,
    fontSize: 16,
    fontWeight: '900',
  },
  stateRow: {
    alignItems: 'center',
    borderTopColor: '#DBEAFE',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 9,
  },
  stateLabel: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '600',
  },
  stateBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  stateText: {
    fontSize: 11,
    fontWeight: '800',
  },
  footer: {
    borderTopColor: '#F1F5F9',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
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
