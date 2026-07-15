import apiClient from "@/lib/axios";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  roles?: string[];
  status: string;
  emailVerified: boolean;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  message?: string;
};

export type RefreshSession = {
  accessToken: string;
};

export type LoginBody = {
  email: string;
  password: string;
};

export type RegisterBody = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
};

export type VerifyOtpBody = {
  email: string;
  otp: string;
};

export const apiLogin = (body: LoginBody) =>
  apiClient.post<AuthSession>("/auth/login", body);

export const apiRefresh = () => apiClient.post<RefreshSession>("/auth/refresh");

export const apiMe = () => apiClient.get<AuthUser>("/auth/me");

export const apiRegister = (body: RegisterBody) =>
  apiClient.post<{ message: string }>("/auth/register", body);

export const apiVerifyOtp = (body: VerifyOtpBody) =>
  apiClient.post<AuthSession>("/auth/verify-otp", body);

export const apiResendOtp = (email: string) =>
  apiClient.post<{ message: string }>("/auth/resend-otp", { email });
