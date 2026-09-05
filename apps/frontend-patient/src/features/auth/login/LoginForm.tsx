"use client";

import Image from "next/image";
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
    <div className="w-full max-w-[420px]">
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 lg:p-7 shadow-xl shadow-slate-900/10 transition-all">
        <div className="mb-3.5 text-center">
          <div className="mx-auto mb-2 flex items-center justify-center gap-2">
            <span className="grid h-7 w-7 sm:h-8 sm:w-8 place-items-center overflow-hidden rounded-full bg-white shadow-xs ring-1 ring-slate-200">
              <Image
                src="/clinic-logo.png"
                alt="Logo Smart Dental System"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </span>
            <span className="font-black text-slate-900 text-sm tracking-tight">Smart Dental System</span>
          </div>

          <div className="mx-auto mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-0.5 text-[11px] font-bold text-[#0863c5]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0863c5] animate-ping" />
            <span>Chào mừng bạn quay trở lại 👋</span>
          </div>
          <h1 className="text-lg font-black tracking-tight text-slate-950 sm:text-2xl">
            Đăng nhập
          </h1>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            Nhập thông tin tài khoản bệnh nhân để quản lý hồ sơ và đặt lịch khám.
          </p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit}>
          <FormField
            label="Địa chỉ Email"
            icon="mail"
            name="email"
            type="email"
            placeholder="example@gmail.com"
            autoComplete="off"
            required
          />
          <FormField
            label="Mật khẩu"
            icon="lock"
            type="password"
            name="password"
            placeholder="Nhập mật khẩu của bạn"
            autoComplete="off"
            passwordVisible={passwordVisible}
            onTogglePassword={onTogglePassword}
            required
            hint={
              <Link
                href="/auth/forgot-password"
                className="text-[11px] font-bold text-[#0863c5] transition hover:text-blue-700 hover:underline"
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

          <PrimaryButton
            type="submit"
            className="w-full h-10 text-xs font-bold rounded-xl shadow-md shadow-blue-500/15"
            disabled={submitting || googleSubmitting}
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Đang xác thực...
              </span>
            ) : (
              "Đăng nhập ngay"
            )}
          </PrimaryButton>
        </form>

        <div className="my-3.5 flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>Hoặc tiếp tục với</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={onGoogleClick}
          disabled={submitting || googleSubmitting}
          className="flex h-9.5 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 shadow-2xs transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {googleSubmitting ? (
            <span className="inline-flex items-center gap-2 text-slate-500">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-[#4285F4]" />
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
              Tài khoản Google
            </>
          )}
        </button>

        <p className="mt-4 border-t border-slate-100 pt-3 text-center text-xs text-slate-600">
          Chưa có tài khoản?{" "}
          <Link
            href="/auth/register"
            className="font-extrabold text-[#0863c5] transition hover:text-blue-700 hover:underline"
          >
            Đăng ký tài khoản bệnh nhân →
          </Link>
        </p>

        <SecurityNotice />
      </section>
    </div>
  );
}
