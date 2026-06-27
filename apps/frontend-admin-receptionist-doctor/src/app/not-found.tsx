import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 dark:bg-black">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Không tìm thấy trang
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Trang bạn truy cập không tồn tại.
      </p>
      <Link
        href={ROUTES.LOGIN}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900"
      >
        Về trang đăng nhập
      </Link>
    </div>
  );
}
