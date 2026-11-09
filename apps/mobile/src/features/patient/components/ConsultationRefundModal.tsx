import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SheetBottomInset } from '~src/components/ui';
import {
  createConsultationRefundRequest,
  formatVnd,
  type PatientConsultation,
} from '../api';

type Props = {
  consultation: PatientConsultation;
  onClose: () => void;
  /** Gọi sau khi bệnh nhân bấm "Hoàn tất" ở màn hình gửi thành công */
  onSuccess: () => void;
};

type Method = 'BANK_ACCOUNT' | 'VIETQR_IMAGE';

const COMMON_BANKS = [
  'MBBank (Ngân hàng Quân Đội)',
  'Vietcombank (VCB)',
  'Techcombank (TCB)',
  'VPBank',
  'BIDV',
  'Agribank',
  'ACB (Ngân hàng Á Châu)',
  'Sacombank',
  'TPBank',
  'VietinBank',
  'VIB',
  'HDBank',
  'MoMo Wallet',
  'ZaloPay Wallet',
  'Ngân hàng khác',
];

const MAX_QR_BYTES = 5 * 1024 * 1024;

/** Chính sách hoàn tiền giống web: >24h hoàn 100%, 4–24h hoàn 50%, <4h không hoàn */
export function getRefundPolicy(scheduledAt: string, now = Date.now()) {
  const hoursUntil = (new Date(scheduledAt).getTime() - now) / (1000 * 60 * 60);
  if (hoursUntil > 24) {
    return { percent: 100, text: 'Hủy trước >24 tiếng: Hoàn 100% phí tư vấn' };
  }
  if (hoursUntil >= 4) {
    return { percent: 50, text: 'Hủy trước 4h - 24h: Hoàn 50% phí tư vấn' };
  }
  return { percent: 0, text: 'Hủy dưới 4h: Không đủ điều kiện hoàn tiền' };
}

/** Đọc tệp ảnh đã chọn thành data URL (base64) để gửi kèm yêu cầu, giống web */
async function readFileAsDataUrl(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Không đọc được tệp ảnh.'));
    reader.readAsDataURL(blob);
  });
}

export function ConsultationRefundModal({ consultation, onClose, onSuccess }: Props) {
  const [method, setMethod] = useState<Method>('BANK_ACCOUNT');
  const [bankName, setBankName] = useState(COMMON_BANKS[0]);
  const [customBank, setCustomBank] = useState('');
  const [bankListOpen, setBankListOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrFileName, setQrFileName] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ bankName: string; accountNumber: string } | null>(null);

  const policy = getRefundPolicy(consultation.scheduledAt);
  const fee = Number(consultation.fee || 0);
  const expectedRefund = Math.round((fee * policy.percent) / 100);

  const chooseQrImage = async () => {
    try {
      const [file] = await pick({ type: [types.images] });
      if (file.size && file.size > MAX_QR_BYTES) {
        setErrorMsg('Dung lượng tệp ảnh không được vượt quá 5MB.');
        return;
      }
      const dataUrl = await readFileAsDataUrl(file.uri);
      setQrCodeUrl(dataUrl);
      setQrFileName(file.name || 'ma-vietqr.png');
      setErrorMsg(null);
    } catch (cause) {
      if (!isErrorWithCode(cause) || cause.code !== errorCodes.OPERATION_CANCELED) {
        setErrorMsg('Không chọn được ảnh. Vui lòng thử lại.');
      }
    }
  };

  const handleSubmit = async () => {
    if (policy.percent === 0) {
      setErrorMsg('Đơn tư vấn hủy sát giờ (<4 tiếng) nên không thuộc diện áp dụng hoàn tiền.');
      return;
    }

    let finalBankName: string;
    let finalAccountNumber: string;
    let finalAccountHolder: string;

    if (method === 'BANK_ACCOUNT') {
      finalBankName = bankName === 'Ngân hàng khác' ? customBank.trim() : bankName;
      finalAccountNumber = accountNumber.trim();
      finalAccountHolder = accountHolder.trim().toUpperCase();
      if (!finalBankName) return setErrorMsg('Vui lòng chọn hoặc nhập tên ngân hàng.');
      if (!finalAccountNumber) return setErrorMsg('Vui lòng nhập số tài khoản ngân hàng.');
      if (!finalAccountHolder) return setErrorMsg('Vui lòng nhập tên chủ tài khoản.');
    } else {
      if (!qrCodeUrl) return setErrorMsg('Vui lòng tải lên ảnh Mã QR ngân hàng của bạn.');
      finalBankName = 'Thanh toán qua Mã VietQR';
      finalAccountNumber = 'Quét Mã QR Đính Kèm';
      finalAccountHolder = accountHolder.trim().toUpperCase() || 'CHỦ TÀI KHOẢN VIETQR';
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createConsultationRefundRequest({
        videoConsultationId: consultation.id,
        bankName: finalBankName,
        accountNumber: finalAccountNumber,
        accountHolder: finalAccountHolder,
        qrCodeUrl: qrCodeUrl || undefined,
        reason: reason.trim() || undefined,
      });
      setSubmitted({ bankName: finalBankName, accountNumber: finalAccountNumber });
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setErrorMsg(
        (Array.isArray(msg) ? msg.join(', ') : msg) ||
          'Gửi yêu cầu hoàn tiền không thành công. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const finish = () => {
    onSuccess();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={submitted ? finish : onClose}
      statusBarTranslucent
      transparent
      visible
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableWithoutFeedback onPress={submitted ? finish : onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          {submitted ? (
            <View style={styles.successBody}>
              <View style={styles.successIcon}>
                <FontAwesome6 color="#059669" iconStyle="solid" name="check" size={26} />
              </View>
              <Text style={styles.successTitle}>Gửi yêu cầu hoàn tiền thành công!</Text>
              <Text style={styles.successSub}>
                Lễ tân đã ghi nhận thông tin và sẽ kiểm tra, chuyển khoản cho bạn trong thời gian sớm nhất.
              </Text>

              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Số tiền hoàn dự kiến</Text>
                  <Text style={styles.summaryAmount}>{formatVnd(expectedRefund)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Nhận qua</Text>
                  <Text numberOfLines={1} style={styles.summaryValue}>{submitted.bankName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Số tài khoản</Text>
                  <Text numberOfLines={1} style={styles.summaryValue}>{submitted.accountNumber}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Trạng thái</Text>
                  <Text style={styles.pendingBadge}>Đang chờ lễ tân xác nhận</Text>
                </View>
              </View>

              <TouchableOpacity activeOpacity={0.85} onPress={finish} style={[styles.primaryBtn, styles.successBtn]}>
                <Text style={styles.primaryBtnText}>Hoàn tất & xem danh sách</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.headerTextCol}>
                  <Text style={styles.headerEyebrow}>Hủy đơn & hoàn tiền</Text>
                  <Text style={styles.headerTitle}>Nhận tiền hoàn qua chuyển khoản</Text>
                  <Text numberOfLines={1} style={styles.headerSub}>
                    Bác sĩ: {consultation.doctor} • Phí: {formatVnd(fee)}
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityLabel="Đóng"
                  hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}
                  onPress={onClose}
                  style={styles.closeBtn}
                >
                  <FontAwesome6 color="#64748B" iconStyle="solid" name="xmark" size={14} />
                </TouchableOpacity>
              </View>

              <ScrollView
                contentContainerStyle={styles.body}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Chính sách */}
                <View style={styles.policyCard}>
                  <View style={styles.policyHeadRow}>
                    <Text style={styles.policyTitle}>Chính sách hủy đơn & hoàn tiền</Text>
                    <Text style={styles.policyPercent}>{policy.percent}% hoàn</Text>
                  </View>
                  <Text style={styles.policyText}>{policy.text}</Text>
                  <View style={styles.policyTotalRow}>
                    <Text style={styles.policyTotalLabel}>Số tiền hoàn thực nhận</Text>
                    <Text style={styles.policyTotalValue}>{formatVnd(expectedRefund)}</Text>
                  </View>
                </View>

                {errorMsg ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                {/* Phương thức nhận tiền */}
                <Text style={styles.label}>
                  Phương thức nhận tiền <Text style={styles.required}>*</Text>
                </Text>
                <View style={styles.segment}>
                  {(
                    [
                      { key: 'BANK_ACCOUNT', label: 'Nhập số tài khoản', icon: 'building-columns' },
                      { key: 'VIETQR_IMAGE', label: 'Tải mã VietQR', icon: 'qrcode' },
                    ] as const
                  ).map(option => {
                    const active = method === option.key;
                    return (
                      <TouchableOpacity
                        activeOpacity={0.85}
                        key={option.key}
                        onPress={() => {
                          setMethod(option.key);
                          setErrorMsg(null);
                        }}
                        style={[styles.segmentBtn, active && styles.segmentBtnActive]}
                      >
                        <FontAwesome6
                          color={active ? '#E11D48' : '#64748B'}
                          iconStyle="solid"
                          name={option.icon}
                          size={12}
                        />
                        <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {method === 'BANK_ACCOUNT' ? (
                  <View style={styles.groupBox}>
                    <Text style={styles.label}>
                      Ngân hàng nhận tiền <Text style={styles.required}>*</Text>
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => setBankListOpen(open => !open)}
                      style={styles.selectBox}
                    >
                      <Text numberOfLines={1} style={styles.selectText}>{bankName}</Text>
                      <FontAwesome6
                        color="#94A3B8"
                        iconStyle="solid"
                        name={bankListOpen ? 'chevron-up' : 'chevron-down'}
                        size={12}
                      />
                    </TouchableOpacity>
                    {bankListOpen ? (
                      <View style={styles.bankList}>
                        {COMMON_BANKS.map(bank => (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            key={bank}
                            onPress={() => {
                              setBankName(bank);
                              setBankListOpen(false);
                            }}
                            style={[styles.bankItem, bankName === bank && styles.bankItemActive]}
                          >
                            <Text style={[styles.bankItemText, bankName === bank && styles.bankItemTextActive]}>
                              {bank}
                            </Text>
                            {bankName === bank ? (
                              <FontAwesome6 color="#E11D48" iconStyle="solid" name="check" size={11} />
                            ) : null}
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                    {bankName === 'Ngân hàng khác' ? (
                      <TextInput
                        onChangeText={setCustomBank}
                        placeholder="Nhập tên ngân hàng của bạn..."
                        placeholderTextColor="#94A3B8"
                        style={[styles.input, styles.inputSpaced]}
                        value={customBank}
                      />
                    ) : null}

                    <Text style={[styles.label, styles.labelSpaced]}>
                      Số tài khoản <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      keyboardType="number-pad"
                      onChangeText={setAccountNumber}
                      placeholder="Ví dụ: 0987654321"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                      value={accountNumber}
                    />

                    <Text style={[styles.label, styles.labelSpaced]}>
                      Tên chủ tài khoản <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      autoCapitalize="characters"
                      onChangeText={value => setAccountHolder(value.toUpperCase())}
                      placeholder="Ví dụ: NGUYEN VAN A"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                      value={accountHolder}
                    />
                  </View>
                ) : (
                  <View style={styles.groupBox}>
                    <Text style={styles.label}>
                      Ảnh mã VietQR ngân hàng <Text style={styles.required}>*</Text>
                    </Text>
                    {qrCodeUrl ? (
                      <View style={styles.qrPreviewRow}>
                        <Image source={{ uri: qrCodeUrl }} style={styles.qrPreview} />
                        <View style={styles.qrPreviewText}>
                          <Text numberOfLines={1} style={styles.qrFileName}>{qrFileName}</Text>
                          <Text style={styles.qrReady}>Đã sẵn sàng gửi cho lễ tân</Text>
                        </View>
                        <TouchableOpacity activeOpacity={0.8} onPress={chooseQrImage} style={styles.qrChangeBtn}>
                          <Text style={styles.qrChangeText}>Đổi ảnh</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity activeOpacity={0.85} onPress={chooseQrImage} style={styles.uploadBox}>
                        <FontAwesome6 color="#64748B" iconStyle="solid" name="image" size={20} />
                        <Text style={styles.uploadTitle}>Chọn ảnh mã QR từ thiết bị</Text>
                        <Text style={styles.uploadHint}>PNG, JPG, WebP (tối đa 5MB)</Text>
                      </TouchableOpacity>
                    )}

                    <Text style={[styles.label, styles.labelSpaced]}>
                      Tên chủ tài khoản (trên mã QR) <Text style={styles.optional}>(tùy chọn)</Text>
                    </Text>
                    <TextInput
                      autoCapitalize="characters"
                      onChangeText={value => setAccountHolder(value.toUpperCase())}
                      placeholder="Ví dụ: NGUYEN VAN A"
                      placeholderTextColor="#94A3B8"
                      style={styles.input}
                      value={accountHolder}
                    />
                  </View>
                )}

                <Text style={[styles.label, styles.labelSpaced]}>
                  Lý do hủy đơn <Text style={styles.optional}>(tùy chọn)</Text>
                </Text>
                <TextInput
                  multiline
                  onChangeText={setReason}
                  placeholder="Ghi rõ lý do bạn cần hủy lịch tư vấn..."
                  placeholderTextColor="#94A3B8"
                  style={[styles.input, styles.textArea]}
                  textAlignVertical="top"
                  value={reason}
                />
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={submitting || policy.percent === 0}
                  onPress={handleSubmit}
                  style={[styles.primaryBtn, styles.footerBtn, (submitting || policy.percent === 0) && styles.btnDisabled]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Gửi yêu cầu hoàn tiền</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.secondaryBtn}>
                  <Text style={styles.secondaryBtnText}>Hủy bỏ</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          <SheetBottomInset />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const ROSE = '#E11D48';

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(15, 23, 42, 0.55)', flex: 1, justifyContent: 'flex-end' },
  sheet: {
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    maxWidth: 720,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTextCol: { flex: 1, minWidth: 0 },
  headerEyebrow: { color: ROSE, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  headerTitle: { color: '#0F172A', fontSize: 16, fontWeight: '900', marginTop: 4 },
  headerSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  closeBtn: { alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  body: { padding: 20, paddingBottom: 12 },
  policyCard: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderRadius: 16, borderWidth: 1, padding: 14 },
  policyHeadRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  policyTitle: { color: '#78350F', flex: 1, fontSize: 13, fontWeight: '800' },
  policyPercent: { backgroundColor: '#FDE68A', borderRadius: 6, color: '#78350F', fontSize: 11, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 2 },
  policyText: { color: '#92400E', fontSize: 12.5, lineHeight: 18, marginTop: 6 },
  policyTotalRow: { alignItems: 'center', borderTopColor: '#FDE68A', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10 },
  policyTotalLabel: { color: '#451A03', fontSize: 13, fontWeight: '700' },
  policyTotalValue: { color: ROSE, fontSize: 17, fontWeight: '900' },
  errorBox: { backgroundColor: '#FFF1F2', borderColor: '#FECDD3', borderRadius: 12, borderWidth: 1, marginTop: 12, padding: 12 },
  errorText: { color: '#BE123C', fontSize: 12.5, fontWeight: '600' },
  label: { color: '#334155', fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 16 },
  labelSpaced: { marginTop: 12 },
  required: { color: ROSE },
  optional: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },
  segment: { backgroundColor: '#F1F5F9', borderRadius: 14, flexDirection: 'row', gap: 6, padding: 4 },
  segmentBtn: { alignItems: 'center', borderRadius: 10, flex: 1, flexDirection: 'row', gap: 6, justifyContent: 'center', paddingVertical: 10 },
  segmentBtnActive: { backgroundColor: '#FFFFFF', elevation: 1, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  segmentText: { color: '#475569', fontSize: 12.5, fontWeight: '700' },
  segmentTextActive: { color: ROSE },
  groupBox: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: 16, borderWidth: 1, marginTop: 12, padding: 14, paddingTop: 0 },
  selectBox: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 12 },
  selectText: { color: '#0F172A', flex: 1, fontSize: 14, fontWeight: '600' },
  bankList: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 12, borderWidth: 1, marginTop: 6, padding: 4 },
  bankItem: { alignItems: 'center', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 9 },
  bankItemActive: { backgroundColor: '#FFF1F2' },
  bankItemText: { color: '#334155', fontSize: 13 },
  bankItemTextActive: { color: '#BE123C', fontWeight: '700' },
  input: { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: 12, borderWidth: 1, color: '#0F172A', fontSize: 14, paddingHorizontal: 12, paddingVertical: 11 },
  inputSpaced: { marginTop: 8 },
  textArea: { minHeight: 72 },
  uploadBox: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#CBD5E1', borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, gap: 4, paddingVertical: 18 },
  uploadTitle: { color: '#334155', fontSize: 13, fontWeight: '700', marginTop: 4 },
  uploadHint: { color: '#94A3B8', fontSize: 11 },
  qrPreviewRow: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 10 },
  qrPreview: { backgroundColor: '#FFFFFF', borderRadius: 10, height: 56, width: 56 },
  qrPreviewText: { flex: 1, minWidth: 0 },
  qrFileName: { color: '#0F172A', fontSize: 13, fontWeight: '700' },
  qrReady: { color: '#059669', fontSize: 11.5, fontWeight: '600', marginTop: 2 },
  qrChangeBtn: { borderColor: '#FECDD3', borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  qrChangeText: { color: ROSE, fontSize: 12, fontWeight: '700' },
  footer: { borderTopColor: '#F1F5F9', borderTopWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  footerBtn: { flex: 1 },
  primaryBtn: { alignItems: 'center', backgroundColor: ROSE, borderRadius: 12, height: 46, justifyContent: 'center', paddingHorizontal: 18 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
  secondaryBtn: { alignItems: 'center', borderColor: '#CBD5E1', borderRadius: 12, borderWidth: 1, height: 46, justifyContent: 'center', paddingHorizontal: 18 },
  secondaryBtnText: { color: '#334155', fontSize: 14, fontWeight: '700' },
  successBody: { alignItems: 'center', padding: 24 },
  successBtn: { alignSelf: 'stretch', marginTop: 18 },
  successIcon: { alignItems: 'center', backgroundColor: '#D1FAE5', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  successTitle: { color: '#0F172A', fontSize: 18, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  successSub: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: 'center' },
  summaryBox: { alignSelf: 'stretch', backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', borderRadius: 16, borderWidth: 1, gap: 10, marginTop: 16, padding: 14 },
  summaryRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  summaryLabel: { color: '#64748B', fontSize: 12.5 },
  summaryValue: { color: '#0F172A', flexShrink: 1, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  summaryAmount: { color: ROSE, fontSize: 15, fontWeight: '900' },
  pendingBadge: { backgroundColor: '#FEF3C7', borderRadius: 999, color: '#92400E', fontSize: 11, fontWeight: '700', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 3 },
});
