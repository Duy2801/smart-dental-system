"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEventHandler } from "react";
import { FormField } from "../common/FormField";
import { PrimaryButton } from "../common/PrimaryButton";
import { useClinicConfigQuery } from "@/features/dashboard/home/hooks/useHomeQueries";

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
  const { data: clinic } = useClinicConfigQuery();
  const logoSrc = clinic?.logoUrl?.trim() ? clinic.logoUrl : "/clinic-logo.png";
  const clinicName = clinic?.name || "Smart Dental System";

  return (
    <section className="w-full flex-1 sm:flex-initial flex flex-col justify-center rounded-none sm:rounded-3xl border-0 sm:border sm:border-slate-200/90 bg-white p-5 sm:p-7 sm:px-8 shadow-none sm:shadow-xl sm:shadow-slate-200/70 transition-all">
      {/* Brand Header */}
      <div className="mb-6 sm:mb-7 text-center">
        <div className="mx-auto mb-3 inline-flex items-center gap-2.5 rounded-full bg-blue-50/80 px-3.5 py-1.5 ring-1 ring-blue-100 shadow-2xs">
          <span className="grid h-6 w-6 place-items-center overflow-hidden rounded-full bg-white shadow-2xs">
            <Image
              src={logoSrc}
              alt={`Logo ${clinicName}`}
              width={24}
              height={24}
              unoptimized
              className="h-5 w-5 object-contain"
            />
          </span>
          <span className="text-xs font-bold tracking-tight text-[#0863c5]">
            {clinicName}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          Tạo tài khoản bệnh nhân
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Đăng ký để chủ động đặt lịch và theo dõi hồ sơ điều trị.
        </p>
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
                <span>Đăng ký tài khoản</span>
              )}
            </PrimaryButton>
          </div>
        </form>

        <p className="mt-5 border-t border-slate-100 pt-3.5 text-center text-xs text-slate-500">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-extrabold text-[#0863c5] transition hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </section>
    );
}

