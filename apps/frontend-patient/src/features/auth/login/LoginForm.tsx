"use client";

import Link from "next/link";
import type { FormEventHandler } from "react";
import { FormField } from "../common/FormField";
import { PrimaryButton } from "../common/PrimaryButton";
import { SecurityNotice } from "../common/SecurityNotice";

type LoginFormProps = {
  passwordVisible: boolean;
  error: string | null;
  submitting: boolean;
  onTogglePassword: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function LoginForm({
  passwordVisible,
  error,
  submitting,
  onTogglePassword,
  onSubmit,
}: LoginFormProps) {
  return (
    <section className="auth-card w-full max-w-[420px] rounded-xl border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.09)] sm:p-7">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#0863c5]">
          <svg
            aria-hidden="true"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="5" y="3.5" width="14" height="17" rx="2" />
            <path d="M8.5 8h7M8.5 11.5h7M9 15.5h6M12 14v3" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-slate-900">
          Chào mừng trở lại
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Đăng nhập để quản lý sức khỏe răng miệng của bạn.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <FormField
          label="Email"
          icon="mail"
          name="email"
          type="email"
          placeholder="name@email.com"
          autoComplete="username"
          required
        />
        <FormField
          label="Mật khẩu"
          icon="lock"
          type="password"
          name="password"
          placeholder="Nhập mật khẩu"
          autoComplete="current-password"
          passwordVisible={passwordVisible}
          onTogglePassword={onTogglePassword}
          required
          hint={
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-[#0863c5] hover:underline"
            >
              Quên mật khẩu?
            </Link>
          }
        />

        {error && (
          <p role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        <PrimaryButton disabled={submitting}>
          {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
          {!submitting && <span aria-hidden="true">→</span>}
        </PrimaryButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        Hoặc tiếp tục với
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
      >
        <span className="text-base font-bold text-[#4285f4]">G</span>
        Tài khoản Google
      </button>

      <p className="my-5 text-center text-sm text-slate-500">
        Chưa có tài khoản?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-[#0863c5] hover:underline"
        >
          Tạo tài khoản bệnh nhân
        </Link>
      </p>

      <SecurityNotice />
    </section>
  );
}
