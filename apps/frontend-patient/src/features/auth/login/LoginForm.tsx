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
    <section className="auth-card w-full max-w-[400px] rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
          <svg
            aria-hidden="true"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Đăng nhập
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Nhập thông tin tài khoản của bạn để tiếp tục
        </p>
      </div>

      <form className="space-y-3.5" onSubmit={onSubmit}>
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
              className="text-[11px] font-semibold text-blue-600 transition hover:underline"
            >
              Quên mật khẩu?
            </Link>
          }
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

        <PrimaryButton disabled={submitting} className="mt-1">
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang đăng nhập...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              Đăng nhập
              <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </span>
          )}
        </PrimaryButton>
      </form>

      <div className="my-4 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        Hoặc tiếp tục với
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <button
        type="button"
        className="flex h-9.5 w-full items-center justify-center gap-2.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none active:scale-[0.99]"
      >
        <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        Tài khoản Google
      </button>

      <p className="my-4 text-center text-xs text-slate-600">
        Chưa có tài khoản?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-blue-600 hover:underline"
        >
          Tạo tài khoản bệnh nhân →
        </Link>
      </p>

      <SecurityNotice />
    </section>
  );
}
