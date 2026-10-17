import type { ReactNode } from "react";
import { cn } from "@/src/lib/utils/cn";

type AdminCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  /** Icon hiển thị trong ô vuông màu cạnh tiêu đề */
  icon?: ReactNode;
  /** Nút / liên kết ở góc phải tiêu đề */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Thay hoàn toàn padding mặc định (p-5) của phần thân */
  bodyClassName?: string;
};

/** Thẻ nội dung dùng chung cho các trang quản trị */
export function AdminCard({
  title,
  description,
  icon,
  action,
  children,
  className,
  bodyClassName,
}: AdminCardProps) {
  return (
    <section className={cn("flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-xs", className)}>
      {title ? (
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            {icon ? (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-light text-brand">
                {icon}
              </span>
            ) : null}
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-bold text-slate-900">{title}</h3>
              {description ? (
                <p className="mt-0.5 text-xs text-slate-500">{description}</p>
              ) : null}
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("min-h-0 flex-1", bodyClassName ?? "p-5")}>{children}</div>
    </section>
  );
}

type AdminEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  className?: string;
};

/** Trạng thái rỗng thống nhất cho bảng / danh sách */
export function AdminEmptyState({ icon, title, description, className }: AdminEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-6 py-10 text-center", className)}>
      {icon ? (
        <span className="mb-1 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {description ? <p className="max-w-sm text-xs leading-relaxed text-slate-500">{description}</p> : null}
    </div>
  );
}
