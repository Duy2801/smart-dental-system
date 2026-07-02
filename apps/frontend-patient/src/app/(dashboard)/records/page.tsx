import type { Metadata } from "next";
import Link from "next/link";
import {
  DashboardIcon,
  type DashboardIconName,
} from "@/components/dashboard/common/DashboardIcon";
import { PatientProfileEditor } from "@/components/dashboard/records";

export const metadata: Metadata = {
  title: "Hồ sơ bệnh án điện tử | Smart Dental",
  description: "Lịch sử điều trị và hồ sơ sức khỏe nha khoa của bệnh nhân.",
};

const treatments = [
  {
    title: "Cấy ghép Implant Straumann",
    date: "12 Tháng 10, 2025",
    tooth: "Răng 14",
    doctor: "BS. Lê Hoàng Nam",
    specialty: "Chuyên gia Implant & Phẫu thuật hàm mặt",
    description:
      "Cấy ghép trụ Implant Straumann Roxolid SLActive cao cấp. Thực hiện kỹ thuật nâng xoang kín và ghép xương bột nhân tạo. Đã hoàn thiện phục hình răng sứ sau 3 tháng tích hợp xương.",
    active: true,
    treatmentPlan: [
      {
        date: "05/07/2025",
        title: "Khám và chụp CT",
        description: "Khảo sát xương và lập kế hoạch cấy Implant răng 14.",
        status: "completed",
      },
      {
        date: "12/07/2025",
        title: "Cấy trụ Implant",
        description: "Ghép xương và đặt trụ Straumann tại vị trí răng 14.",
        status: "completed",
      },
      {
        date: "12/10/2025",
        title: "Gắn răng sứ",
        description: "Kiểm tra tích hợp xương và hoàn thiện phục hình răng sứ.",
        status: "completed",
      },
      {
        date: "15/11/2025",
        title: "Tái khám Implant",
        description: "Kiểm tra Implant răng 14 và vệ sinh vùng điều trị.",
        status: "current",
      },
    ],
    followUp: { stepIndex: 3, dateLabel: "15 Tháng 11, 2025", time: "09:30" },
  },
  {
    title: "Điều trị tủy & Trám răng thẩm mỹ",
    date: "05 Tháng 06, 2025",
    tooth: "Răng 16",
    doctor: "BS. Trần Thị Minh",
    specialty: "Chuyên khoa Nội nha",
    description:
      "Điều trị nội nha răng cối lớn hàm trên. Sử dụng vật liệu Composite 3M cao cấp phục hồi hình dáng giải phẫu và chức năng ăn nhai.",
    active: false,
    treatmentPlan: [
      {
        date: "29/05/2025",
        title: "Khám và chụp X-quang",
        description: "Đánh giá mức độ viêm tủy và chân răng 16.",
        status: "completed",
      },
      {
        date: "02/06/2025",
        title: "Điều trị tủy",
        description: "Làm sạch, tạo hình và trám kín hệ thống ống tủy răng 16.",
        status: "completed",
      },
      {
        date: "05/06/2025",
        title: "Trám răng thẩm mỹ",
        description: "Phục hồi thân răng 16 bằng vật liệu Composite 3M.",
        status: "completed",
      },
      {
        date: "12/06/2025",
        title: "Kiểm tra sau điều trị",
        description: "Kiểm tra khớp cắn và mức độ ổn định của răng 16.",
        status: "completed",
      },
    ],
    followUp: null,
  },
] as const;

function InfoChip({
  icon,
  children,
}: {
  icon: DashboardIconName;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
      <DashboardIcon name={icon} className="h-4 w-4 text-[#0058bc]" />
      {children}
    </span>
  );
}

function ClinicalImage({
  type,
  title,
}: {
  type: "xray" | "clinical";
  title: string;
}) {
  return (
    <div
      className={`relative grid aspect-square place-items-center overflow-hidden rounded-xl border border-slate-200 ${type === "xray" ? "bg-[#071d2d]" : "bg-gradient-to-br from-rose-100 via-white to-blue-100"}`}
    >
      <div
        className={`absolute inset-0 ${type === "xray" ? "bg-[radial-gradient(circle_at_50%_50%,rgba(103,232,249,.2),transparent_55%)]" : ""}`}
      />
      {type === "xray" ? (
        <DashboardIcon name="tooth" className="h-20 w-20 text-cyan-100/55" />
      ) : (
        <div className="flex rounded-[50%] border-[7px] border-rose-200 bg-rose-100 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="h-8 w-4 rounded-b-lg bg-white shadow" />
          ))}
        </div>
      )}
      <span className="absolute bottom-2 right-2 rounded bg-black/55 px-2 py-1 text-[9px] font-bold text-white">
        {title}
      </span>
    </div>
  );
}

function TreatmentPlanTimeline({
  steps,
}: {
  steps: ReadonlyArray<{
    date: string;
    title: string;
    description: string;
    status: "completed" | "current" | "upcoming";
  }>;
}) {
  const reachedSteps = steps.filter((step) => step.status !== "upcoming").length;

  return (
    <section className="mt-5 border-t border-slate-100 pt-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#0058bc]">
            Lộ trình của bạn
          </p>
          <h4 className="mt-1 text-sm font-bold text-slate-900">
            Kế hoạch điều trị
          </h4>
        </div>
        <p className="text-[9px] font-semibold text-slate-500">
          {reachedSteps}/{steps.length} bước đã đạt tới
        </p>
      </div>
      <div className="mt-4 grid gap-0 sm:grid-cols-4">
        {steps.map((step, stepIndex) => {
          const reached = step.status !== "upcoming";
          const completed = step.status === "completed";

          return (
            <article key={step.title} className="relative flex gap-3 pb-4 sm:block sm:pb-0">
              {stepIndex !== steps.length - 1 && (
                <span
                  className={`absolute left-3 top-6 h-[calc(100%-1rem)] w-0.5 sm:left-6 sm:top-3 sm:h-0.5 sm:w-[calc(100%-1.5rem)] ${completed ? "bg-emerald-500" : "bg-slate-200"}`}
                />
              )}
              <span
                className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[9px] font-extrabold sm:ml-3 ${reached ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_0_4px_rgba(16,185,129,.12)]" : "border-slate-200 bg-white text-slate-400"}`}
              >
                {completed ? "✓" : stepIndex + 1}
              </span>
              <div className="min-w-0 sm:mt-3 sm:pr-3">
                <p className={`text-[8px] font-bold uppercase ${reached ? "text-emerald-700" : "text-slate-400"}`}>
                  {step.date}
                </p>
                <h5 className="mt-1 text-[10px] font-bold text-slate-800">
                  {step.title}
                </h5>
                <p className="mt-1 text-[9px] leading-4 text-slate-500">
                  {step.description}
                </p>
                <span className={`mt-2 inline-block rounded-full px-2 py-1 text-[7px] font-bold ${completed ? "bg-emerald-100 text-emerald-700" : step.status === "current" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {completed ? "Đã hoàn thành" : step.status === "current" ? "Bước hiện tại" : "Sắp tới"}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function PatientRecordsPage() {
  return (
    <main className="mx-auto w-full max-w-[1360px] space-y-7 px-4 py-7 sm:px-6 lg:px-8">
      <section className="grid gap-5 lg:grid-cols-[]">
        <div className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,.06)] sm:p-8">
          <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-blue-50" />
          <div className="relative flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <div className="relative grid h-32 w-32 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#0058bc] to-cyan-400 text-3xl font-extrabold text-white shadow-xl shadow-blue-100">
              <DashboardIcon
                name="user"
                className="absolute -bottom-3 h-28 w-28 text-white/15"
              />
              <span className="relative">MK</span>
              <span className="absolute bottom-2 right-2 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  Nguyễn Minh Khải
                </h1>
                <span className="mx-auto w-fit rounded-full bg-[#0058bc] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:mx-0">
                  Patient ID: #DAI-88291
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Nam · 48 tuổi · TP. Hồ Chí Minh
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
                <InfoChip icon="clock">Lần khám cuối: 12/10/2025</InfoChip>
                <InfoChip icon="chat">0901 234 567</InfoChip>
              </div>
            </div>
            <PatientProfileEditor />
          </div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_290px]">
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0058bc]">
                Hành trình chăm sóc
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Lịch sử điều trị
              </h2>
            </div>
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
              <span className="hidden sm:inline">Lọc theo</span>
              <select
                aria-label="Lọc theo loại điều trị"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-[#0058bc] outline-none focus:border-blue-400"
              >
                <option>Tất cả điều trị</option>
                <option>Implant</option>
                <option>Chỉnh nha</option>
                <option>Nội nha</option>
                <option>Nha khoa thẩm mỹ</option>
              </select>
            </label>
          </div>
          <div>
            {treatments.map((treatment, index) => (
              <article
                key={treatment.title}
                className="relative border-l-2 border-slate-200 pb-6 pl-6 last:border-transparent"
              >
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
                          <DashboardIcon
                            name="calendar"
                            className="h-3.5 w-3.5"
                          />
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
                            {treatment.doctor
                              .split(" ")
                              .slice(-2)
                              .map((word) => word[0])
                              .join("")}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {treatment.doctor}
                            </p>
                            <p className="mt-0.5 text-[9px] text-slate-500">
                              {treatment.specialty}
                            </p>
                            <Link
                              href={
                                index === 0
                                  ? "/doctor/le-hoang-nam"
                                  : "/doctor/tran-thu-ha"
                              }
                              className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-[#0058bc] hover:underline"
                            >
                              Liên hệ bác sĩ →
                            </Link>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <ClinicalImage type="xray" title="X-Ray" />
                        <ClinicalImage type="clinical" title="Clinical" />
                      </div>
                    </div>
                    <TreatmentPlanTimeline steps={treatment.treatmentPlan} />
                    <>
                      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
                        <div>
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Đơn thuốc & Dặn dò
                          </p>
                          <p className="mt-2 text-[10px] leading-5 text-slate-600">
                            {index === 0
                              ? "• Augmentin 625mg · 2 lần/ngày"
                              : "• Ibuprofen 400mg · Khi đau"}
                            <br />
                            {index === 0
                              ? "• Paracetamol 500mg · Khi đau"
                              : "• Súc miệng Chlorhexidine · 2 lần/ngày"}
                          </p>
                          <button className="mt-1 text-[10px] font-bold text-[#0058bc]">
                            ↓ Tải đơn thuốc PDF
                          </button>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                          <div>
                            <p className="text-[9px] text-slate-500">
                              Chi phí buổi khám
                            </p>
                            <p className="mt-1 text-base font-bold text-slate-900">
                              {index === 0 ? "32.500.000đ" : "2.800.000đ"}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="block rounded bg-cyan-50 px-2 py-1 text-[8px] font-bold text-cyan-700">
                              {index === 0 ? "Thanh toán đủ" : "Thanh toán đủ"}
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
                            {index === 0
                              ? "✓ Tránh đồ uống quá lạnh/nóng trong 24h."
                              : "✓ Không nhai thức ăn cứng bên răng 16 trong 48h."}
                            <br />
                            {index === 0
                              ? "✓ Chải răng nhẹ nhàng quanh răng #14."
                              : "✓ Vệ sinh răng và dùng chỉ nha khoa hằng ngày."}
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
                              : "Đã hoàn thành · 05/06/2025"}
                          </p>
                          <p className="mt-1 text-[9px] text-slate-500">
                            {treatment.doctor}
                          </p>
                          {treatment.followUp && (
                            <div className="mt-2 rounded-md border border-blue-100 bg-white/80 px-2.5 py-2">
                              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                                Nội dung buổi tái khám
                              </p>
                              <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-700">
                                {treatment.treatmentPlan[treatment.followUp.stepIndex].description}
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
                            <span className="mt-2 block rounded-md  py-1.5 text-center text-[9px] font-bold text-[#0058bc]">
                              Hoàn thành ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

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
                <DashboardIcon
                  name="shield"
                  className="h-5 w-5 text-[#0058bc]"
                />
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
          <section className="hidden">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
              <DashboardIcon name="sparkles" className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-sm font-bold">Gợi ý sức khỏe</h2>
            <p className="mt-2 text-xs leading-6 text-blue-100">
              Răng 26 có dấu hiệu sâu men mặt bên. Đề xuất kiểm tra lâm sàng
              trong lần hẹn tới.
            </p>
            <button className="mt-4 text-xs font-bold text-white underline underline-offset-4">
              Xem phân tích chi tiết
            </button>
          </section>
          <section className="hidden">
            <h2 className="text-sm font-bold text-slate-900">
              Tiến độ sức khỏe
            </h2>
            <div className="mt-5 space-y-4">
              {[
                ["Nướu", 92],
                ["Men răng", 84],
                ["Độ sáng", 68],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-slate-600">{label}</span>
                    <strong className="text-[#0058bc]">{value}%</strong>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#0058bc] to-cyan-400"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
