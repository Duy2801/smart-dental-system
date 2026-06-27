import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted px-4">
      <h2 className="text-lg font-semibold text-brand-dark">Không tìm thấy trang</h2>
      <p className="text-sm text-muted-foreground">
        Trang bạn truy cập không tồn tại.
      </p>
      <Link
        href={ROUTES.LOGIN}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
      >
        Về trang đăng nhập
      </Link>
    </div>
  );
}
