import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";

const links = [
  {
    href: ROUTES.ADMIN.USERS,
    label: "Nhân sự",
    description: "Tài khoản & phân quyền",
  },
  {
    href: ROUTES.ADMIN.SCHEDULES,
    label: "Lịch làm việc",
    description: "Phân ca bác sĩ",
  },
  {
    href: ROUTES.ADMIN.SERVICES,
    label: "Dịch vụ & Giá",
    description: "Danh mục & bảng giá",
  },
  {
    href: ROUTES.ADMIN.PROMOTIONS,
    label: "Khuyến mãi",
    description: "Voucher & ưu đãi",
  },
  {
    href: ROUTES.ADMIN.FINANCE,
    label: "Tài chính",
    description: "Doanh thu dịch vụ",
  },
  {
    href: ROUTES.ADMIN.REPORTS,
    label: "Báo cáo",
    description: "Xuất PDF/Excel",
  },
  {
    href: ROUTES.ADMIN.REVIEWS,
    label: "Đánh giá",
    description: "Duyệt review BN",
  },
  {
    href: ROUTES.ADMIN.MARKETING,
    label: "Marketing",
    description: "Gửi email ưu đãi",
  },
];

export function QuickLinks() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="group rounded-xl border border-border bg-white p-4 transition-colors hover:border-brand hover:bg-brand-light/30"
        >
          <p className="text-sm font-semibold text-brand-dark">{link.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {link.description}
          </p>
        </Link>
      ))}
    </div>
  );
}
