"use client";

import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { apiLogin, apiLoginWithGoogle } from "@/features/auth/api";
import { LoginForm } from "@/features/auth";
import type { CaptchaHandle } from "@/features/auth/login/CaptchaWidget";
import { login, useAppDispatch } from "@/providers";

const authErrorMessages: Record<string, string> = {
  "auth.invalid_credentials": "Email hoặc mật khẩu không đúng.",
  "auth.account_google_only": "Tài khoản này đang đăng nhập bằng Google.",
  "auth.google_invalid_token": "Xác thực tài khoản Google không thành công.",
  "auth.account_inactive":
    "Tài khoản của bạn đang bị khóa hoặc ngừng hoạt động.",
  "auth.email_not_verified":
    "Email chưa được xác thực. Vui lòng kiểm tra OTP trong email.",
  "auth.captcha_required": "Vui lòng hoàn thành CAPTCHA trước khi đăng nhập.",
  "auth.captcha_invalid": "CAPTCHA không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
  "auth.captcha_unavailable": "Chưa thể xác minh CAPTCHA. Vui lòng thử lại sau.",
  "auth.captcha_puzzle_required": "Vui lòng giải câu đố xác minh bên dưới rồi đăng nhập lại.",
};

function getErrorCode(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === "string") return message;
  }
  return null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === "string") {
      return authErrorMessages[message] ?? message;
    }
  }
  return "Không thể đăng nhập lúc này. Vui lòng thử lại.";
}

function getSafeRedirectPath() {
  if (typeof window === "undefined") return "/home";

  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) {
    return "/home";
  }

  return redirect;
}

type GoogleTokenClient = {
  requestAccessToken: () => void;
};

type GoogleOAuth2 = {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (res: { access_token?: string; error?: string }) => void;
  }) => GoogleTokenClient;
};

type GoogleWindow = Window & {
  google?: {
    accounts?: {
      oauth2?: GoogleOAuth2;
    };
  };
};

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captchaRef = useRef<CaptchaHandle>(null);
  const captchaEnabled = Boolean(process.env.NEXT_PUBLIC_WAU_CAPTCHA_SITE_KEY);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("google-gsi-client")) return;

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  async function handleGoogleToken(token: string) {
    setGoogleSubmitting(true);
    setError(null);
    try {
      const response = await apiLoginWithGoogle(token);
      const session = response.data;
      const roles = session.user.roles ?? [];

      if (!roles.includes("PATIENT")) {
        setError("Tài khoản này không phải tài khoản bệnh nhân.");
        return;
      }

      dispatch(
        login({
          user: session.user,
          accessToken: session.accessToken,
        }),
      );
      const redirectPath = getSafeRedirectPath();
      router.replace(redirectPath);
    } catch (googleError) {
      setError(getErrorMessage(googleError));
    } finally {
      setGoogleSubmitting(false);
    }
  }

  function handleGoogleClick() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Hệ thống chưa cấu hình GOOGLE_CLIENT_ID cho Web.");
      return;
    }

    const google = (window as GoogleWindow).google;
    if (!google?.accounts?.oauth2) {
      setError(
        "Đang tải dịch vụ đăng nhập Google, vui lòng thử lại sau vài giây.",
      );
      return;
    }

    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: (res: { access_token?: string; error?: string }) => {
          if (res.error) {
            setError("Đăng nhập Google đã bị hủy hoặc gặp lỗi.");
            return;
          }
          if (res.access_token) {
            void handleGoogleToken(res.access_token);
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch {
      setError("Không thể khởi tạo phiên đăng nhập Google. Vui lòng thử lại.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const credentials = {
      email: String(formData.get("email") ?? "")
        .trim()
        .toLowerCase(),
      password: String(formData.get("password") ?? ""),
    };

    setSubmitting(true);
    setError(null);

    try {
      const captchaToken = captchaEnabled ? await captchaRef.current?.verify() : undefined;
      if (captchaEnabled && !captchaToken) return;
      const response = await apiLogin({ ...credentials, captchaToken: captchaToken ?? undefined });
      const session = response.data;
      const roles = session.user.roles ?? [];

      if (!roles.includes("PATIENT")) {
        setError("Tài khoản này không phải tài khoản bệnh nhân.");
        captchaRef.current?.refresh();
        return;
      }

      dispatch(
        login({
          user: session.user,
          accessToken: session.accessToken,
        }),
      );
      const redirectPath = getSafeRedirectPath();
      router.replace(redirectPath);
    } catch (loginError) {
      setError(getErrorMessage(loginError));
      if (getErrorCode(loginError) === "auth.captcha_puzzle_required") {
        captchaRef.current?.requirePuzzle();
      } else {
        captchaRef.current?.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginForm
      passwordVisible={passwordVisible}
      error={error}
      submitting={submitting}
      googleSubmitting={googleSubmitting}
      onTogglePassword={() => setPasswordVisible((current) => !current)}
      onSubmit={handleSubmit}
      onGoogleClick={handleGoogleClick}
      captchaRef={captchaRef}
    />
  );
}
