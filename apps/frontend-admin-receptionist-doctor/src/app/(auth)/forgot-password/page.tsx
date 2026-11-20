"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";
import apiClient from "@/src/lib/api/client";
import { getApiErrorMessage } from "@/src/lib/utils/api-error";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiClient.post("/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });
      // Backend luôn trả cùng một kết quả để không lộ email nào đã đăng ký
      setSent(true);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Không gửi được yêu cầu. Vui lòng thử lại."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-brand-light/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-xl shadow-brand-dark/5">
        <h1 className="text-2xl font-semibold text-brand-dark">Quên mật khẩu</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Nhập email để nhận liên kết đặt lại mật khẩu.
        </p>

        {sent ? (
          <div
            role="status"
            className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            Nếu email này có tài khoản, hướng dẫn đặt lại mật khẩu đã được gửi
            tới hộp thư. Liên kết có hiệu lực trong 15 phút.
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-brand-dark"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Đang gửi..." : "Gửi liên kết"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm">
          <Link
            href={ROUTES.LOGIN}
            className="font-medium text-brand hover:text-brand-dark hover:underline"
          >
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
