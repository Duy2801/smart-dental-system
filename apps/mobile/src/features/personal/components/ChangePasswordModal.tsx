import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Text } from 'react-native-paper';
import { apiChangePassword } from '../api';

type ChangePasswordModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ChangePasswordModal({
  visible,
  onClose,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setStatusMsg(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!currentPassword) {
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại.' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setStatusMsg({
        type: 'error',
        text: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({
        type: 'error',
        text: 'Mật khẩu xác nhận không trùng khớp.',
      });
      return;
    }

    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await apiChangePassword({ currentPassword, newPassword });
      setStatusMsg({
        type: 'success',
        text: res.message || 'Cập nhật mật khẩu thành công!',
      });
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch {
      setStatusMsg({
        type: 'error',
        text: 'Không thể đổi mật khẩu. Vui lòng thử lại sau.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cập nhật mật khẩu</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClose}
                  style={styles.closeBtn}
                >
                  <FontAwesome6 color="#64748B" iconStyle="solid" name="xmark" size={16} />
                </TouchableOpacity>
              </View>

              {/* Status Message */}
              {statusMsg ? (
                <View
                  style={[
                    styles.statusBanner,
                    statusMsg.type === 'success'
                      ? styles.statusSuccess
                      : styles.statusError,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      statusMsg.type === 'success'
                        ? styles.statusTextSuccess
                        : styles.statusTextError,
                    ]}
                  >
                    {statusMsg.type === 'success' ? '✓ ' : '⚠️ '}
                    {statusMsg.text}
                  </Text>
                </View>
              ) : null}

              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Mật khẩu hiện tại</Text>
                <TextInput
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Mật khẩu mới</Text>
                <TextInput
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Tối thiểu 6 ký tự"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
                <TextInput
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleClose}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={saving}
                  onPress={handleSubmit}
                  style={[styles.submitBtn, saving ? styles.submitBtnDisabled : null]}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Cập nhật mật khẩu</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  cancelBtn: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  formGroup: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  label: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    elevation: 5,
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  statusBanner: {
    borderRadius: 12,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusError: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
    borderWidth: 1,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextError: {
    color: '#9F1239',
  },
  statusTextSuccess: {
    color: '#065F46',
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: '#0863c5',
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
