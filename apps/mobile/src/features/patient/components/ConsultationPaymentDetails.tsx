import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { queryKeys } from '~src/config/queryClient';
import {
  formatVnd,
  getConsultationPaymentInfo,
  unwrapData,
  type ConsultationBookingResult,
  type ConsultationPaymentInfo,
} from '../api';

type Props = {
  consultationId: string;
  bookingResult?: ConsultationBookingResult;
  onPaymentConfirmed: () => void;
};

export function ConsultationPaymentDetails({
  consultationId,
  bookingResult,
  onPaymentConfirmed,
}: Props) {
  const queryClient = useQueryClient();
  const confirmedRef = useRef(false);

  const initialPaymentData: ConsultationPaymentInfo | undefined =
    bookingResult && (bookingResult.payment || bookingResult.invoice)
      ? {
          consultationId,
          isPaid: Boolean(bookingResult.consultation?.isPaid),
          fee: bookingResult.consultation?.fee,
          invoice: bookingResult.invoice,
          payment: bookingResult.payment,
        }
      : undefined;

  const paymentQuery = useQuery({
    queryKey: ['consultation', 'payment', consultationId],
    queryFn: async () => {
      const res = await getConsultationPaymentInfo(consultationId);
      return unwrapData<ConsultationPaymentInfo>(res);
    },
    initialData: initialPaymentData,
    refetchInterval: query => {
      const qData = unwrapData<ConsultationPaymentInfo>(query.state.data);
      return qData?.isPaid ? false : 4000;
    },
    enabled: Boolean(consultationId),
  });

  const raw = paymentQuery.data as any;
  const data: ConsultationPaymentInfo | undefined =
    raw?.data && (raw.status !== undefined || raw.statusCode !== undefined)
      ? raw.data
      : raw;

  useEffect(() => {
    if (data?.isPaid && !confirmedRef.current) {
      confirmedRef.current = true;
      queryClient.invalidateQueries({
        queryKey: queryKeys.consultations.myList,
      });
      queryClient.invalidateQueries({
        queryKey: ['consultation', 'my-consultations'],
      });
      onPaymentConfirmed();
    }
  }, [data?.isPaid, queryClient, onPaymentConfirmed]);

  if (paymentQuery.isPending && !data) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color="#0058bc" size="large" />
        <Text style={styles.loadingText}>Đang lấy mã VietQR...</Text>
      </View>
    );
  }

  if (paymentQuery.isError && !data) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>
          Không thể lấy thông tin thanh toán. Vui lòng thử lại.
        </Text>
        <TouchableOpacity
          onPress={() => paymentQuery.refetch()}
          style={styles.retryBtn}
        >
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color="#0058bc" size="large" />
        <Text style={styles.loadingText}>Đang tải thông tin thanh toán...</Text>
      </View>
    );
  }

  const { isPaid, invoice, payment } = data;

  if (isPaid) {
    return (
      <View style={styles.paidBox}>
        <Text style={styles.paidTitle}>
          Thanh toán đã được xác nhận thành công!
        </Text>
        <Text style={styles.paidSub}>
          Lịch tư vấn của bạn đã được giữ chỗ.
        </Text>
      </View>
    );
  }

  if (!payment) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>
          Thông tin thanh toán chưa sẵn sàng.
        </Text>
        <TouchableOpacity
          onPress={() => paymentQuery.refetch()}
          style={styles.retryBtn}
        >
          <Text style={styles.retryBtnText}>Tải lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const transferContent = payment.transferContent || '';
  const finalAmount = payment.amount ?? invoice?.finalAmount ?? 0;
  const invoiceCode = invoice?.invoiceCode || payment.invoiceCode || 'INV-VC';

  return (
    <View style={styles.container}>
      <View style={styles.alertBanner}>
        <Text style={styles.alertTitle}>Thanh toán 100% để giữ lịch</Text>
        <Text style={styles.alertSub}>
          Vui lòng chuyển khoản trong 15 phút để xác nhận lịch tư vấn.
        </Text>
      </View>

      <View style={styles.qrCard}>
        <Text style={styles.qrTitle}>Quét mã VietQR chuyển khoản nhanh</Text>
        {payment.qrImageUrl ? (
          <Image
            accessibilityLabel="Mã VietQR thanh toán tư vấn"
            resizeMode="contain"
            source={{ uri: payment.qrImageUrl }}
            style={styles.qrImage}
          />
        ) : (
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrPlaceholderText}>Mã QR chưa sẵn sàng</Text>
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoRow}>
          Mã hóa đơn:{' '}
          <Text style={styles.infoHighlight}>{invoiceCode}</Text>
        </Text>
        <Text style={styles.infoRow}>
          Ngân hàng: <Text style={styles.infoBold}>{payment.bankName}</Text>
        </Text>
        <Text style={styles.infoRow}>
          Số tài khoản:{' '}
          <Text style={styles.infoBold}>{payment.bankAccountNo}</Text>
        </Text>
        <Text style={styles.infoRow}>
          Chủ tài khoản:{' '}
          <Text style={styles.infoBold}>{payment.bankAccountName}</Text>
        </Text>
        <Text style={styles.infoRow}>
          Số tiền (100%):{' '}
          <Text style={styles.infoAmount}>{formatVnd(finalAmount)}</Text>
        </Text>

        <View style={styles.transferContentBox}>
          <Text style={styles.transferContentLabel}>Nội dung chuyển khoản</Text>
          <Text selectable style={styles.transferContentText}>
            {transferContent}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => paymentQuery.refetch()}
        style={styles.checkPaymentBtn}
      >
        <Text style={styles.checkPaymentBtnText}>Kiểm tra thanh toán</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 10,
  },
  errorBox: {
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  errorText: {
    color: '#BE123C',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#0058bc',
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  paidBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  paidTitle: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '800',
  },
  paidSub: {
    color: '#15803D',
    fontSize: 12.5,
    marginTop: 4,
  },
  alertBanner: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  alertTitle: {
    color: '#92400E',
    fontSize: 13.5,
    fontWeight: '800',
  },
  alertSub: {
    color: '#B45309',
    fontSize: 12,
    marginTop: 3,
  },
  qrCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  qrTitle: {
    color: '#0058bc',
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 12,
  },
  qrImage: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 220,
    width: 220,
  },
  qrPlaceholder: {
    alignItems: 'center',
    height: 220,
    justifyContent: 'center',
    width: 220,
  },
  qrPlaceholderText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  infoRow: {
    color: '#475569',
    fontSize: 12.5,
  },
  infoHighlight: {
    color: '#0058bc',
    fontWeight: '700',
  },
  infoBold: {
    color: '#0F172A',
    fontWeight: '700',
  },
  infoAmount: {
    color: '#16A34A',
    fontSize: 13.5,
    fontWeight: '800',
  },
  transferContentBox: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    padding: 12,
  },
  transferContentLabel: {
    color: '#1D4ED8',
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  transferContentText: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '800',
  },
  checkPaymentBtn: {
    alignItems: 'center',
    borderColor: '#BFDBFE',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 12,
  },
  checkPaymentBtnText: {
    color: '#0058bc',
    fontSize: 13.5,
    fontWeight: '800',
  },
});
