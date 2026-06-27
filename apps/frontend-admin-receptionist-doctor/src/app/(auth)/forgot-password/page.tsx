import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Quên mật khẩu
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Nhập email để nhận liên kết đặt lại mật khẩu.
      </p>

      <form className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
        >
          Gửi liên kết
        </button>
      </form>

      <p className="mt-6 text-center text-sm">
        <Link
          href={ROUTES.LOGIN}
          className="font-medium text-zinc-900 hover:underline dark:text-zinc-50"
        >
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}
