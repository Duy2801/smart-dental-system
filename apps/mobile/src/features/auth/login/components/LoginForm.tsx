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
import { useDispatch } from 'react-redux';
import { SCREEN_NAME } from '~src/constants/screenName';
import { setSession } from '~src/reducers/loginReducer';
import { AppDispatch } from '~src/reducers/store';
import { getHomeRoute, getLoginRoute } from '~src/routes/roleRoutes';
import { apiLogin } from '../../api';
import { getAuthErrorMessage } from '../../authError';
import AuthTextField from '../../components/AuthTextField';
import { saveAuthSession } from '../../session';
import { UserRole } from '../../types';
import { normalizeEmail, validateLogin } from '../../validation';

type LoginFormProps = {
  role: UserRole;
  title: string;
  subtitle: string;
  accentColor: string;
  showPatientActions?: boolean;
  initialEmail?: string;
  initialPassword?: string;
};

const LoginForm = ({
  accentColor,
  initialEmail,
  initialPassword,
  role,
  showPatientActions = false,
  subtitle,
  title,
}: LoginFormProps) => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState(
    initialEmail ?? (role === 'PATIENT' ? 'patient01@smartdental.test' : ''),
  );
  const [password, setPassword] = useState(
    initialPassword ?? (role === 'PATIENT' ? 'Test@123456' : ''),
  );
  const [errors, setErrors] = useState<
    Partial<Record<'email' | 'password', string>>
  >({});
  const [formError, setFormError] = useState('');
  const loginMutation = useMutation({ mutationFn: apiLogin });
  const isDoctor = role === 'DOCTOR';

  const handleLogin = async () => {
    const fieldErrors = validateLogin(email, password);
    setErrors(fieldErrors);
    setFormError('');
    if (Object.keys(fieldErrors).length) return;

    try {
      const session = await loginMutation.mutateAsync({
        email: normalizeEmail(email),
        password,
      });

      if (!session.user.roles.includes(role)) {
        setFormError(
          isDoctor
            ? 'Tài khoản này không có quyền truy cập dành cho bác sĩ.'
            : 'Tài khoản này không có quyền truy cập dành cho bệnh nhân.',
        );
        return;
      }

      await saveAuthSession(session, role);
      dispatch(setSession({ ...session, role }));
      navigation.reset({
        index: 0,
        routes: [{ name: getHomeRoute(role) }],
      });
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    }
  };

  const switchLoginScreen = () => {
    navigation.replace(getLoginRoute(isDoctor ? 'PATIENT' : 'DOCTOR'));
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
            <View style={styles.brand}>
              <View style={[styles.brandIcon, { backgroundColor: accentColor }]}>
                <FontAwesome6
                  color="#FFFFFF"
                  iconStyle="solid"
                  name="tooth"
                  size={19}
                />
              </View>
              <Text style={[styles.brandName, { color: accentColor }]}>
                AIsmart Dental System
              </Text>
            </View>

            <View style={styles.heading}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={styles.card}>
              <Text style={[styles.cardTitle, { color: accentColor }]}>
                Đăng nhập
              </Text>

              <AuthTextField
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                icon="envelope"
                keyboardType="email-address"
                label="Email"
                onChangeText={value => {
                  setEmail(value);
                  if (errors.email)
                    setErrors(current => ({ ...current, email: undefined }));
                }}
                placeholder="email@example.com"
                returnKeyType="next"
                value={email}
              />

              <AuthTextField
                autoCapitalize="none"
                autoComplete="current-password"
                error={errors.password}
                icon="lock"
                isPassword
                label="Mật khẩu"
                onChangeText={value => {
                  setPassword(value);
                  if (errors.password)
                    setErrors(current => ({ ...current, password: undefined }));
                }}
                onSubmitEditing={handleLogin}
                placeholder="Nhập mật khẩu"
                returnKeyType="done"
                value={password}
              />

              {showPatientActions && (
                <TouchableOpacity style={styles.forgotButton} onPress={() => {}}>
                  <Text style={[styles.linkText, { color: accentColor }]}>
                    Quên mật khẩu?
                  </Text>
                </TouchableOpacity>
              )}

              {!!formError && <Text style={styles.formError}>{formError}</Text>}

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={loginMutation.isPending}
                onPress={handleLogin}
                style={[
                  styles.primaryButton,
                  { backgroundColor: accentColor },
                  loginMutation.isPending && styles.buttonDisabled,
                ]}
              >
                {loginMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Đăng nhập</Text>
                )}
              </TouchableOpacity>
            </View>

            {showPatientActions && (
              <View style={styles.registerRow}>
                <Text style={styles.registerPrompt}>Chưa có tài khoản? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate(SCREEN_NAME.REGISTER)}
                >
                  <Text style={[styles.linkText, { color: accentColor }]}>
                    Đăng ký ngay
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={switchLoginScreen}
              style={[styles.switchButton, { borderColor: accentColor }]}
            >
              <FontAwesome6
                color={accentColor}
                iconStyle="solid"
                name={isDoctor ? 'user' : 'user-doctor'}
                size={15}
              />
              <Text style={[styles.switchButtonText, { color: accentColor }]}>
                {isDoctor
                  ? 'Đăng nhập dành cho bệnh nhân'
                  : 'Đăng nhập với tư cách bác sĩ'}
              </Text>
            </TouchableOpacity>
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
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  screen: { maxWidth: 420, width: '100%' },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  brandIcon: {
    alignItems: 'center',
    borderRadius: 9,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  brandName: { fontSize: 18, fontWeight: '800' },
  heading: { alignItems: 'center', marginBottom: 24, marginTop: 30 },
  title: {
    color: '#101828',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#667085',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 9,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    elevation: 3,
    gap: 16,
    paddingBottom: 20,
    paddingHorizontal: 22,
    paddingTop: 22,
    shadowColor: '#172B4D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 11,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  forgotButton: { alignSelf: 'flex-end', marginTop: -5 },
  linkText: { fontSize: 12, fontWeight: '700' },
  formError: {
    color: '#D92D20',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 9,
    elevation: 3,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    marginTop: 2,
    shadowColor: '#0B66C3',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  buttonDisabled: { opacity: 0.65 },
  registerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  registerPrompt: { color: '#667085', fontSize: 13 },
  switchButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 50,
    justifyContent: 'center',
    marginTop: 18,
  },
  switchButtonText: { fontSize: 14, fontWeight: '700' },
});

export default LoginForm;
