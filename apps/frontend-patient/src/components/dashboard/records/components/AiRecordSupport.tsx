import { DashboardIcon } from "../../common/DashboardIcon";

export function AiRecordSupport() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50 p-5 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-white text-[#0863c5] shadow-sm">
        <DashboardIcon name="sparkles" className="h-5 w-5" />
      </span>
      <h2 className="mt-3 text-sm font-bold text-slate-800">Cần hỗ trợ với kết quả?</h2>
      <p className="mt-2 text-[10px] leading-4 text-slate-500">
        Trợ lý AI và đội ngũ bác sĩ luôn sẵn sàng giải đáp các chỉ số trong hồ sơ của bạn.
      </p>
      <button type="button" className="mt-3 text-[10px] font-bold text-[#0863c5] hover:underline">
        Liên hệ tư vấn ngay →
      </button>
    </section>
  );
}
