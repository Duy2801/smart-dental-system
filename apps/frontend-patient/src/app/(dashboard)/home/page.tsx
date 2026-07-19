import type { Metadata } from "next";
import Link from "next/link";
import {
  DashboardIcon,
  type DashboardIconName,
} from "@/components/dashboard/common/DashboardIcon";
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
      <HomeHeroSlideshow />

      <section className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white/80 px-6 py-6 shadow-sm backdrop-blur sm:grid-cols-2 lg:grid-cols-[repeat(3,1fr)_1px_1.2fr] lg:items-center lg:px-10">
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
            <strong className="text-xl text-[#0058bc]">10K+</strong>
            <p className="text-[10px] text-slate-500">Khách hàng</p>
          </div>
          <div className="text-center">
            <strong className="text-xl text-[#0058bc]">15+</strong>
            <p className="text-[10px] text-slate-500">Năm kinh nghiệm</p>
          </div>
          <div className="text-center">
            <strong className="text-xl text-[#0058bc]">20+</strong>
            <p className="text-[10px] text-slate-500">Chuyên gia</p>
          </div>
        </div>
      </section>

      <Reveal>
        <HomeServicesSection />
      </Reveal>

      <Reveal>
        <ClinicalCasesSection />
      </Reveal>

      <Reveal>
        <DoctorDirectory />
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

      <div id="blog" className="grid gap-8 lg:grid-cols-12">
        <section className="space-y-8 lg:col-span-8">
          <div>
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                Kiến thức Nha khoa
              </h2>
              <Link
                href="/records"
                className="text-xs font-bold text-[#0058bc]"
              >
                Tất cả bài viết
              </Link>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {[
                {
                  tag: "Chỉnh nha",
                  title: "7 điều cần lưu ý khi bắt đầu niềng răng trong suốt",
                  icon: "braces",
                },
                {
                  tag: "Sức khỏe tổng quát",
                  title: "Công nghệ AI thay đổi chẩn đoán nha khoa thế nào?",
                  icon: "sparkles",
                },
              ].map((post) => (
                <article key={post.title} className="group">
                  <div className="grid h-44 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-blue-50 to-cyan-100">
                    <DashboardIcon
                      name={post.icon as DashboardIconName}
                      className="h-20 w-20 text-[#0058bc]/25 transition group-hover:scale-110"
                    />
                  </div>
                  <span className="mt-4 inline-block rounded bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase text-[#0058bc]">
                    {post.tag}
                  </span>
                  <h3 className="mt-2 text-lg font-bold leading-6 text-slate-900 transition group-hover:text-[#0058bc]">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Các kiến thức khoa học giúp bạn chủ động chăm sóc và bảo vệ
                    nụ cười mỗi ngày...
                  </p>
                </article>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Câu hỏi thường gặp
            </h2>
            <div className="mt-5 space-y-3">
              <details
                open
                className="group rounded-xl border border-slate-200 bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-bold">
                  Khám AI có mất phí không?
                  <span className="text-[#0058bc] group-open:rotate-45">
                    ＋
                  </span>
                </summary>
                <p className="border-t border-slate-100 px-5 py-4 text-xs leading-6 text-slate-500">
                  Hoàn toàn miễn phí. Chúng tôi cung cấp chụp X-quang và phân
                  tích AI cho lần khám đầu tiên.
                </p>
              </details>
              <details className="group rounded-xl border border-slate-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-bold">
                  Chế độ bảo hành Implant tại DentalCare AI?
                  <span className="text-[#0058bc] group-open:rotate-45">
                    ＋
                  </span>
                </summary>
                <p className="border-t border-slate-100 px-5 py-4 text-xs leading-6 text-slate-500">
                  Trụ Implant chính hãng được bảo hành từ 10 năm đến trọn đời
                  tùy dòng sản phẩm.
                </p>
              </details>
            </div>
          </div>
        </section>
        <aside id="locations" className="space-y-5 lg:col-span-4">
          <h2 className="text-2xl font-bold text-slate-900">
            Thông tin phòng khám
          </h2>
          <div className="relative overflow-hidden rounded-2xl border border-[#0058bc] bg-white p-5 shadow-md">
            <h3 className="font-bold text-[#0058bc]">Smart Dental</h3>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              123 Lê Lợi, P. Bến Thành, Quận 1, TP.HCM
            </p>
            <p className="mt-3 text-xs font-semibold text-emerald-600">
              ● Đang mở cửa: 08:00 - 20:00
            </p>
            <Link
              href="/appointment?intent=booking"
              className="mt-4 block rounded-lg bg-[#0058bc] py-2.5 text-center text-xs font-bold text-white"
            >
              Đặt lịch khám
            </Link>
          </div>
          <div className="relative grid h-60 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_35%_30%,#bfdbfe,transparent_22%),linear-gradient(135deg,#e2e8f0,#f8fafc)] text-center">
            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(#64748b_1px,transparent_1px),linear-gradient(90deg,#64748b_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="relative">
              <DashboardIcon
                name="home"
                className="mx-auto h-12 w-12 text-[#0058bc]"
              />
              <p className="mt-2 font-bold">Xem bản đồ</p>
              <p className="mt-1 text-xs text-slate-500">
                Vị trí phòng khám Smart Dental
              </p>
            </div>
          </div>
        </aside>
      </div>

      <section className="flex flex-col items-center rounded-3xl border border-slate-200 bg-slate-100/80 p-8 text-center sm:p-10">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-blue-100 text-[#0058bc]">
          <DashboardIcon name="chat" className="h-10 w-10" />
        </span>
        <h2 className="mt-6 text-2xl font-bold text-slate-900 sm:text-[28px]">
          Trải nghiệm đặt lịch 4.0 với AI Chat
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Không cần gọi điện hay chờ đợi. AI giúp bạn tìm bác sĩ phù hợp, ước
          tính chi phí và xác nhận lịch hẹn ngay qua tin nhắn.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {[
            "Tư vấn 24/7 không nghỉ",
            "Đồng bộ hồ sơ bệnh án AI",
            "Ước tính chi phí chính xác",
          ].map((text) => (
            <span
              key={text}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold shadow-sm"
            >
              <span className="mr-2 text-emerald-500">●</span>
              {text}
            </span>
          ))}
        </div>
        <Link
          href="/appointment?intent=booking"
          className="mt-8 rounded-xl bg-[#0058bc] px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-1"
        >
          Mở Chat & Đặt lịch ngay
        </Link>
      </section>
    </main>
  );
}
