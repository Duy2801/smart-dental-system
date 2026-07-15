"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { RegisterForm } from "@/components/auth";
import { apiRegister, apiResendOtp, apiVerifyOtp } from "@/components/auth/api";
import { FormField } from "@/components/auth/common/FormField";
import { PrimaryButton } from "@/components/auth/common/PrimaryButton";
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
    <section className="auth-card w-full max-w-[500px] rounded-xl border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.09)] sm:p-7">
      <div className="mb-6 text-center">
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0863c5]">
          Xác thực email
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-900">
          Nhập mã OTP
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-slate-500">
          Mã xác thực đã được gửi tới <strong>{email}</strong>. Mã có hiệu lực
          trong 3 phút.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
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
          <p role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        )}
        {info && <p className="text-xs font-medium text-emerald-600">{info}</p>}

        <PrimaryButton disabled={submitting}>
          {submitting ? "Đang xác thực..." : "Xác thực và đăng nhập"}
        </PrimaryButton>
      </form>

      <div className="mt-5 flex flex-col items-center gap-3 border-t border-slate-100 pt-5 text-sm text-slate-500">
        <button
          type="button"
          onClick={onResend}
          disabled={resending}
          className="font-semibold text-[#0863c5] hover:underline disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resending ? "Đang gửi lại..." : "Gửi lại mã OTP"}
        </button>
        <Link
          href="/auth/login"
          className="font-semibold text-[#0863c5] hover:underline"
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
      router.replace("/home");
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
