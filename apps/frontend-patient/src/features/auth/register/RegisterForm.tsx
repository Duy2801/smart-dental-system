"use client";

import Link from "next/link";
import type { FormEventHandler } from "react";
import { FormField } from "../common/FormField";
import { PrimaryButton } from "../common/PrimaryButton";
import { SecurityNotice } from "../common/SecurityNotice";

type RegisterFormProps = {
  passwordVisible: boolean;
  confirmPasswordVisible: boolean;
  error: string | null;
  submitting: boolean;
  onTogglePassword: () => void;
  onToggleConfirmPassword: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function RegisterForm({
  passwordVisible,
  confirmPasswordVisible,
  error,
  submitting,
  onTogglePassword,
  onToggleConfirmPassword,
  onSubmit,
}: RegisterFormProps) {
  return (
    <section className="auth-card w-full max-w-[460px] rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-900/5">
      <div className="mb-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/60 bg-blue-50 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
          Chăm sóc nha khoa với AI
        </span>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Tạo tài khoản mới
        </h1>
        <p className="mx-auto mt-1 max-w-xs text-xs text-slate-500">
          Bắt đầu hành trình chăm sóc răng miệng cùng DentaAI.
        </p>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <FormField
          label="Họ và tên"
          icon="user"
          name="fullName"
          placeholder="Nguyễn Văn An"
          autoComplete="name"
          required
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="Số điện thoại"
            icon="phone"
            type="tel"
            name="phone"
            placeholder="09xx xxx xxx"
            autoComplete="tel"
            required
          />
          <FormField
            label="Email"
            icon="mail"
            type="email"
            name="email"
            placeholder="name@email.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="Mật khẩu"
            icon="lock"
            type="password"
            name="password"
            placeholder="Tối thiểu 8 ký tự"
            autoComplete="new-password"
            minLength={8}
            passwordVisible={passwordVisible}
            onTogglePassword={onTogglePassword}
            required
          />
          <FormField
            label="Xác nhận mật khẩu"
            icon="lock"
            type="password"
            name="confirmPassword"
            placeholder="Nhập lại mật khẩu"
            autoComplete="new-password"
            minLength={8}
            passwordVisible={confirmPasswordVisible}
            onTogglePassword={onToggleConfirmPassword}
            required
          />
        </div>

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

        <label className="flex cursor-pointer items-start gap-2.5 py-0.5 text-xs leading-tight text-slate-600">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300 accent-blue-600"
          />
          <span>
            Tôi đồng ý với{" "}
            <Link
              href="/terms"
              className="font-semibold text-blue-600 hover:underline"
            >
              Điều khoản
            </Link>{" "}
            và{" "}
            <Link
              href="/privacy"
              className="font-semibold text-blue-600 hover:underline"
            >
              Bảo mật
            </Link>{" "}
            của DentaAI.
          </span>
        </label>

        <PrimaryButton disabled={submitting} className="mt-1">
          {submitting ? (
            <span className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang đăng ký...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              Đăng ký ngay
              <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </span>
          )}
        </PrimaryButton>
      </form>

      <p className="my-4 border-t border-slate-100 pt-3 text-center text-xs text-slate-600">
        Đã có tài khoản?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-blue-600 hover:underline"
        >
          Đăng nhập tại đây →
        </Link>
      </p>

      <SecurityNotice />
    </section>
  );
}
