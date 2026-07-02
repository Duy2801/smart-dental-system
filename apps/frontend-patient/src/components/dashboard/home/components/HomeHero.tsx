import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";

function DentalScan() {
  const teeth = Array.from({ length: 11 });

  return (
    <div className="relative h-full min-h-52 overflow-hidden bg-[#061827]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_50%,rgba(70,196,255,0.18),transparent_52%)]" />
      <svg
        aria-label="Mô phỏng ảnh X-quang răng hàm"
        className="absolute inset-0 h-full w-full opacity-80"
        viewBox="0 0 420 240"
        fill="none"
      >
        <path d="M100 62c50-45 170-45 220 0" stroke="#8ad8ed" strokeWidth="5" opacity=".35" />
        <path d="M82 90c42 115 214 115 256 0" stroke="#8ad8ed" strokeWidth="5" opacity=".28" />
        <path d="M91 95c24-40 49-52 75-30 27 24 61 24 88 0 26-22 51-10 75 30" stroke="#b8edfa" strokeWidth="3" opacity=".35" />
        {teeth.map((_, index) => {
          const x = 92 + index * 24;
          const offset = Math.abs(5 - index) * 3;
          return (
            <g key={x} opacity={0.45 + (5 - Math.abs(5 - index)) * 0.045}>
              <path
                d={`M${x} ${88 + offset}c-7 14-4 35 5 42 9-7 12-28 5-42-3-6-7-6-10 0Z`}
                fill="#93d9e9"
              />
              <path
                d={`M${x + 1} ${143 - offset / 2}c-6 13-3 32 4 38 8-6 11-25 5-38-3-5-6-5-9 0Z`}
                fill="#79c9dd"
                transform={`rotate(180 ${x + 5} ${162 - offset / 2})`}
              />
            </g>
          );
        })}
        <circle cx="210" cy="120" r="104" stroke="#5cc3df" opacity=".15" />
      </svg>
      <div className="absolute bottom-4 right-4 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[9px] font-semibold tracking-wider text-cyan-100 backdrop-blur">
        AI DENTAL SCAN
      </div>
    </div>
  );
}

export function HomeHero({ patientName }: { patientName: string }) {
  return (
    <section className="grid overflow-hidden rounded-[24px] bg-[#0768cf] text-white shadow-[0_22px_60px_rgba(8,99,197,0.22)] md:grid-cols-[1.35fr_1fr]">
      <div className="flex min-h-[310px] flex-col justify-center px-6 py-10 sm:px-10 lg:px-12">
        <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold backdrop-blur">
          <DashboardIcon name="sparkles" className="h-3.5 w-3.5" />
          AI Precision Diagnosis
        </span>
        <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-[-0.045em] sm:text-5xl">
          Chẩn đoán bằng AI siêu tốc
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-blue-100">
          Xin chào {patientName}, phân tích hình ảnh nha khoa chính xác trong vài phút và nhận
          phác đồ chăm sóc được cá nhân hóa.
        </p>
        <Link
          href="/appointment"
          className="mt-7 inline-flex h-12 w-fit items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#0863c5] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          Tư vấn cùng chuyên gia
          <DashboardIcon name="arrow" className="h-4 w-4" />
        </Link>
      </div>
      <DentalScan />
    </section>
  );
}
