"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { RegisterForm } from "@/features/auth";
import { apiRegister, apiResendOtp, apiVerifyOtp } from "@/features/auth/api";
import { FormField } from "@/features/auth/common/FormField";
import { PrimaryButton } from "@/features/auth/common/PrimaryButton";
import { login, useAppDispatch } from "@/providers";

const errorMessages: Record<string, string> = {
  "auth.email_exists": "Email này đã được sử dụng.",
  "auth.phone_exists": "Số điện thoại này đã được sử dụng.",
  "otp.expired_or_invalid": "Mã OTP đã hết hạn hoặc không hợp lệ.",
  "otp.incorrect": "Mã OTP không đúng.",
  "otp.too_many_requests":
    "Bạn đã gửi lại OTP quá nhiều lần. Vui lòng thử lại sau.",
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === "string") {
      return errorMessages[message] ?? message;
    }
  }
  return "Không thể xử lý yêu cầu lúc này. Vui lòng thử lại.";
}

function OtpVerificationCard({
  email,
  error,
  info,
  submitting,
  resending,
  onSubmit,
  onResend,
}: {
  email: string;
  error: string | null;
  info: string | null;
  submitting: boolean;
  resending: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResend: () => void;
}) {
  return (
    <section className="auth-card w-full max-w-[400px] rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5">
      <div className="mb-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/60 bg-blue-50 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
          Xác thực email
        </span>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Nhập mã OTP
        </h1>
        <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
          Mã xác thực 6 chữ số đã được gửi tới <strong className="font-semibold text-slate-800">{email}</strong>.
        </p>
      </div>

      <form className="space-y-3.5" onSubmit={onSubmit}>
        <FormField
          label="Mã OTP"
          icon="lock"
          name="otp"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="123456"
          required
        />

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-red-200/80 bg-red-50 p-2.5 text-xs font-medium text-red-700"
          >
            <svg
              className="h-3.5 w-3.5 shrink-0 text-red-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {info && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-700">
            <svg className="h-3.5 w-3.5 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{info}</span>
          </div>
        )}

        <PrimaryButton disabled={submitting}>
          {submitting ? "Đang xác thực..." : "Xác thực và đăng nhập →"}
        </PrimaryButton>
      </form>

      <div className="mt-4 flex flex-col items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="font-semibold text-blue-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending ? "Đang gửi lại..." : "Gửi lại mã OTP"}
        </button>
        <Link
          href="/auth/login"
          className="font-semibold text-slate-600 hover:underline"
        >
          Quay lại đăng nhập
        </Link>
      </div>
    </section>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/.test(password)) {
      setError("Mật khẩu phải có chữ hoa, chữ thường và chữ số.");
      return;
    }

    const registrationData = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? "")
        .trim()
        .toLowerCase(),
      password,
    };

    setSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      await apiRegister(registrationData);
      setRegisteredEmail(registrationData.email);
      setInfo("Đăng ký thành công. Vui lòng nhập mã OTP trong email.");
    } catch (registerError) {
      setError(getErrorMessage(registerError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!registeredEmail) return;

    const formData = new FormData(event.currentTarget);
    const otp = String(formData.get("otp") ?? "").trim();

    setOtpSubmitting(true);
    setError(null);
    setInfo(null);

    try {
      const response = await apiVerifyOtp({ email: registeredEmail, otp });
      dispatch(
        login({
          user: response.data.user,
          accessToken: response.data.accessToken,
        }),
      );
      window.location.href = "/home";
    } catch (verifyError) {
      setError(getErrorMessage(verifyError));
    } finally {
      setOtpSubmitting(false);
    }
  }

  async function handleResendOtp() {
    if (!registeredEmail) return;

    setResending(true);
    setError(null);
    setInfo(null);

    try {
      await apiResendOtp(registeredEmail);
      setInfo("Đã gửi lại mã OTP. Vui lòng kiểm tra email.");
    } catch (resendError) {
      setError(getErrorMessage(resendError));
    } finally {
      setResending(false);
    }
  }

  if (registeredEmail) {
    return (
      <OtpVerificationCard
        email={registeredEmail}
        error={error}
        info={info}
        submitting={otpSubmitting}
        resending={resending}
        onSubmit={handleVerifyOtp}
        onResend={handleResendOtp}
      />
    );
  }

  return (
    <RegisterForm
      passwordVisible={passwordVisible}
      confirmPasswordVisible={confirmPasswordVisible}
      error={error}
      submitting={submitting}
      onTogglePassword={() => setPasswordVisible((current) => !current)}
      onToggleConfirmPassword={() =>
        setConfirmPasswordVisible((current) => !current)
      }
      onSubmit={handleSubmit}
    />
  );
}
