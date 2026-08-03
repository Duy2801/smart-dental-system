import type { Metadata } from "next";
import Link from "next/link";
import {
  DashboardIcon,
  type DashboardIconName,
} from "@/features/dashboard/common/DashboardIcon";
import { CountUp } from "@/features/dashboard/common/CountUp";
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
    <main className="mx-auto w-full max-w-[1360px] space-y-10 px-4 pb-6 pt-0 sm:px-6 sm:pb-8 lg:px-8">
      <div className="relative left-1/2 w-screen -translate-x-1/2 space-y-8 px-0">
        <HomeHeroSlideshow />

        <section className="mx-4 grid gap-6 rounded-3xl border border-slate-200/80 bg-white/90 px-7 py-8 shadow-xl shadow-slate-900/10 backdrop-blur sm:mx-6 sm:grid-cols-2 sm:px-10 lg:mx-12 lg:grid-cols-[repeat(3,1fr)_1px_1.2fr] lg:items-center lg:px-14 xl:px-16">
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
      </div>

      <Reveal>
        <HomeServicesSection />
      </Reveal>

      <Reveal>
        <DoctorDirectory />
      </Reveal>

      <Reveal>
        <ClinicalCasesSection />
      </Reveal>

      <section className="relative overflow-hidden rounded-3xl bg-[#0058bc] p-7 text-white sm:p-10">
        <div className="absolute -right-12 -top-24 h-80 w-80 skew-x-[-20deg] bg-white/5" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1.5fr_.7fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold">
              <DashboardIcon name="sparkles" className="h-4 w-4" />
              Chương trình Dental Rewards
            </span>
            <h2 className="mt-5 max-w-2xl text-2xl font-bold sm:text-3xl">
              Cùng sẻ chia nụ cười, nhận ưu đãi không giới hạn
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              Tích điểm đổi quà cho mỗi lần điều trị và nhận Voucher 1.000.000đ
              khi giới thiệu thành công bạn bè hoặc người thân.
            </p>
            <div className="mt-6 flex gap-3">
              <Link
                href="/profile"
                className="rounded-xl bg-white px-5 py-3 text-xs font-bold text-[#0058bc]"
              >
                Tham gia ngay
              </Link>
              <Link
                href="/service"
                className="rounded-xl border border-white/35 px-5 py-3 text-xs font-bold"
              >
                Xem bảng thưởng
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-center">
              <strong className="text-3xl">500K</strong>
              <p className="mt-1 text-[10px] text-white/70">Điểm tặng mới</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 text-center">
              <strong className="text-3xl">10%</strong>
              <p className="mt-1 text-[10px] text-white/70">Giảm phí dịch vụ</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/20 bg-white/10 p-4 text-center text-xs font-bold">
              Thẻ thành viên hạng Gold
            </div>
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
  );
}
