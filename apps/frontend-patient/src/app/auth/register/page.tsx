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
    <div className="w-full max-w-[440px]">
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-2xl shadow-slate-900/10 transition-all">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3.5 py-1 text-xs font-bold text-[#0863c5]">
            <span className="h-2 w-2 rounded-full bg-[#0863c5] animate-ping" />
            <span>Xác thực OTP Email 📧</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Nhập mã xác thực
          </h1>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">
            Mã OTP 6 chữ số đã được gửi đến <br className="hidden sm:inline" />
            <strong className="font-extrabold text-slate-800">{email}</strong>
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField
            label="Mã OTP (6 chữ số)"
            icon="lock"
            name="otp"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="• • • • • •"
            className="text-center tracking-[0.3em] font-mono text-base font-black"
            required
          />

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs font-semibold text-rose-700 shadow-2xs"
            >
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-rose-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {info && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-semibold text-emerald-800 shadow-2xs">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{info}</span>
            </div>
          )}

          <PrimaryButton disabled={submitting} className="mt-2">
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Đang xác thực...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Xác thực và đăng nhập
                <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            )}
          </PrimaryButton>
        </form>

        <div className="mt-6 flex flex-col items-center gap-2.5 border-t border-slate-100 pt-4 text-xs text-slate-600">
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="font-extrabold text-[#0863c5] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending ? "Đang gửi lại..." : "Gửi lại mã OTP qua Email"}
          </button>
          <Link
            href="/auth/login"
            className="font-bold text-slate-500 hover:text-slate-800 hover:underline"
          >
            ← Quay lại trang đăng nhập
          </Link>
        </div>
      </section>
    </div>
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
