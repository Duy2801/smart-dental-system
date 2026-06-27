import Link from "next/link";
import { siteConfig } from "@/src/config/site";
import { ROUTES } from "@/src/constants/routes";

export default function LoginPage() {
  return (
    <div className="rounded-2xl border border-border bg-white p-8 shadow-xl shadow-brand-dark/10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white">
          SD
        </div>
        <h1 className="text-2xl font-semibold text-brand-dark">
          {siteConfig.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Đăng nhập hệ thống nội bộ
        </p>
      </div>

      <form className="space-y-4">
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
            placeholder="admin@phongkham.vn"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-brand-dark"
          >
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Đăng nhập
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href={ROUTES.FORGOT_PASSWORD}
          className="font-medium text-brand hover:text-brand-dark hover:underline"
        >
          Quên mật khẩu?
        </Link>
      </p>
    </div>
  );
}
