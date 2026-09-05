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
    <div className="w-full sm:max-w-[400px] flex-1 sm:flex-initial flex flex-col justify-center px-4 sm:px-0 py-6 sm:py-0">
      <section className="w-full bg-white border-0 sm:border sm:border-slate-200/80 rounded-none sm:rounded-2xl shadow-none sm:shadow-lg sm:shadow-slate-200/50 p-0 sm:p-7 transition-all">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2.5 grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-[#0863c5] ring-1 ring-blue-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Xác thực tài khoản
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Nhập mã OTP 6 chữ số đã gửi đến <br />
            <strong className="font-bold text-slate-800">{email}</strong>
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
            placeholder="• • • • • •"
            className="text-center tracking-[0.3em] font-mono text-base font-bold"
            required
          />

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-2.5 text-xs font-semibold text-rose-700 shadow-2xs"
            >
              <svg
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500"
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
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-2.5 text-xs font-semibold text-emerald-800 shadow-2xs">
              <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{info}</span>
            </div>
          )}

          <div className="pt-1">
            <PrimaryButton disabled={submitting}>
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
                  Xác thực và hoàn tất
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              )}
            </PrimaryButton>
          </div>
        </form>

        <div className="mt-5 flex flex-col items-center gap-2 border-t border-slate-100 pt-3.5 text-xs text-slate-500">
          <button
            type="button"
            onClick={onResend}
            disabled={resending}
            className="font-bold text-[#0863c5] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending ? "Đang gửi lại..." : "Gửi lại mã OTP qua Email"}
          </button>
          <Link
            href="/auth/login"
            className="text-slate-500 hover:text-slate-800 hover:underline"
          >
            Quay lại trang đăng nhập
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
