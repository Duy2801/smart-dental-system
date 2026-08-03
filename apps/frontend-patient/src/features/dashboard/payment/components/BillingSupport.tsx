import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";
import { ROUTES } from "../../common/routes";
import { T } from "../../common/typography";

export function BillingSupport() {
  return (
    <aside className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-[#0863c5]">
          <DashboardIcon name="chat" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xs font-bold text-slate-900">Cần hỗ trợ về hóa đơn?</h2>
          <p className={`mt-1 ${T.caption}`}>Đội ngũ CSKH luôn sẵn sàng hỗ trợ bạn 24/7.</p>
        </div>
      </div>
      <Link
        href={ROUTES.contact}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-[#0863c5] px-4 text-xs font-semibold text-[#0863c5] transition hover:bg-blue-50"
      >
        Gửi yêu cầu hỗ trợ
      </Link>
    </aside>
  );
}
