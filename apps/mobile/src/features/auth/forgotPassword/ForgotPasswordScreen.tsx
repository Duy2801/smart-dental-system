import { useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SCREEN_NAME } from '~src/constants/screenName';
import { apiForgotPassword } from '../api';
import { getAuthErrorMessage } from '../authError';
import AuthTextField from '../components/AuthTextField';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Quên mật khẩu — cùng luồng với trang web: nhập email, nhận liên kết đặt lại qua mail */
const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const mutation = useMutation({
    mutationFn: (value: string) => apiForgotPassword(value),
  });

  const handleSubmit = async () => {
    const value = email.trim().toLowerCase();
    setSuccess('');
    if (!EMAIL_PATTERN.test(value)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    setError('');
    try {
      await mutation.mutateAsync(value);
      setSuccess(
        'Hướng dẫn khôi phục mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
      );
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FC" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.card}>
          <View style={styles.icon}>
            <FontAwesome6
              name="key"
              size={28}
              color="#FFFFFF"
              iconStyle="solid"
            />
          </View>
          <Text style={styles.title}>Quên mật khẩu?</Text>
          <Text style={styles.description}>
            Nhập địa chỉ email đăng ký để nhận liên kết đặt lại mật khẩu.
          </Text>

          {!!success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{success}</Text>
            </View>
          )}

          <AuthTextField
            autoCapitalize="none"
            autoComplete="email"
            error={error}
            icon="envelope"
            keyboardType="email-address"
            label="Địa chỉ email"
            onChangeText={value => {
              setEmail(value);
              if (error) setError('');
            }}
            onSubmitEditing={handleSubmit}
            placeholder="example@gmail.com"
            value={email}
          />

          <TouchableOpacity
            disabled={mutation.isPending}
            onPress={handleSubmit}
            style={styles.primaryButton}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Gửi yêu cầu đặt lại</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Nhớ lại mật khẩu? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate(SCREEN_NAME.PATIENT_LOGIN)}
            >
              <Text style={styles.footerLink}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { backgroundColor: '#F5F7FC', flex: 1 },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    elevation: 3,
    gap: 18,
    maxWidth: 420,
    padding: 24,
    shadowColor: '#172B4D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    width: '100%',
  },
  icon: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0875D1',
    borderRadius: 15,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  title: {
    color: '#101828',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
  },
  successText: { color: '#065F46', fontSize: 12.5, fontWeight: '600' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0875D1',
    borderRadius: 12,
    height: 54,
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  footerRow: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#667085', fontSize: 13 },
  footerLink: { color: '#0875D1', fontSize: 13, fontWeight: '800' },
});

export default ForgotPasswordScreen;
