"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEventHandler } from "react";
import { FormField } from "../common/FormField";
import { PrimaryButton } from "../common/PrimaryButton";

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
    <div className="w-full sm:max-w-[440px] flex-1 sm:flex-initial flex flex-col justify-center px-4 sm:px-0 py-6 sm:py-0">
      <section className="w-full bg-white border-0 sm:border sm:border-slate-200/80 rounded-none sm:rounded-2xl shadow-none sm:shadow-lg sm:shadow-slate-200/50 p-0 sm:p-7 transition-all">
        {/* Brand Header */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 flex items-center justify-center gap-2">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-blue-50 ring-1 ring-blue-100/90 shadow-2xs">
              <Image
                src="/clinic-logo.png"
                alt="Logo Smart Dental System"
                width={32}
                height={32}
                className="h-7 w-7 object-contain"
              />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-slate-800">
              Smart Dental System
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Tạo tài khoản bệnh nhân
          </h1>
        </div>

        <form className="space-y-3.5 sm:space-y-4" onSubmit={onSubmit}>
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
              label="Địa chỉ Email"
              icon="mail"
              type="email"
              name="email"
              placeholder="example@gmail.com"
              autoComplete="email"
              required
            />
            <FormField
              label="Số điện thoại"
              icon="phone"
              type="tel"
              name="phone"
              placeholder="09xx xxx xxx"
              autoComplete="tel"
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

          <label className="flex cursor-pointer items-start gap-2 py-0.5 text-xs text-slate-600 select-none">
            <input
              type="checkbox"
              name="terms"
              required
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300 accent-[#0863c5] focus:ring-blue-500/20"
            />
            <span className="leading-snug text-[11px] sm:text-xs">
              Tôi đồng ý với{" "}
              <Link
                href="/terms"
                className="font-bold text-[#0863c5] hover:underline"
              >
                Điều khoản
              </Link>{" "}
              và{" "}
              <Link
                href="/privacy"
                className="font-bold text-[#0863c5] hover:underline"
              >
                Chính sách bảo mật
              </Link>
              .
            </span>
          </label>

          <div className="pt-1">
            <PrimaryButton disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Đăng ký tài khoản
                  <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              )}
            </PrimaryButton>
          </div>
        </form>

        <p className="mt-5 border-t border-slate-100 pt-3.5 text-center text-xs text-slate-500">
          Đã có tài khoản?{" "}
          <Link
            href="/auth/login"
            className="font-extrabold text-[#0863c5] transition hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </section>
    </div>
  );
}

