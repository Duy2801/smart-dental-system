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
import { useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SCREEN_NAME } from '~src/constants/screenName';
import { AppDispatch } from '~src/reducers/store';
import { setSession } from '~src/reducers/loginReducer';
import { apiLogin } from '../api';
import { getAuthErrorMessage } from '../authError';
import AuthTextField from '../components/AuthTextField';
import { saveAuthSession } from '../session';
import { getSupportedRole } from '../types';
import { normalizeEmail, validateLogin } from '../validation';

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<
    Partial<Record<'email' | 'password', string>>
  >({});
  const [formError, setFormError] = useState('');
  const loginMutation = useMutation({ mutationFn: apiLogin });

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
      const role = getSupportedRole(session.user.roles || []);
      if (!role) {
        setFormError('Tài khoản không thuộc vai trò bác sĩ hoặc bệnh nhân');
        return;
      }
      await saveAuthSession(session, role);
      dispatch(setSession({ ...session, role }));
      navigation.reset({ index: 0, routes: [{ name: SCREEN_NAME.HOME }] });
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
            <View style={styles.brand}>
              <View style={styles.brandIcon}>
                <FontAwesome6
                  name="tooth"
                  size={22}
                  color="#FFFFFF"
                  iconStyle="solid"
                />
              </View>
              <Text style={styles.brandName}>Nha Khoa AI</Text>
            </View>

            <View style={styles.heading}>
              <Text style={styles.title}>Chào mừng trở lại</Text>
              <Text style={styles.subtitle}>
                Đăng nhập để tiếp tục chăm sóc nụ cười của bạn
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Đăng nhập</Text>
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

              <TouchableOpacity style={styles.forgotButton} onPress={() => {}}>
                <Text style={styles.linkText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
              {!!formError && <Text style={styles.formError}>{formError}</Text>}

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={loginMutation.isPending}
                style={[
                  styles.primaryButton,
                  loginMutation.isPending && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
              >
                {loginMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Đăng nhập</Text>
                    <FontAwesome6
                      name="arrow-right"
                      size={15}
                      color="#FFFFFF"
                      iconStyle="solid"
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.registerRow}>
              <Text style={styles.registerPrompt}>Chưa có tài khoản? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate(SCREEN_NAME.REGISTER)}
              >
                <Text style={styles.linkText}>Đăng ký ngay</Text>
              </TouchableOpacity>
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
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
    justifyContent: 'center',
  },
  brandIcon: {
    alignItems: 'center',
    backgroundColor: '#0875D1',
    borderRadius: 11,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  brandName: { color: '#0068C9', fontSize: 21, fontWeight: '800' },
  heading: { alignItems: 'center', marginBottom: 28, marginTop: 32 },
  title: { color: '#101828', fontSize: 27, fontWeight: '800' },
  subtitle: {
    color: '#667085',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 3,
    gap: 18,
    padding: 22,
    shadowColor: '#172B4D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  cardTitle: {
    color: '#0875D1',
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  forgotButton: { alignSelf: 'flex-end', marginTop: -5 },
  linkText: { color: '#0875D1', fontSize: 13, fontWeight: '700' },
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
  registerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 26,
  },
  registerPrompt: { color: '#667085', fontSize: 13 },
});

export default LoginScreen;
