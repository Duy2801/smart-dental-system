"use client";

import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { apiLogin } from "@/components/auth/api";
import { LoginForm } from "@/components/auth";
import { login, useAppDispatch } from "@/providers";

const authErrorMessages: Record<string, string> = {
  "auth.invalid_credentials": "Email hoặc mật khẩu không đúng.",
  "auth.account_google_only": "Tài khoản này đang đăng nhập bằng Google.",
  "auth.account_inactive":
    "Tài khoản của bạn đang bị khóa hoặc ngừng hoạt động.",
  "auth.email_not_verified":
    "Email chưa được xác thực. Vui lòng kiểm tra OTP trong email.",
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === "string") {
      return authErrorMessages[message] ?? message;
    }
  }
  return "Không thể đăng nhập lúc này. Vui lòng thử lại.";
}

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await apiLogin(credentials);
      const session = response.data;
      const roles = session.user.roles ?? [];

      if (!roles.includes("PATIENT")) {
        setError("Tài khoản này không phải tài khoản bệnh nhân.");
        return;
      }

      dispatch(login({ user: session.user, accessToken: session.accessToken }));
      router.replace("/home");
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LoginForm
      passwordVisible={passwordVisible}
      error={error}
      submitting={submitting}
      onTogglePassword={() => setPasswordVisible((current) => !current)}
      onSubmit={handleSubmit}
    />
  );
}
