"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import apiClient from "@/lib/axios";
import { AxiosError } from "axios";

import { FormField } from "@/features/auth/common/FormField";
import { PrimaryButton } from "@/features/auth/common/PrimaryButton";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      setSuccessMessage(
        "Hướng dẫn khôi phục mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.",
      );
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setErrorMessage(
          error.response?.data?.message ?? "Không thể gửi yêu cầu. Vui lòng thử lại.",
        );
      } else {
        setErrorMessage("Đã có lỗi xảy ra. Vui lòng thử lại sau.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full sm:max-w-[400px] flex-1 sm:flex-initial flex flex-col justify-center px-4 sm:px-0 py-6 sm:py-0">
      <section className="w-full bg-white border-0 sm:border sm:border-slate-200/80 rounded-none sm:rounded-2xl shadow-none sm:shadow-lg sm:shadow-slate-200/50 p-0 sm:p-7 transition-all">
        <div className="mb-5 text-center">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Quên mật khẩu?
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Nhập địa chỉ email đăng ký để nhận hướng dẫn đặt lại mật khẩu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-2.5 text-xs font-semibold text-emerald-800">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-2.5 text-xs font-semibold text-rose-700">
              {errorMessage}
            </div>
          )}

          <FormField
            label="Địa chỉ email"
            icon="mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@gmail.com"
            autoComplete="email"
          />

          <div className="pt-1">
            <PrimaryButton disabled={submitting}>
              {submitting ? "Đang xử lý..." : "Gửi yêu cầu đặt lại"}
            </PrimaryButton>
          </div>

          <p className="mt-5 border-t border-slate-100 pt-3.5 text-center text-xs text-slate-500">
            Nhớ lại mật khẩu?{" "}
            <Link
              href="/auth/login"
              className="font-extrabold text-[#0863c5] transition hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
