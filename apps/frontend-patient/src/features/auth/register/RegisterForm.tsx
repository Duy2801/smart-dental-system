"use client";

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
    <section className="auth-card w-full max-w-[500px] rounded-xl border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.09)] sm:p-7">
      <div className="mb-6 text-center">
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#0863c5]">
          Chăm sóc nha khoa với AI
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-[-0.03em] text-slate-900">
          Tạo tài khoản mới
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-5 text-slate-500">
          Bắt đầu hành trình chăm sóc răng miệng hiện đại và an tâm hơn cùng
          DentaAI.
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <FormField
          label="Họ và tên"
          icon="user"
          name="fullName"
          placeholder="Nguyễn Văn An"
          autoComplete="name"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
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
        <div className="grid gap-4 sm:grid-cols-2">
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
          <p role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        <label className="flex cursor-pointer items-start gap-3 py-1 text-xs leading-5 text-slate-600">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-1 h-4 w-4 shrink-0 accent-[#0863c5]"
          />
          <span>
            Tôi đồng ý với{" "}
            <Link
              href="/terms"
              className="font-semibold text-[#0863c5] hover:underline"
            >
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link
              href="/privacy"
              className="font-semibold text-[#0863c5] hover:underline"
            >
              Chính sách bảo mật
            </Link>{" "}
            của DentaAI.
          </span>
        </label>

        <PrimaryButton disabled={submitting}>
          {submitting ? "Đang đăng ký..." : "Đăng ký ngay"}
        </PrimaryButton>
      </form>

      <p className="mt-5 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
        Đã có tài khoản?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-[#0863c5] hover:underline"
        >
          Đăng nhập tại đây
        </Link>
      </p>
      <p className="mt-4 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
        ◈ Bảo mật dữ liệu theo tiêu chuẩn y tế
      </p>
    </section>
  );
}
