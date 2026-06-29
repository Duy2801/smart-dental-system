import { useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SCREEN_NAME } from '~src/constants/screenName';
import { apiRegister } from '../api';
import { getAuthErrorMessage } from '../authError';
import AuthTextField from '../components/AuthTextField';
import { normalizeEmail, validateRegister } from '../validation';

type RegisterField =
  | 'fullName'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'terms';

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<RegisterField, string>>>(
    {},
  );
  const [formError, setFormError] = useState('');
  const registerMutation = useMutation({ mutationFn: apiRegister });

  const clearError = (field: RegisterField) => {
    if (errors[field])
      setErrors(current => ({ ...current, [field]: undefined }));
  };

  const handleRegister = async () => {
    const fieldErrors = validateRegister({
      acceptedTerms,
      confirmPassword,
      email,
      fullName,
      password,
    });
    setErrors(fieldErrors);
    setFormError('');
    if (Object.keys(fieldErrors).length) return;

    const normalizedEmail = normalizeEmail(email);
    try {
      await registerMutation.mutateAsync({
        email: normalizedEmail,
        fullName: fullName.trim(),
        password,
      });
      navigation.navigate(SCREEN_NAME.VERIFY_EMAIL, { email: normalizedEmail });
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FC" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.screen}>
            <View style={styles.hero}>
              <View style={styles.heroIcon}>
                <FontAwesome6
                  name="file-circle-check"
                  size={26}
                  color="#FFFFFF"
                  iconStyle="solid"
                />
              </View>
              <Text style={styles.title}>Tạo tài khoản mới</Text>
              <Text style={styles.subtitle}>
                Đăng ký bằng email để sử dụng hệ thống nha khoa AI
              </Text>
            </View>

            <View style={styles.card}>
              <AuthTextField
                autoCapitalize="words"
                autoComplete="name"
                error={errors.fullName}
                icon="user"
                label="Họ và tên"
                onChangeText={value => {
                  setFullName(value);
                  clearError('fullName');
                }}
                placeholder="Nguyễn Văn A"
                value={fullName}
              />
              <AuthTextField
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                icon="envelope"
                keyboardType="email-address"
                label="Email"
                onChangeText={value => {
                  setEmail(value);
                  clearError('email');
                }}
                placeholder="email@example.com"
                value={email}
              />
              <AuthTextField
                autoCapitalize="none"
                autoComplete="new-password"
                error={errors.password}
                icon="lock"
                isPassword
                label="Mật khẩu"
                onChangeText={value => {
                  setPassword(value);
                  clearError('password');
                }}
                placeholder="Tối thiểu 8 ký tự"
                value={password}
              />
              <AuthTextField
                autoCapitalize="none"
                error={errors.confirmPassword}
                icon="shield-halved"
                isPassword
                label="Xác nhận mật khẩu"
                onChangeText={value => {
                  setConfirmPassword(value);
                  clearError('confirmPassword');
                }}
                onSubmitEditing={handleRegister}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
              />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setAcceptedTerms(value => !value);
                  clearError('terms');
                }}
                style={styles.termsRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    acceptedTerms && styles.checkboxChecked,
                  ]}
                >
                  {acceptedTerms && (
                    <FontAwesome6
                      name="check"
                      size={10}
                      color="#FFFFFF"
                      iconStyle="solid"
                    />
                  )}
                </View>
                <Text style={styles.termsText}>
                  Tôi đồng ý với{' '}
                  <Text style={styles.linkText}>Điều khoản dịch vụ</Text> và{' '}
                  <Text style={styles.linkText}>Chính sách bảo mật</Text>.
                </Text>
              </TouchableOpacity>
              {!!errors.terms && (
                <Text style={styles.fieldError}>{errors.terms}</Text>
              )}
              {!!formError && <Text style={styles.formError}>{formError}</Text>}

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={registerMutation.isPending}
                onPress={handleRegister}
                style={[
                  styles.primaryButton,
                  registerMutation.isPending && styles.buttonDisabled,
                ]}
              >
                {registerMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Đăng ký</Text>
                    <FontAwesome6
                      name="arrow-right"
                      size={15}
                      color="#FFFFFF"
                      iconStyle="solid"
                    />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>Đã có tài khoản? </Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(SCREEN_NAME.PATIENT_LOGIN)
                  }
                >
                  <Text style={styles.linkText}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.trustRow}>
              <FontAwesome6
                name="shield-halved"
                size={12}
                color="#7A8496"
                iconStyle="solid"
              />
              <Text style={styles.trustText}>
                Thông tin của bạn được mã hóa và bảo mật
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { backgroundColor: '#F5F7FC', flex: 1 },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  screen: { maxWidth: 420, width: '100%' },
  hero: { alignItems: 'center' },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: '#0875D1',
    borderRadius: 12,
    elevation: 5,
    height: 54,
    justifyContent: 'center',
    shadowColor: '#0875D1',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    width: 54,
  },
  title: { color: '#101828', fontSize: 27, fontWeight: '800', marginTop: 18 },
  subtitle: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 26,
    marginTop: 9,
    textAlign: 'center',
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 3,
    gap: 16,
    padding: 22,
    shadowColor: '#172B4D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
  },
  termsRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  checkbox: {
    alignItems: 'center',
    borderColor: '#D0D5DD',
    borderRadius: 4,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    marginTop: 1,
    width: 18,
  },
  checkboxChecked: { backgroundColor: '#0875D1', borderColor: '#0875D1' },
  termsText: { color: '#667085', flex: 1, fontSize: 12, lineHeight: 18 },
  linkText: { color: '#0875D1', fontSize: 13, fontWeight: '700' },
  fieldError: { color: '#D92D20', fontSize: 12, marginTop: -10 },
  formError: {
    color: '#D92D20',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0875D1',
    borderRadius: 12,
    elevation: 2,
    flexDirection: 'row',
    gap: 9,
    height: 54,
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  buttonDisabled: { opacity: 0.65 },
  loginRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginPrompt: { color: '#667085', fontSize: 13 },
  trustRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    marginTop: 22,
  },
  trustText: { color: '#7A8496', fontSize: 11 },
});

export default RegisterScreen;
