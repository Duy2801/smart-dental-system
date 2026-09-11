import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID,
} from '@env';

let configured = false;

const normalizeEnv = (value?: string) =>
  value?.trim().replace(/^["']|["']$/g, '');

export const configureGoogleSignIn = () => {
  if (configured) return;

  const webClientId = normalizeEnv(
    GOOGLE_WEB_CLIENT_ID || NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  );
  const iosClientId = normalizeEnv(GOOGLE_IOS_CLIENT_ID);

  console.log('[GoogleAuth] configure', {
    hasWebClientId: Boolean(webClientId),
    webClientIdSuffix: webClientId?.slice(-16),
    hasIosClientId: Boolean(iosClientId),
  });

  GoogleSignin.configure({
    scopes: ['email', 'profile', 'openid'],
    webClientId,
    iosClientId,
    offlineAccess: false,
  });

  configured = true;
};

export async function getGoogleMobileToken() {
  configureGoogleSignIn();

  console.log('[GoogleAuth] checking Play Services');
  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  console.log('[GoogleAuth] opening account picker');
  const signInResponse = await GoogleSignin.signIn();
  console.log('[GoogleAuth] signIn response', {
    type: signInResponse.type,
    hasData: Boolean(signInResponse.data),
    hasIdToken: Boolean(signInResponse.data?.idToken),
  });

  if (signInResponse.type === 'cancelled') {
    return null;
  }

  const idToken = signInResponse.data.idToken;
  if (idToken) {
    console.log('[GoogleAuth] returning idToken', {
      length: idToken.length,
      preview: `${idToken.slice(0, 12)}...${idToken.slice(-8)}`,
    });
    return { idToken, accessToken: undefined };
  }

  const tokens = await GoogleSignin.getTokens();
  console.log('[GoogleAuth] returning fallback tokens', {
    hasIdToken: Boolean(tokens.idToken),
    hasAccessToken: Boolean(tokens.accessToken),
  });
  return { idToken: tokens.idToken, accessToken: tokens.accessToken };
}

export function getGoogleSignInErrorMessage(error: unknown) {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  if (!code) return undefined;

  if (code === statusCodes.SIGN_IN_CANCELLED) return '';
  if (code === statusCodes.IN_PROGRESS) {
    return 'Đăng nhập Google đang được xử lý, vui lòng chờ trong giây lát.';
  }
  if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    return 'Thiết bị chưa có Google Play Services hoặc cần cập nhật.';
  }

  if (code === '10' || code === 'DEVELOPER_ERROR') {
    return 'Cấu hình Google OAuth của app Android chưa khớp package name hoặc SHA-1.';
  }

  if (code === '12500') {
    return 'Google OAuth chưa cấu hình màn hình đồng ý hoặc tài khoản chưa nằm trong danh sách test users.';
  }

  return 'Không thể đăng nhập Google lúc này. Vui lòng thử lại.';
}
