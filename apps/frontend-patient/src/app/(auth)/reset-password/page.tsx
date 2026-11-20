"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import apiClient from "@/lib/axios";

import { FormField } from "@/features/auth/common/FormField";
import { PrimaryButton } from "@/features/auth/common/PrimaryButton";

// Trùng quy tắc với ResetPasswordDto ở backend
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;

const ERROR_MESSAGES: Record<string, string> = {
  "auth.reset_token_invalid":
    "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (15 phút). Vui lòng gửi yêu cầu mới.",
};

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const raw = (error.response?.data as { message?: unknown } | undefined)
      ?.message;
    const message = Array.isArray(raw) ? raw[0] : raw;
    if (typeof message === "string") {
      return ERROR_MESSAGES[message] ?? message;
    }
  }
  return "Không thể đặt lại mật khẩu. Vui lòng thử lại sau.";
}

function ResetPasswordForm() {
  const token = useSearchParams().get("token")?.trim() ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!PASSWORD_PATTERN.test(password)) {
      setErrorMessage(
        "Mật khẩu cần 8–72 ký tự, có chữ hoa, chữ thường và chữ số.",
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Mật khẩu nhập lại không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post("/auth/reset-password", {
        token,
        newPassword: password,
      });
      setDone(true);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-semibold text-rose-700">
          Liên kết đặt lại mật khẩu thiếu mã xác thực. Vui lòng mở đúng liên
          kết trong email hoặc gửi yêu cầu mới.
        </div>
        <Link
          href="/auth/forgot-password"
          className="inline-block text-sm font-extrabold text-[#0863c5] hover:underline"
        >
          Gửi lại yêu cầu đặt lại mật khẩu
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs font-semibold text-emerald-800">
          Đặt lại mật khẩu thành công. Các phiên đăng nhập cũ đã bị đăng xuất.
        </div>
        <Link
          href="/login"
          className="inline-block text-sm font-extrabold text-[#0863c5] hover:underline"
        >
          Đăng nhập bằng mật khẩu mới
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50/90 p-2.5 text-xs font-semibold text-rose-700"
        >
          {errorMessage}
        </div>
      )}

      <FormField
        label="Mật khẩu mới"
        icon="lock"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
        maxLength={72}
        placeholder="Ít nhất 8 ký tự"
        autoComplete="new-password"
      />

      <FormField
        label="Nhập lại mật khẩu mới"
        icon="lock"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        minLength={8}
        maxLength={72}
        placeholder="Nhập lại mật khẩu"
        autoComplete="new-password"
      />

      <p className="text-[11px] text-slate-500">
        Mật khẩu cần có chữ hoa, chữ thường và chữ số.
      </p>

      <div className="pt-1">
        <PrimaryButton disabled={submitting}>
          {submitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </PrimaryButton>
      </div>

      <p className="mt-5 border-t border-slate-100 pt-3.5 text-center text-xs text-slate-500">
        Nhớ lại mật khẩu?{" "}
        <Link
          href="/login"
          className="font-extrabold text-[#0863c5] transition hover:underline"
        >
          Đăng nhập ngay
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <section className="w-full flex-1 sm:flex-initial flex flex-col justify-center rounded-none sm:rounded-3xl border-0 sm:border sm:border-slate-200/90 bg-white p-5 sm:p-7 sm:px-8 shadow-none sm:shadow-xl sm:shadow-slate-200/70 transition-all">
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Đặt lại mật khẩu
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Tạo mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </section>
  );
}
