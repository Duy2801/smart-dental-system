"use client";

import Image from "next/image";
import Link from "next/link";
import type { FormEventHandler } from "react";
import { FormField } from "../common/FormField";
import { PrimaryButton } from "../common/PrimaryButton";

type LoginFormProps = {
  passwordVisible: boolean;
  error: string | null;
  submitting: boolean;
  onTogglePassword: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onGoogleClick?: () => void;
  googleSubmitting?: boolean;
};

export function LoginForm({
  passwordVisible,
  error,
  submitting,
  onTogglePassword,
  onSubmit,
  onGoogleClick,
  googleSubmitting,
}: LoginFormProps) {
  return (
    <div className="w-full sm:max-w-[400px] flex-1 sm:flex-initial flex flex-col justify-center px-4 sm:px-0 py-6 sm:py-0">
      <section className="w-full bg-white border-0 sm:border sm:border-slate-200/80 rounded-none sm:rounded-2xl shadow-none sm:shadow-lg sm:shadow-slate-200/50 p-0 sm:p-7 transition-all">
        {/* Brand Header */}
        <div className="mb-5 sm:mb-5.5 text-center">
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
            Đăng nhập
          </h1>
        </div>

        <form className="space-y-3.5 sm:space-y-4" onSubmit={onSubmit}>
          <FormField
            label="Địa chỉ Email"
            icon="mail"
            name="email"
            type="email"
            placeholder="example@gmail.com"
            autoComplete="email"
            required
          />
          <FormField
            label="Mật khẩu"
            icon="lock"
            type="password"
            name="password"
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

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-xs font-semibold text-red-600 animate-in fade-in"
            >
              {error}
            </div>
          )}

          <div className="pt-1 sm:pt-1.5">
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
                "Đăng nhập ngay"
              )}
            </PrimaryButton>
          </div>
        </form>

        <div className="my-4.5 sm:my-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          <span className="h-px flex-1 bg-slate-200/80" />
          <span>Hoặc tiếp tục với</span>
          <span className="h-px flex-1 bg-slate-200/80" />
        </div>

        <button
          type="button"
          onClick={onGoogleClick}
          disabled={submitting || googleSubmitting}
          className="flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleSubmitting ? (
            <span className="inline-flex items-center gap-2 text-slate-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#4285F4]" />
              Đang xác thực Google...
            </span>
          ) : (
            <>
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
              <span>Tài khoản Google</span>
            </>
          )}
        </button>

        <p className="mt-5 sm:mt-5.5 border-t border-slate-100 pt-3.5 text-center text-xs text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href="/auth/register"
            className="font-bold text-[#0863c5] transition hover:underline"
          >
            Đăng ký tài khoản bệnh nhân
          </Link>
        </p>
      </section>
    </div>
  );
}

