import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery } from '@tanstack/react-query';
import React, { useEffect, useRef, useState } from 'react';
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
import { useDispatch } from 'react-redux';
import { SCREEN_NAME } from '~src/constants/screenName';
import { setSession } from '~src/reducers/loginReducer';
import { AppDispatch } from '~src/reducers/store';
import { getHomeRoute } from '~src/routes/roleRoutes';
import { apiLogin, apiLoginCaptchaConfig, apiLoginWithGoogle } from '../../api';
import { getAuthErrorCode, getAuthErrorMessage } from '../../authError';
import AuthBrandBadge from '../../components/AuthBrandBadge';
import NativeCaptcha, { type CaptchaHandle } from '../../components/NativeCaptcha';
import { getCaptchaOrigin, WAU_CAPTCHA_SITE_KEY } from '../../captcha/captchaConfig';
import AuthTextField from '../../components/AuthTextField';
import {
  configureGoogleSignIn,
  getGoogleMobileToken,
  getGoogleSignInErrorMessage,
} from '../../googleAuth';
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

const googleLogo = require('~src/assets/home/google-icon.png');

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
  const [captchaSubmitting, setCaptchaSubmitting] = useState(false);
  const captchaRef = useRef<CaptchaHandle>(null);
  const captchaConfig = useQuery({
    queryKey: ['auth', 'captcha-config'],
    queryFn: apiLoginCaptchaConfig,
    enabled: role === 'PATIENT',
    staleTime: 60_000,
  });
  const loginMutation = useMutation({ mutationFn: apiLogin });
  const googleLoginMutation = useMutation({ mutationFn: apiLoginWithGoogle });
  const isDoctor = role === 'DOCTOR';

  useEffect(() => {
    configureGoogleSignIn();
  }, []);

  // Hiện CAPTCHA khi có site key, trừ khi backend báo rõ đã tắt CAPTCHA.
  // Không phụ thuộc việc gọi được API cấu hình: token thừa không ảnh hưởng gì nếu backend tắt CAPTCHA.
  const captchaDisabledByBackend = captchaConfig.data?.enabled === false;
  const showCaptcha = role === 'PATIENT' && Boolean(WAU_CAPTCHA_SITE_KEY) && !captchaDisabledByBackend;
  const captchaOrigin = getCaptchaOrigin(captchaConfig.data?.mobileUrl);

  const verifyCaptcha = async (): Promise<string | null | undefined> => {
    if (role !== 'PATIENT' || captchaDisabledByBackend) return undefined;
    if (!WAU_CAPTCHA_SITE_KEY) {
      if (captchaConfig.data?.enabled) {
        setFormError('Ứng dụng chưa cấu hình NEXT_PUBLIC_WAU_CAPTCHA_SITE_KEY.');
        return null;
      }
      return undefined;
    }
    if (!captchaRef.current) {
      setFormError('CAPTCHA đang tải. Vui lòng thử lại.');
      return null;
    }

    setCaptchaSubmitting(true);
    try {
      // Lỗi CAPTCHA đã hiện ngay trong ô CAPTCHA, không lặp lại ở dưới form
      const result = await captchaRef.current.verify();
      return result.token;
    } finally {
      setCaptchaSubmitting(false);
    }
  };

  /** Trả về false nếu tài khoản không đúng vai trò của màn hình đăng nhập */
  const completeLogin = async (session: Awaited<ReturnType<typeof apiLogin>>) => {
    if (!session.user.roles.includes(role)) {
      setFormError(
        isDoctor
          ? 'Tài khoản này không có quyền truy cập dành cho bác sĩ.'
          : 'Tài khoản này không có quyền truy cập dành cho bệnh nhân.',
      );
      return false;
    }

    await saveAuthSession(session, role);
    dispatch(setSession({ ...session, role }));
    navigation.reset({
      index: 0,
      routes: [{ name: getHomeRoute(role) }],
    });
    return true;
  };

  const handleLogin = async () => {
    const fieldErrors = validateLogin(email, password);
    setErrors(fieldErrors);
    setFormError('');
    if (Object.keys(fieldErrors).length) return;

    let captchaToken: string | undefined;
    try {
      const verifiedToken = await verifyCaptcha();
      if (verifiedToken === null) return;
      captchaToken = verifiedToken;
      const session = await loginMutation.mutateAsync({
        email: normalizeEmail(email),
        password,
        captchaToken,
      });
      const loggedIn = await completeLogin(session);
      // Token đã được backend dùng: tải ảnh mã mới cho lần thử sau
      if (!loggedIn && captchaToken) captchaRef.current?.refresh();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
      // Token CAPTCHA chỉ dùng một lần: xác minh lại (hoặc chuyển sang câu đố) cho lần thử sau
      if (captchaToken) {
        if (getAuthErrorCode(error) === 'auth.captcha_puzzle_required') {
          captchaRef.current?.requirePuzzle();
        } else {
          captchaRef.current?.refresh();
        }
      }
    }
  };

  const handleGoogleLogin = async () => {
    setFormError('');
    console.log('[LoginForm] Google login pressed', { role });

    try {
      const googleToken = await getGoogleMobileToken();
      if (!googleToken) {
        console.log('[LoginForm] Google login cancelled');
        return;
      }

      const session = await googleLoginMutation.mutateAsync({
        ...googleToken,
      });
      console.log('[LoginForm] Google backend login completed', {
        userId: session.user.id,
        roles: session.user.roles,
      });
      await completeLogin(session);
    } catch (error) {
      console.error('[LoginForm] Google login failed', error);
      const googleError = getGoogleSignInErrorMessage(error);
      setFormError(googleError || getAuthErrorMessage(error));
    }
  };

  const isSubmitting = captchaSubmitting || loginMutation.isPending || googleLoginMutation.isPending;

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
            {showPatientActions && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  navigation.reset({
                    index: 0,
                    routes: [{ name: SCREEN_NAME.PATIENT_HOME }],
                  })
                }
                style={styles.backButton}
              >
                <Text style={styles.backArrow}>‹</Text>
                <Text style={styles.backText}>Trang chủ</Text>
              </TouchableOpacity>
            )}

            <View style={styles.card}>
              <View style={styles.brandHeader}>
                <AuthBrandBadge />

                <Text style={styles.title}>{title || 'Đăng nhập'}</Text>
                {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              </View>

              <AuthTextField
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                icon="envelope"
                keyboardType="email-address"
                label="Địa chỉ Email"
                onChangeText={value => {
                  setEmail(value);
                  if (errors.email)
                    setErrors(current => ({ ...current, email: undefined }));
                }}
                placeholder="example@gmail.com"
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
                labelAccessory={
                  showPatientActions ? (
                    <TouchableOpacity onPress={() => {}}>
                      <Text style={[styles.linkText, { color: accentColor }]}>
                        Quên mật khẩu?
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
                onChangeText={value => {
                  setPassword(value);
                  if (errors.password)
                    setErrors(current => ({
                      ...current,
                      password: undefined,
                    }));
                }}
                onSubmitEditing={handleLogin}
                placeholder="Nhập mật khẩu"
                returnKeyType="done"
                value={password}
              />

              {showCaptcha ? (
                <NativeCaptcha ref={captchaRef} siteKey={WAU_CAPTCHA_SITE_KEY} origin={captchaOrigin} />
              ) : null}

              {role === 'PATIENT' && !WAU_CAPTCHA_SITE_KEY && captchaConfig.isError && (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => void captchaConfig.refetch()}
                  style={styles.captchaButton}
                >
                  <Text style={styles.captchaButtonText}>
                    Tải lại cấu hình CAPTCHA
                  </Text>
                </TouchableOpacity>
              )}

              {!!formError && <Text style={styles.formError}>{formError}</Text>}

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isSubmitting}
                onPress={handleLogin}
                style={[
                  styles.primaryButton,
                  { backgroundColor: accentColor },
                  isSubmitting && styles.buttonDisabled,
                ]}
              >
                {loginMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Đăng nhập ngay</Text>
                )}
              </TouchableOpacity>

              {showPatientActions && (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>HOẶC TIẾP TỤC VỚI</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    disabled={isSubmitting}
                    onPress={handleGoogleLogin}
                    style={[
                      styles.googleButton,
                      isSubmitting && styles.buttonDisabled,
                    ]}
                  >
                    {googleLoginMutation.isPending ? (
                      <ActivityIndicator color="#4285F4" />
                    ) : (
                      <>
                        <Image
                          source={googleLogo}
                          style={styles.googleIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.googleText}>Tài khoản Google</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.footerRow}>
                    <Text style={styles.footerPrompt}>Chưa có tài khoản? </Text>
                    <TouchableOpacity
                      onPress={() => navigation.navigate(SCREEN_NAME.REGISTER)}
                    >
                      <Text style={[styles.footerLink, { color: accentColor }]}>
                        Đăng ký tài khoản bệnh nhân
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
              {showPatientActions && (
                <View style={styles.legalFooter}>
                  <Text style={styles.copyright}>
                    © 2026 Smart Dental System. Hệ thống nha khoa thông minh.
                  </Text>
                  <View style={styles.legalLinks}>
                    <Text style={styles.legalLink}>Bảo mật</Text>
                    <Text style={styles.legalLink}>Điều khoản</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { backgroundColor: '#FFFFFF', flex: 1 },
  content: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 22,
    paddingBottom: 24,
    paddingTop: 18,
  },
  screen: { flexGrow: 1, maxWidth: 500, width: '100%' },
  backButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: '#E2E8F0',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    height: 30,
    marginBottom: 34,
    paddingHorizontal: 11,
  },
  backArrow: {
    color: '#64748B',
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 24,
    marginTop: -2,
  },
  backText: { color: '#64748B', fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
    gap: 19,
    paddingHorizontal: 0,
    paddingTop: 24,
  },
  brandHeader: { alignItems: 'center', gap: 12 },
  title: {
    color: '#061733',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#667085',
    fontSize: 12,
    lineHeight: 17,
    marginTop: -6,
    textAlign: 'center',
  },
  linkText: { fontSize: 14, fontWeight: '600' },
  formError: {
    color: '#D92D20',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  captchaButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderRadius: 11,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  captchaButtonText: { color: '#0758A8', fontSize: 14, fontWeight: '700' },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 11,
    elevation: 3,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0B66C3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  buttonDisabled: { opacity: 0.65 },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginVertical: 10,
  },
  dividerLine: { backgroundColor: '#E2E8F0', flex: 1, height: 1 },
  dividerText: {
    color: '#9AA7BD',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#DDE3EC',
    borderRadius: 13,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    height: 50,
    justifyContent: 'center',
  },
  googleIcon: { height: 20, width: 20 },
  googleText: { color: '#172033', fontSize: 14, fontWeight: '600' },
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
  footerLink: { fontSize: 14, fontWeight: '800' },
  legalFooter: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 8,
    paddingTop: 76,
  },
  copyright: {
    color: '#7B8AA5',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 17,
    textAlign: 'center',
  },
  legalLinks: { flexDirection: 'row', gap: 24, marginTop: 8 },
  legalLink: { color: '#7B8AA5', fontSize: 11, fontWeight: '700' },
});

export default LoginForm;
