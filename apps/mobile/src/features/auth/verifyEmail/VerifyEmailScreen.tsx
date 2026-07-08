import { useNavigation, useRoute } from '@react-navigation/native';
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
import { useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SCREEN_NAME } from '~src/constants/screenName';
import { setSession } from '~src/reducers/loginReducer';
import { AppDispatch } from '~src/reducers/store';
import { apiResendOtp, apiVerifyEmail } from '../api';
import { getAuthErrorMessage } from '../authError';
import AuthTextField from '../components/AuthTextField';
import { saveAuthSession } from '../session';

const VerifyEmailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useDispatch<AppDispatch>();
  const email = route.params?.email as string;
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const verifyMutation = useMutation({
    mutationFn: ({ code }: { code: string }) => apiVerifyEmail(email, code),
  });
  const resendMutation = useMutation({ mutationFn: () => apiResendOtp(email) });

  const handleVerify = async () => {
    setNotice('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Mã OTP phải gồm đúng 6 chữ số');
      return;
    }
    setError('');
    try {
      const session = await verifyMutation.mutateAsync({ code: otp });
      if (!session.user.roles.includes('PATIENT')) {
        setError('Tài khoản không thuộc vai trò bệnh nhân');
        return;
      }
      await saveAuthSession(session, 'PATIENT');
      dispatch(setSession({ ...session, role: 'PATIENT' }));
      navigation.reset({
        index: 0,
        routes: [{ name: SCREEN_NAME.PATIENT_HOME }],
      });
    } catch (requestError) {
      setError(getAuthErrorMessage(requestError));
    }
  };

  const handleResend = async () => {
    setError('');
    setNotice('');
    try {
      await resendMutation.mutateAsync();
      setNotice('Mã OTP mới đã được gửi đến email của bạn');
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
              name="envelope-circle-check"
              size={31}
              color="#FFFFFF"
              iconStyle="solid"
            />
          </View>
          <Text style={styles.title}>Xác thực email</Text>
          <Text style={styles.description}>
            Nhập mã gồm 6 chữ số đã được gửi đến{`\n`}
            <Text style={styles.email}>{email}</Text>
          </Text>
          <AuthTextField
            error={error}
            icon="key"
            keyboardType="number-pad"
            label="Mã xác thực"
            maxLength={6}
            onChangeText={value => {
              setOtp(value.replace(/\D/g, ''));
              setError('');
            }}
            onSubmitEditing={handleVerify}
            placeholder="000000"
            textContentType="oneTimeCode"
            value={otp}
          />
          {!!notice && <Text style={styles.notice}>{notice}</Text>}
          <TouchableOpacity
            disabled={verifyMutation.isPending}
            onPress={handleVerify}
            style={styles.primaryButton}
          >
            {verifyMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Xác nhận</Text>
            )}
          </TouchableOpacity>
          <View style={styles.resendRow}>
            <Text style={styles.resendText}>Chưa nhận được mã? </Text>
            <TouchableOpacity
              disabled={resendMutation.isPending}
              onPress={handleResend}
            >
              <Text style={styles.resendLink}>
                {resendMutation.isPending ? 'Đang gửi...' : 'Gửi lại mã'}
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate(SCREEN_NAME.PATIENT_LOGIN)}
          >
            <Text style={styles.backLink}>Quay lại đăng nhập</Text>
          </TouchableOpacity>
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
  email: { color: '#0875D1', fontWeight: '700' },
  notice: { color: '#087A55', fontSize: 12, textAlign: 'center' },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0875D1',
    borderRadius: 12,
    height: 54,
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  resendRow: { flexDirection: 'row', justifyContent: 'center' },
  resendText: { color: '#667085', fontSize: 13 },
  resendLink: { color: '#0875D1', fontSize: 13, fontWeight: '700' },
  backLink: {
    color: '#667085',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default VerifyEmailScreen;
