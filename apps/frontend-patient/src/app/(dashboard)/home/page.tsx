import type { Metadata } from "next";
import Link from "next/link";
import {
  DashboardIcon,
  type DashboardIconName,
} from "@/components/dashboard/common/DashboardIcon";
import { CountUp } from "@/components/dashboard/common/CountUp";
import {
  ClinicalCasesSection,
  DoctorDirectory,
  HomeHeroSlideshow,
  HomeServicesSection,
  Reveal,
} from "@/components/dashboard/home";

export const metadata: Metadata = {
  title: "Nha khoa AI | Clinical Precision & Trust",
  description: "Nha khoa kỹ thuật số chuyên sâu ứng dụng trí tuệ nhân tạo.",
};

export default function PatientHomePage() {
  return (
    <main className="mx-auto w-full max-w-[1360px] space-y-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="relative left-1/2 w-screen -translate-x-1/2 space-y-6 px-4 sm:px-6 lg:px-12 max-w-[1600px]">
        <HomeHeroSlideshow />

        <section className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white/90 px-6 py-6 shadow-md backdrop-blur sm:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_1px_1.2fr] lg:items-center lg:px-10">
          {[
            ["shield", "ISO 9001:2015", "Chứng nhận quốc tế"],
            ["heart", "Bộ Y Tế", "Giấy phép 0123/BYT"],
            ["sparkles", "Top 10 Nha Khoa", "Giải thưởng 2026"],
          ].map(([icon, title, text]) => (
            <div key={title} className="flex items-center gap-3">
              <DashboardIcon
                name={icon as DashboardIconName}
                className="h-8 w-8 text-[#0058bc]"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">{title}</p>
                <p className="mt-1 text-[10px] uppercase text-slate-400">
                  {text}
                </p>
              </div>
            </div>
          ))}
          <div className="hidden h-10 bg-slate-200 lg:block" />
          <div className="col-span-2 flex justify-between gap-4 sm:col-span-1">
            <div className="text-center">
              <strong className="text-xl text-[#0058bc]">
                <CountUp value={10} suffix="K+" />
              </strong>
              <p className="text-[10px] text-slate-500">Khách hàng</p>
            </div>
            <div className="text-center">
              <strong className="text-xl text-[#0058bc]">
                <CountUp value={15} suffix="+" />
              </strong>
              <p className="text-[10px] text-slate-500">Năm kinh nghiệm</p>
            </div>
            <div className="text-center">
              <strong className="text-xl text-[#0058bc]">
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

      <div id="blog" className="grid gap-8 lg:grid-cols-12 lg:items-start">
        <section className="space-y-5 lg:col-span-8">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              Kiến thức Nha khoa
            </h2>
            <Link
              href="/records"
              className="text-xs font-bold text-[#0058bc] hover:underline"
            >
              Tất cả bài viết &rarr;
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                tag: "Chỉnh nha",
                title: "7 điều cần lưu ý khi bắt đầu niềng răng trong suốt",
                icon: "braces",
                desc: "Cập nhật các kiến thức phòng ngừa & điều trị nha khoa chính xác từ đội ngũ bác sĩ chuyên khoa.",
              },
              {
                tag: "Sức khỏe tổng quát",
                title: "Công nghệ AI thay đổi chẩn đoán nha khoa thế nào?",
                icon: "sparkles",
                desc: "Ứng dụng trí tuệ nhân tạo trong việc phát hiện sớm tổn thương và lập phác đồ điều trị tối ưu.",
              },
            ].map((article) => (
              <article
                key={article.title}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-[#0058bc]">
                    <DashboardIcon
                      name={article.icon as DashboardIconName}
                      className="h-3.5 w-3.5"
                    />
                    {article.tag}
                  </span>
                  <h3 className="mt-3.5 text-sm font-bold text-slate-900">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {article.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-bold text-[#0058bc]">
                  <span>Đọc bài viết</span>
                  <span>&rarr;</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="lg:col-span-4 lg:pt-9">
          <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <DashboardIcon name="clock" className="h-4 w-4 text-[#0058bc]" />
                Giờ làm việc phòng khám
              </h3>
              <div className="mt-4 space-y-3 text-xs text-slate-600">
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="font-medium">Thứ 2 - Thứ 6:</span>
                  <span className="font-bold text-slate-800">08:00 - 20:00</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2.5">
                  <span className="font-medium">Thứ 7 - Chủ nhật:</span>
                  <span className="font-bold text-slate-800">08:00 - 17:30</span>
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-blue-50/70 p-3 text-[11px] font-semibold text-[#0058bc]">
              * Hỗ trợ cấp cứu & tư vấn AI 24/7 trực tuyến.
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
