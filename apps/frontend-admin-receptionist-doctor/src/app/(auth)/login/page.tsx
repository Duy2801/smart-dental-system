"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROLE_HOME, type Role } from "@/src/constants/roles";
import { ROUTES } from "@/src/constants/routes";
import apiClient from "@/src/lib/api/client";
import { canAccessRoute } from "@/src/lib/auth/permissions";

type LoginResponse = {
  user: {
    id: string;
    email: string;
    fullName: string;
    roles?: string[];
    role?: Role;
    doctorId?: string | null;
  };
  accessToken: string;
  refreshToken: string;
};

const staffRoles: Role[] = ["ADMIN", "DOCTOR", "RECEPTIONIST"];

function setCookie(
  name: string,
  value: string,
  maxAgeSeconds = 7 * 24 * 60 * 60,
) {
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function getStaffRole(user: LoginResponse["user"]): Role | null {
  if (user.role && staffRoles.includes(user.role)) return user.role;

  const role = user.roles?.find((item): item is Role =>
    staffRoles.includes(item as Role),
  );

  return role ?? null;
}

function getCallbackUrl() {
  if (typeof window === "undefined") return null;

  const callbackUrl = new URLSearchParams(window.location.search).get(
    "callbackUrl",
  );

  return callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : null;
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const response = await apiClient.post<LoginResponse>("/auth/login", {
        email,
        password,
      });
      const session = response.data;
      const role = getStaffRole(session.user);

      if (!role) {
        setError("Tài khoản này không có quyền truy cập hệ thống nội bộ.");
        return;
      }

      setCookie("access_token", session.accessToken, 15 * 60);
      setCookie("refresh_token", session.refreshToken);
      setCookie("role", role);
      setCookie("session", "authenticated");
      setCookie(
        "user_info",
        JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.fullName,
          roles: session.user.roles ?? [role],
          role,
          doctorId: session.user.doctorId ?? null,
        }),
      );

      const callbackUrl = getCallbackUrl();
      const destination =
        callbackUrl && canAccessRoute(role, callbackUrl)
          ? callbackUrl
          : ROLE_HOME[role];

      router.replace(destination);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Đăng nhập thất bại. Vui lòng thử lại.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] w-full flex-col lg:flex-row">
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
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
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

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </div>
      </div>

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
