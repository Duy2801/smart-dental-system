import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";
import {
  formatMoney,
  getInitials,
  type TreatmentRecordView,
} from "./recordMappers";
import { RecordClinicalImage } from "./RecordClinicalImage";
import { RecordTreatmentTimeline } from "./RecordTreatmentTimeline";

type RecordTreatmentCardProps = {
  treatment: TreatmentRecordView;
  index: number;
};

export function RecordTreatmentCard({
  treatment,
  index,
}: RecordTreatmentCardProps) {
  return (
    <article className="relative border-l-2 border-slate-200 pb-6 pl-6 last:border-transparent">
      <span
        className={`absolute -left-[7px] top-0 h-3 w-3 rounded-full border-[3px] border-[#f6f8fc] ${treatment.active ? "bg-[#0058bc] shadow-[0_0_0_3px_rgba(0,88,188,.1)]" : "bg-slate-300"}`}
      />
      <div
        className={`overflow-hidden rounded-xl border bg-white shadow-[0_6px_24px_rgba(15,23,42,.045)] ${treatment.active ? "border-blue-100" : "border-slate-200"}`}
      >
        <div className="p-5">
          <div className="flex flex-col justify-between gap-2 sm:flex-row">
            <div>
              <h3
                className={`text-base font-bold ${treatment.active ? "text-[#0058bc]" : "text-slate-800"}`}
              >
                {treatment.title}
              </h3>
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                <DashboardIcon name="calendar" className="h-3.5 w-3.5" />
                {treatment.date}
              </p>
            </div>
            <div className="w-fit rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                Răng điều trị
              </p>
              <p className="text-xs font-bold text-[#0058bc]">
                {treatment.tooth}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[1.35fr_.65fr]">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Quy trình lâm sàng
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                {treatment.description}
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 text-[10px] font-bold text-[#0058bc]">
                  {getInitials(treatment.doctor)}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {treatment.doctor}
                  </p>
                  <p className="mt-0.5 text-[9px] text-slate-500">
                    {treatment.specialty}
                  </p>
                  <Link
                    href={index === 0 ? "/doctor/le-hoang-nam" : "/doctor"}
                    className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-[#0058bc] hover:underline"
                  >
                    Liên hệ bác sĩ →
                  </Link>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <RecordClinicalImage type="xray" title="X-Ray" />
              <RecordClinicalImage type="clinical" title="Clinical" />
            </div>
          </div>

          <RecordTreatmentTimeline steps={treatment.treatmentPlan} />

          <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Đơn thuốc & Dặn dò
              </p>
              <p className="mt-2 text-[10px] leading-5 text-slate-600">
                {treatment.prescriptions.map((item) => (
                  <span key={item}>
                    • {item}
                    <br />
                  </span>
                ))}
              </p>
              <button className="mt-1 text-[10px] font-bold text-[#0058bc]">
                ↓ Tải đơn thuốc PDF
              </button>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <div>
                <p className="text-[9px] text-slate-500">Chi phí buổi khám</p>
                <p className="mt-1 text-base font-bold text-slate-900">
                  {formatMoney(treatment.paidAmount)}
                </p>
              </div>
              <div className="text-right">
                <span className="block rounded bg-cyan-50 px-2 py-1 text-[8px] font-bold text-cyan-700">
                  {treatment.paymentStatusLabel}
                </span>
                <span className="mt-1.5 block rounded-full bg-emerald-500 px-2 py-1 text-[8px] font-bold text-white">
                  Đã thanh toán
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-cyan-50 p-3">
              <p className="text-[10px] font-bold text-cyan-700">
                ✦ Hướng dẫn chăm sóc tại nhà
              </p>
              <p className="mt-2 text-[10px] leading-5 text-slate-600">
                {treatment.careInstructions.map((item) => (
                  <span key={item}>
                    ✓ {item}
                    <br />
                  </span>
                ))}
              </p>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="text-[9px] font-bold uppercase text-[#0058bc]">
                {treatment.followUp
                  ? "Lịch hẹn tái khám"
                  : "Trạng thái điều trị"}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-900">
                {treatment.followUp
                  ? `${treatment.followUp.dateLabel} · ${treatment.followUp.time}`
                  : `Đã hoàn thành · ${treatment.date}`}
              </p>
              <p className="mt-1 text-[9px] text-slate-500">
                {treatment.followUp?.doctor ?? treatment.doctor}
              </p>
              {treatment.followUp && (
                <div className="mt-2 rounded-md border border-blue-100 bg-white/80 px-2.5 py-2">
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                    Nội dung buổi tái khám
                  </p>
                  <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-700">
                    {treatment.followUp.description}
                  </p>
                </div>
              )}
              {treatment.followUp ? (
                <Link
                  href="/appointment"
                  className="mt-2 block rounded-md bg-[#0058bc] py-1.5 text-center text-[9px] font-bold text-white"
                >
                  Xác nhận lịch
                </Link>
              ) : (
                <span className="mt-2 block rounded-md py-1.5 text-center text-[9px] font-bold text-[#0058bc]">
                  Hoàn thành ✓
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
