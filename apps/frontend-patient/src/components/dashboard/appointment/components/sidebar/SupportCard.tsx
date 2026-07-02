import Link from "next/link";
import { DashboardIcon } from "../../../common/DashboardIcon";

export function SupportCard() {
  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0863c5] to-[#064b9c] p-5 text-white shadow-lg shadow-blue-100">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15">
        <DashboardIcon name="chat" className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-lg font-bold">Cần trợ giúp?</h2>
      <p className="mt-2 text-xs leading-5 text-blue-100">
        Đội ngũ tư vấn luôn sẵn sàng hỗ trợ bạn lựa chọn dịch vụ và bác sĩ phù hợp.
      </p>
      <Link
        href="/contact"
        className="mt-4 flex h-10 items-center justify-center rounded-xl bg-white text-xs font-bold text-[#0863c5] hover:bg-blue-50"
      >
        Kết nối với tư vấn viên
      </Link>
    </section>
  );
}
