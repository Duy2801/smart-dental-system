"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import apiClient from "@/lib/axios";
import { AxiosError } from "axios";

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
    <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
      <div className="text-center">
        <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
          Quên mật khẩu?
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Nhập địa chỉ email đăng ký để nhận liên kết đặt lại mật khẩu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {successMessage ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs font-semibold text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-semibold text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold text-slate-700"
          >
            Địa chỉ email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@gmail.com"
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 outline-none transition focus:border-[#0863c5] focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[#0863c5] py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? "Đang xử lý..." : "Gửi yêu cầu đặt lại"}
        </button>

        <div className="pt-2 text-center text-xs font-bold text-slate-500">
          Nhớ lại mật khẩu?{" "}
          <Link
            href="/auth/login"
            className="text-[#0863c5] hover:text-blue-700 hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </form>
    </div>
  );
}
