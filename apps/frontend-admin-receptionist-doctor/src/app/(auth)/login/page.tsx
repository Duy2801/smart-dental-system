"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ROUTES } from "@/src/constants/routes";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Fake API call to show loading state
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col lg:flex-row">
      {/* Cột 1: Form Login */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-[45%] lg:px-20 xl:px-32">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 text-left">
            <div className="mb-6 inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-bold tracking-wide text-white shadow-sm">
              Smart Dental System
            </div>
            <h1 className="text-3xl font-medium tracking-tight text-brand-dark">
              Đăng nhập hệ thống
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Quản lý phòng khám nha khoa thông minh.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-brand-dark"
                >
                  Email / Số điện thoại
                </label>
                <input
                  id="email"
                  name="email"
                  type="text"
                  autoComplete="username"
                  required
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-brand-dark"
                  >
                    Mật khẩu
                  </label>
                  <Link
                    href={ROUTES.FORGOT_PASSWORD}
                    className="text-sm font-medium text-brand transition-colors hover:text-brand-dark hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full rounded-lg bg-brand px-4 py-3 text-sm font-medium text-white transition-all hover:bg-brand-dark active:scale-[0.98] disabled:pointer-events-none disabled:opacity-80"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang đăng nhập
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Cột 2: Hình ảnh minh họa */}
      <div className="relative hidden w-full overflow-hidden bg-brand-light lg:block lg:w-[55%]">
        <Image
          src="/dental-hero-v2.png"
          alt="Không gian phòng khám nha khoa hiện đại"
          fill
          priority
          className="scale-[1.05] object-cover"
        />
        <div className="absolute inset-0 bg-brand-dark/10 mix-blend-multiply" />
      </div>
    </div>
  );
}
