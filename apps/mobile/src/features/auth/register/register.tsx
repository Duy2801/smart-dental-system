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
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
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
              <View style={styles.heroBadge}>
                <FontAwesome6
                  name="tooth"
                  size={24}
                  color="#007AFF"
                  iconStyle="solid"
                />
              </View>
              <Text style={styles.title}>Tạo tài khoản</Text>
              <Text style={styles.subtitle}>
                Đăng ký hồ sơ để đặt lịch và quản lý nha khoa
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
                placeholder="Nguyễn Văn An"
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
                  <Text style={styles.linkText}>Điều khoản</Text> và{' '}
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
                    <Text style={styles.primaryButtonText}>Đăng ký ngay</Text>
                    <FontAwesome6
                      name="arrow-right"
                      size={14}
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
                  <Text style={styles.linkText}>Đăng nhập ngay</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.trustRow}>
              <FontAwesome6
                name="shield-halved"
                size={12}
                color="#10B981"
                iconStyle="solid"
              />
              <Text style={styles.trustText}>
                Bảo mật dữ liệu y tế theo chuẩn HIPAA
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
  safeArea: { backgroundColor: '#F8FAFC', flex: 1 },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  screen: { maxWidth: 420, width: '100%' },
  hero: { alignItems: 'center', marginBottom: 18 },
  heroBadge: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderRadius: 20,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  title: { color: '#0F172A', fontSize: 23, fontWeight: '800', marginTop: 12 },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 2,
    gap: 14,
    padding: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  termsRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, marginTop: 2 },
  checkbox: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: 6,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    marginTop: 1,
    width: 20,
  },
  checkboxChecked: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  termsText: { color: '#64748B', flex: 1, fontSize: 12, lineHeight: 18 },
  linkText: { color: '#007AFF', fontSize: 13, fontWeight: '700' },
  fieldError: { color: '#EF4444', fontSize: 12, marginTop: -6 },
  formError: {
    color: '#EF4444',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 14,
    elevation: 2,
    flexDirection: 'row',
    gap: 8,
    height: 50,
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  buttonDisabled: { opacity: 0.65 },
  loginRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginPrompt: { color: '#64748B', fontSize: 13 },
  trustRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 18,
  },
  trustText: { color: '#94A3B8', fontSize: 11, fontWeight: '500' },
});

export default RegisterScreen;
