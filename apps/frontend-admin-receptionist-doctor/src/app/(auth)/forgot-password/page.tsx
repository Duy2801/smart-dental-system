import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl border border-border bg-white p-8 shadow-xl shadow-brand-dark/10">
      <h1 className="text-2xl font-semibold text-brand-dark">Quên mật khẩu</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Nhập email để nhận liên kết đặt lại mật khẩu.
      </p>

      <form className="mt-6 space-y-4">
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
            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Gửi liên kết
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link
          href={ROUTES.LOGIN}
          className="font-medium text-brand hover:text-brand-dark hover:underline"
        >
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
