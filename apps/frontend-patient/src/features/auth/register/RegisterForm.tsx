"use client";

import Image from "next/image";
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
    <div className="w-full max-w-[480px]">
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 lg:p-6 shadow-xl shadow-slate-900/10 transition-all">
        <div className="mb-3 text-center">
          <div className="mx-auto mb-2 flex items-center justify-center gap-2">
            <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-white shadow-xs ring-1 ring-slate-200">
              <Image
                src="/clinic-logo.png"
                alt="Logo Smart Dental System"
                width={28}
                height={28}
                className="h-full w-full object-cover"
              />
            </span>
            <span className="font-black text-slate-900 text-sm tracking-tight">Smart Dental System</span>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-100 bg-cyan-50/80 px-3 py-0.5 text-[10px] font-bold text-cyan-800">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-600 animate-pulse" />
            Nha khoa Thông minh & Chăm sóc AI 🦷
          </span>
          <h1 className="mt-1.5 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
            Tạo tài khoản mới
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Đăng ký để trải nghiệm đặt lịch nhanh và theo dõi hồ sơ y tế.
          </p>
        </div>

        <form className="space-y-2.5" onSubmit={onSubmit}>
          <FormField
            label="Họ và tên"
            icon="user"
            name="fullName"
            placeholder="Nguyễn Văn An"
            autoComplete="name"
            required
          />

          <div className="grid gap-2.5 sm:grid-cols-2">
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
              label="Địa chỉ Email"
              icon="mail"
              type="email"
              name="email"
              placeholder="example@gmail.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2">
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
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/90 p-2 text-xs font-semibold text-rose-700 shadow-2xs"
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

          <label className="flex cursor-pointer items-start gap-2 py-0.5 text-[11px] leading-snug text-slate-600">
            <input
              type="checkbox"
              name="terms"
              required
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300 accent-[#0863c5] focus:ring-blue-500/20"
            />
            <span>
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
                Bảo mật
              </Link>{" "}
              của Smart Dental.
            </span>
          </label>

          <PrimaryButton disabled={submitting} className="mt-1">
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
                Hoàn tất đăng ký
                <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            )}
          </PrimaryButton>
        </form>

        <p className="mt-3 border-t border-slate-100 pt-2.5 text-center text-xs text-slate-600">
          Đã có tài khoản?{" "}
          <Link
            href="/auth/login"
            className="font-extrabold text-[#0863c5] transition hover:text-blue-700 hover:underline"
          >
            Đăng nhập ngay →
          </Link>
        </p>

        <SecurityNotice />
      </section>
    </div>
  );
}
