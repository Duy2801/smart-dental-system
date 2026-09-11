import { api } from '~src/config';
import { AuthSession } from './types';

type ApiEnvelope<T> = { data: T; status: boolean; statusCode: number };

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
};

export const apiLogin = async (payload: LoginPayload) => {
  const response = await api.post<ApiEnvelope<AuthSession>>(
    '/auth/login',
    payload,
  );
  return response.data.data;
};

export const apiRegister = async (payload: RegisterPayload) => {
  const response = await api.post<ApiEnvelope<{ message: string }>>(
    '/auth/register',
    payload,
  );
  return response.data.data;
};

export const apiVerifyEmail = async (email: string, otp: string) => {
  const response = await api.post<
    ApiEnvelope<AuthSession & { message: string }>
  >('/auth/verify-otp', { email, otp });
  return response.data.data;
};

export const apiResendOtp = async (email: string) => {
  const response = await api.post<ApiEnvelope<{ message: string }>>(
    '/auth/resend-otp',
    { email },
  );
  return response.data.data;
};

export const apiLogout = () => api.post('/auth/logout');

export const apiLoginWithGoogle = async ({
  accessToken,
  idToken,
}: {
  accessToken?: string;
  idToken?: string;
}) => {
  console.log('[AuthApi] POST /auth/google', {
    hasIdToken: Boolean(idToken),
    idTokenLength: idToken?.length,
    hasAccessToken: Boolean(accessToken),
    accessTokenLength: accessToken?.length,
  });

  const response = await api.post<ApiEnvelope<AuthSession>>('/auth/google', {
    accessToken,
    idToken,
    token: idToken || accessToken,
  });

  console.log('[AuthApi] /auth/google success', {
    userId: response.data.data.user.id,
    roles: response.data.data.user.roles,
    hasAccessToken: Boolean(response.data.data.accessToken),
  });

  return response.data.data;
};

