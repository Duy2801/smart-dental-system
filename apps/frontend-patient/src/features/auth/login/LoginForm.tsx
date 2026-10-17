"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEventHandler, Ref } from "react";
import { FormField } from "../common/FormField";
import { PrimaryButton } from "../common/PrimaryButton";
import { useClinicConfigQuery } from "@/features/dashboard/home/hooks/useHomeQueries";
import { CaptchaWidget, type CaptchaHandle } from "./CaptchaWidget";

type LoginFormProps = {
  passwordVisible: boolean;
  error: string | null;
  submitting: boolean;
  onTogglePassword: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onGoogleClick?: () => void;
  googleSubmitting?: boolean;
  captchaRef: Ref<CaptchaHandle>;
};

export function LoginForm({
  passwordVisible,
  error,
  submitting,
  onTogglePassword,
  onSubmit,
  onGoogleClick,
  googleSubmitting,
  captchaRef,
}: LoginFormProps) {
  const { data: clinic } = useClinicConfigQuery();
  const logoSrc = clinic?.logoUrl?.trim() ? clinic.logoUrl : "/clinic-logo.png";
  const clinicName = clinic?.name || "Smart Dental Clinic";

  return (
    <section className="w-full flex-1 sm:flex-initial flex flex-col justify-center rounded-none sm:rounded-3xl border-0 sm:border sm:border-slate-200/90 bg-white p-5 sm:p-7 sm:px-8 shadow-none sm:shadow-xl sm:shadow-slate-200/70 transition-all">
      {/* Brand Header */}
      <div className="mb-4 sm:mb-5 tall:mb-8 text-center">
        {/* Logo phòng khám (nhỏ hơn trên màn thấp để trang không phải cuộn) */}
        <span className="mx-auto mb-3 tall:mb-4 grid h-12 w-12 tall:h-14 tall:w-14 place-items-center overflow-hidden rounded-2xl bg-white shadow-md shadow-blue-900/10 ring-1 ring-slate-200/80">
          <Image
            src={logoSrc}
            alt={`Logo ${clinicName}`}
            width={56}
            height={56}
            unoptimized
            priority
            className="h-9 w-9 tall:h-11 tall:w-11 object-contain"
          />
        </span>
        <h1 className="text-xl sm:text-2xl tall:text-[28px] font-black tracking-tight text-slate-900">
          Đăng nhập tài khoản
        </h1>
        <p className="mt-0.5 tall:mt-2 text-xs tall:text-sm text-slate-500">
          Chào mừng trở lại! Vui lòng nhập thông tin để tiếp tục.
        </p>
      </div>

      <form className="space-y-2.5 sm:space-y-3 tall:space-y-4.5" onSubmit={onSubmit}>
        <FormField
          label="Địa chỉ Email"
          icon="mail"
          name="email"
          type="email"
          defaultValue="patient01@smartdental.test"
          placeholder="example@gmail.com"
          autoComplete="email"
          required
        />
        <FormField
          label="Mật khẩu"
          icon="lock"
          type="password"
          name="password"
          defaultValue="Test@123456"
          placeholder="Nhập mật khẩu của bạn"
          autoComplete="current-password"
          passwordVisible={passwordVisible}
          onTogglePassword={onTogglePassword}
          required
          hint={
            <Link
              href="/auth/forgot-password"
              className="text-xs font-semibold text-[#0863c5] transition hover:underline"
            >
              Quên mật khẩu?
            </Link>
          }
        />

        <CaptchaWidget
          ref={captchaRef}
          siteKey={process.env.NEXT_PUBLIC_WAU_CAPTCHA_SITE_KEY}
        />

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/90 p-2.5 text-xs font-semibold text-red-600 animate-in fade-in"
          >
            <svg
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500"
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

        <div className="pt-1 tall:pt-2">
          <PrimaryButton
            type="submit"
            disabled={submitting || googleSubmitting}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Đang xác thực...
              </span>
            ) : (
              <span>Đăng nhập ngay</span>
            )}
          </PrimaryButton>
        </div>
      </form>

      <div className="my-3 sm:my-3.5 tall:my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-slate-200/80" />
        <span>Hoặc tiếp tục với</span>
        <span className="h-px flex-1 bg-slate-200/80" />
      </div>

      <button
        type="button"
        onClick={onGoogleClick}
        disabled={submitting || googleSubmitting}
        className="flex h-10 tall:h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {googleSubmitting ? (
          <span className="inline-flex items-center gap-2 text-slate-500">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#4285F4]" />
            Đang xác thực Google...
          </span>
        ) : (
          <>
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
            <span>Tài khoản Google</span>
          </>
        )}
      </button>

      <p className="mt-3.5 tall:mt-7 border-t border-slate-100 pt-2.5 tall:pt-5 text-center text-xs tall:text-sm text-slate-500">
        Chưa có tài khoản?{" "}
        <Link
          href="/auth/register"
          className="font-bold text-[#0863c5] transition hover:underline"
        >
          Đăng ký tài khoản bệnh nhân
        </Link>
      </p>
    </section>
  );
}
