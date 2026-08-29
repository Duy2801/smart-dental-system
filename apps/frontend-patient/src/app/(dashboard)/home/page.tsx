import type { Metadata } from "next";
import Link from "next/link";
import {
  DashboardIcon,
  type DashboardIconName,
} from "@/features/dashboard/common/DashboardIcon";
import { CountUp } from "@/features/dashboard/common/CountUp";
import { ROUTES } from "@/features/dashboard/common/routes";
import {
  ClinicalCasesSection,
  ClinicLocationSection,
  DoctorDirectory,
  HomeKnowledgeSection,
  HomeHeroSlideshow,
  HomeServicesSection,
  Reveal,
} from "@/features/dashboard/home";

export const metadata: Metadata = {
  title: "Nha khoa AI | Clinical Precision & Trust",
  description: "Nha khoa kỹ thuật số chuyên sâu ứng dụng trí tuệ nhân tạo.",
};

export default function PatientHomePage() {
  return (
    <div className="w-full space-y-4 sm:space-y-10 pb-6 pt-0 sm:pb-8">
      {/* Full width Hero Banner Section */}
      <div className="w-full">
        <HomeHeroSlideshow />
      </div>

      <main className="mx-auto w-full max-w-[1360px] space-y-5 sm:space-y-10 px-4 sm:px-6 lg:px-8">
        <section className="grid gap-4 sm:gap-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 px-4 py-4 sm:px-10 sm:py-8 shadow-md sm:shadow-xl shadow-slate-900/10 backdrop-blur sm:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_1px_1.2fr] lg:items-center lg:px-14 xl:px-16">
          {[
            ["shield", "ISO 9001:2015", "Chứng nhận quốc tế"],
            ["heart", "Bộ Y Tế", "Giấy phép 0123/BYT"],
            ["sparkles", "Top 10 Nha Khoa", "Giải thưởng 2026"],
          ].map(([icon, title, text]) => (
            <div key={title} className="flex items-center gap-5">
              <DashboardIcon
                name={icon as DashboardIconName}
                className="h-11 w-11 text-[#0058bc]"
              />
              <div>
                <p className="text-base font-extrabold text-slate-800">{title}</p>
                <p className="mt-2 text-xs font-bold uppercase text-slate-400">
                  {text}
                </p>
              </div>
            </div>
          ))}
          <div className="hidden h-16 bg-slate-200 lg:block" />
          <div className="col-span-2 flex justify-between gap-4 sm:col-span-1">
            <div className="text-center">
              <strong className="text-3xl text-[#0058bc]">
                <CountUp value={10} suffix="K+" />
              </strong>
              <p className="text-[10px] text-slate-500">Khách hàng</p>
            </div>
            <div className="text-center">
              <strong className="text-3xl text-[#0058bc]">
                <CountUp value={15} suffix="+" />
              </strong>
              <p className="text-[10px] text-slate-500">Năm kinh nghiệm</p>
            </div>
            <div className="text-center">
              <strong className="text-3xl text-[#0058bc]">
                <CountUp value={20} suffix="+" />
              </strong>
              <p className="text-[10px] text-slate-500">Chuyên gia</p>
            </div>
          </div>
        </section>

        <Reveal>
          <HomeServicesSection />
        </Reveal>

        <Reveal>
          <DoctorDirectory />
        </Reveal>

        <Reveal>
          <ClinicalCasesSection />
        </Reveal>

        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#004bb1] via-[#0058bc] to-[#007ded] p-4.5 sm:p-10 text-white shadow-xl shadow-blue-900/15 transition duration-300 hover:shadow-2xl">
          <div className="absolute -right-12 -top-24 h-80 w-80 skew-x-[-20deg] bg-white/10 blur-xl pointer-events-none" />
          <div className="relative grid items-center gap-5 sm:gap-8 md:grid-cols-[1.5fr_.7fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-extrabold backdrop-blur-md">
                <DashboardIcon name="sparkles" className="h-3.5 w-3.5 text-amber-300" />
                Chương trình Ưu Đãi Đặc Biệt
              </span>
              <h2 className="mt-3 sm:mt-5 max-w-2xl text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                Cùng sẻ chia nụ cười, nhận ưu đãi không giới hạn
              </h2>
              <p className="mt-2 sm:mt-3 max-w-2xl text-xs sm:text-base leading-5 sm:leading-6 text-white/85">
                Khám phá các gói ưu đãi nha khoa cao cấp, tích điểm đổi quà và nhận Voucher giảm giá dịch vụ hấp dẫn dành riêng cho bạn và gia đình.
              </p>
              <div className="mt-4 sm:mt-6 flex flex-wrap gap-2.5 sm:gap-3">
                <Link
                  href={ROUTES.promotions}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs font-extrabold text-[#0058bc] shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-50 active:translate-y-0"
                >
                  <DashboardIcon name="sparkles" className="h-4 w-4 text-[#0058bc]" />
                  Khám phá ưu đãi ngay
                </Link>
                <Link
                  href={ROUTES.promotions}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 sm:px-6 sm:py-3.5 text-xs font-extrabold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  Xem tất cả ưu đãi
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
              <Link
                href={ROUTES.promotions}
                className="group rounded-2xl border border-white/25 bg-white/15 p-3 sm:p-5 text-center backdrop-blur-md transition hover:bg-white/25 hover:border-white/40"
              >
                <strong className="text-2xl sm:text-3xl font-extrabold text-white">500K</strong>
                <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/80 group-hover:text-white">Voucher quà tặng</p>
              </Link>
              <Link
                href={ROUTES.promotions}
                className="group rounded-2xl border border-white/25 bg-white/15 p-3 sm:p-5 text-center backdrop-blur-md transition hover:bg-white/25 hover:border-white/40"
              >
                <strong className="text-2xl sm:text-3xl font-extrabold text-white">10%</strong>
                <p className="mt-0.5 text-[11px] sm:text-xs font-bold text-white/80 group-hover:text-white">Giảm phí dịch vụ</p>
              </Link>
              <Link
                href={ROUTES.promotions}
                className="col-span-2 group rounded-2xl border border-white/25 bg-white/15 p-3 text-center text-xs font-extrabold text-white backdrop-blur-md transition hover:bg-white/25 hover:border-white/40 flex items-center justify-center gap-2"
              >
                <DashboardIcon name="sparkles" className="h-3.5 w-3.5 text-amber-300" />
                Đặc quyền thành viên & Thẻ VIP Gold
              </Link>
            </div>
          </div>
        </section>

        <Reveal>
          <HomeKnowledgeSection />
        </Reveal>

        <Reveal>
          <ClinicLocationSection />
        </Reveal>
      </main>
    </div>
  );
}
