import { useNavigation } from '@react-navigation/native';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

const clinicLogo = require('~src/assets/home/clinic-logo.png');

const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
        phone: phone.trim() || undefined,
      });
      navigation.navigate(SCREEN_NAME.VERIFY_EMAIL, { email: normalizedEmail });
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F8FC" />
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
            <View style={styles.card}>
              <View style={styles.brandHeader}>
                <View style={styles.brand}>
                  <View style={styles.brandIcon}>
                    <Image
                      accessibilityLabel="Logo Smart Dental System"
                      source={clinicLogo}
                      style={styles.logo}
                    />
                  </View>
                  <Text style={styles.brandName}>Smart Dental System</Text>
                </View>
                <Text style={styles.title}>Tạo tài khoản bệnh nhân</Text>
              </View>

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
                returnKeyType="next"
                value={fullName}
              />

              <AuthTextField
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                icon="envelope"
                keyboardType="email-address"
                label="Địa chỉ Email"
                onChangeText={value => {
                  setEmail(value);
                  clearError('email');
                }}
                placeholder="example@gmail.com"
                returnKeyType="next"
                value={email}
              />

              <AuthTextField
                autoComplete="tel"
                icon="phone"
                keyboardType="phone-pad"
                label="Số điện thoại"
                onChangeText={setPhone}
                placeholder="09xx xxx xxx"
                returnKeyType="next"
                value={phone}
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
                returnKeyType="next"
                value={password}
              />

              <AuthTextField
                autoCapitalize="none"
                error={errors.confirmPassword}
                icon="lock"
                isPassword
                label="Xác nhận mật khẩu"
                onChangeText={value => {
                  setConfirmPassword(value);
                  clearError('confirmPassword');
                }}
                onSubmitEditing={handleRegister}
                placeholder="Nhập lại mật khẩu"
                returnKeyType="done"
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
                    <Text style={styles.primaryButtonText}>
                      Đăng ký tài khoản
                    </Text>
                    <FontAwesome6
                      name="arrow-right"
                      size={14}
                      color="#FFFFFF"
                      iconStyle="solid"
                    />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={styles.footerPrompt}>Đã có tài khoản? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate(SCREEN_NAME.PATIENT_LOGIN)}
                >
                  <Text style={styles.footerLink}>Đăng nhập ngay</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { backgroundColor: '#F6F8FC', flex: 1 },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  screen: { maxWidth: 500, width: '100%' },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderRadius: 18,
    borderWidth: 1,
    elevation: 5,
    gap: 17,
    paddingHorizontal: 28,
    paddingVertical: 30,
    shadowColor: '#8EA4C2',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
  },
  brandHeader: { alignItems: 'center', gap: 12, marginBottom: 2 },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  brandIcon: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderRadius: 13,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  logo: { height: 38, resizeMode: 'contain', width: 38 },
  brandName: { color: '#10213F', fontSize: 16, fontWeight: '800' },
  title: {
    color: '#061733',
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
  },
  termsRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: '#CBD5E1',
    borderRadius: 5,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    marginTop: 1,
    width: 18,
  },
  checkboxChecked: { backgroundColor: '#0875D1', borderColor: '#0875D1' },
  termsText: { color: '#64748B', flex: 1, fontSize: 12, lineHeight: 18 },
  linkText: { color: '#0875D1', fontSize: 12, fontWeight: '800' },
  fieldError: { color: '#D92D20', fontSize: 12, marginTop: -8 },
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
    elevation: 3,
    flexDirection: 'row',
    gap: 8,
    height: 55,
    justifyContent: 'center',
    marginTop: 2,
    shadowColor: '#0B66C3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  buttonDisabled: { opacity: 0.65 },
  footerRow: {
    alignItems: 'center',
    borderTopColor: '#EEF2F7',
    borderTopWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: 18,
  },
  footerPrompt: { color: '#73809A', fontSize: 14 },
  footerLink: { color: '#0875D1', fontSize: 14, fontWeight: '800' },
});

export default RegisterScreen;
