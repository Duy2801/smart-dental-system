import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";

export function RecordToolsSidebar() {
  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      <section className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,.05)]">
        <h2 className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">
          Công cụ hồ sơ
        </h2>
        <div className="mt-4 space-y-2">
          <button className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0058bc]">
            <DashboardIcon
              name="document"
              className="h-5 w-5 text-[#0058bc]"
            />
            Tải toàn bộ hồ sơ PDF
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0058bc]">
            <DashboardIcon name="shield" className="h-5 w-5 text-[#0058bc]" />
            Chia sẻ bảo mật (2FA)
          </button>
          <Link
            href="/appointment"
            className="flex w-full items-center gap-3 rounded-xl bg-[#0058bc] p-3 text-xs font-bold text-white shadow-lg shadow-blue-100"
          >
            <DashboardIcon name="calendar" className="h-5 w-5" />
            Đặt lịch tái khám
          </Link>
        </div>
      </section>
    </aside>
  );
}
