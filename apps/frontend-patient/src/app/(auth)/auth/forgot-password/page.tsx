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
    <section className="w-full flex-1 sm:flex-initial flex flex-col justify-center rounded-none sm:rounded-3xl border-0 sm:border sm:border-slate-200/90 bg-white p-5 sm:p-7 sm:px-8 shadow-none sm:shadow-xl sm:shadow-slate-200/70 transition-all">
      <div className="mb-6 text-center">
        <div className="hidden lg:inline-flex mx-auto mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-50 to-sky-100 ring-1 ring-blue-200/80 text-[#0863c5] shadow-xs">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Quên mật khẩu?
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Nhập địa chỉ email đăng ký để nhận liên kết đặt lại mật khẩu.
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
              href="/login"
              className="font-extrabold text-[#0863c5] transition hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </form>
      </section>
  );
}
