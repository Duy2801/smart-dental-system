"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  DashboardIcon,
  type DashboardIconName,
} from "../../common/DashboardIcon";
import { getHomeDoctors, type HomeDoctorCard } from "../api";

export function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px 0px", threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      {visible ? (
        children
      ) : (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200/60" />
      )}
    </div>
  );
}

const slides = [
  {
    badge: "Hệ thống Chẩn đoán AI v2.0",
    title: "Nha khoa kỹ thuật số chuyên sâu AI",
    text: "Phân tích dữ liệu lâm sàng siêu tốc, phát hiện sớm các vấn đề răng miệng với độ chính xác vượt trội.",
    icon: "sparkles" as DashboardIconName,
  },
  {
    badge: "Công nghệ Implant hiện đại",
    title: "Phục hồi nụ cười bền vững, tự nhiên",
    text: "Lập kế hoạch cấy ghép kỹ thuật số, ít xâm lấn và rút ngắn thời gian hồi phục.",
    icon: "implant" as DashboardIconName,
  },
  {
    badge: "Chỉnh nha cá nhân hóa",
    title: "Kiến tạo nụ cười phù hợp riêng với bạn",
    text: "Mô phỏng kết quả trước điều trị và theo dõi tiến trình thông minh trên từng giai đoạn.",
    icon: "braces" as DashboardIconName,
  },
];

function ScanVisual({ icon }: { icon: DashboardIconName }) {
  return (
    <div className="relative grid min-h-[320px] place-items-center overflow-hidden bg-[#031b32]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(76,211,239,.3),transparent_44%)]" />
      <div className="absolute h-72 w-72 rounded-full border border-cyan-300/20" />
      <div className="absolute h-52 w-52 rounded-full border border-cyan-300/20" />
      <DashboardIcon
        name={icon}
        className="relative h-40 w-40 text-cyan-100/55"
      />
      <div className="absolute inset-x-16 top-1/2 h-px animate-pulse bg-cyan-300/70 shadow-[0_0_18px_4px_rgba(103,232,249,.35)]" />
      <span className="absolute right-6 top-6 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1.5 text-[10px] font-bold tracking-widest text-cyan-100">
        AI DENTAL SCAN
      </span>
    </div>
  );
}

export function HomeHeroSlideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % slides.length),
      5500,
    );
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[active];

  return (
    <section className="relative grid min-h-[500px] overflow-hidden rounded-2xl bg-gradient-to-br from-[#0058bc] to-[#0070eb] text-white shadow-xl shadow-blue-900/15 lg:grid-cols-[1.05fr_.95fr]">
      <div
        key={active}
        className="z-10 flex animate-[hero-in_.55s_ease-out] flex-col justify-center px-7 py-12 sm:px-10 lg:px-12"
      >
        <span className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
          <DashboardIcon name={slide.icon} className="h-4 w-4" />
          {slide.badge}
        </span>
        <h1 className="max-w-xl text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-[56px]">
          {slide.title}
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-white/80">
          {slide.text}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/appointment?intent=booking"
            className="rounded-xl bg-white px-6 py-4 text-sm font-bold text-[#0058bc] shadow-lg transition hover:-translate-y-1"
          >
            Đặt lịch hẹn ngay
          </Link>
          <Link
            href="/service"
            className="rounded-xl border border-white/30 bg-white/10 px-6 py-4 text-sm font-bold hover:bg-white/15"
          >
            Khám phá dịch vụ
          </Link>
        </div>
      </div>
      <ScanVisual icon={slide.icon} />
      <div className="absolute bottom-5 left-7 z-20 flex gap-2 sm:left-10 lg:left-12">
        {slides.map((item, index) => (
          <button
            key={item.title}
            onClick={() => setActive(index)}
            aria-label={`Xem slide ${index + 1}`}
            className={`h-2 rounded-full transition-all ${
              active === index ? "w-8 bg-white" : "w-2 bg-white/45"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function DoctorSkeleton() {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-56 animate-pulse bg-slate-100" />
      <div className="p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
        <div className="mt-5 h-9 animate-pulse rounded bg-slate-100" />
      </div>
    </article>
  );
}

function DoctorImage({ doctor }: { doctor: HomeDoctorCard }) {
  if (!doctor.avatarUrl) {
    const initials = doctor.name
      .split(" ")
      .filter(Boolean)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    return (
      <div className="relative grid h-56 place-items-center bg-gradient-to-br from-[#0058bc] to-[#00b8d9]">
        <DashboardIcon
          name="user"
          className="absolute bottom-0 h-36 w-36 text-white/15"
        />
        <span className="relative grid h-16 w-16 place-items-center rounded-full border border-white/30 bg-white/15 text-xl font-extrabold text-white backdrop-blur">
          {initials || "BS"}
        </span>
      </div>
    );
  }

  return (
    <div className="h-56 overflow-hidden bg-slate-100">
      <img
        src={doctor.avatarUrl}
        alt={doctor.name}
        className="h-full w-full object-cover object-top"
      />
    </div>
  );
}

export function DoctorDirectory() {
  const { data: doctors = [], isLoading: loading } = useQuery({
    queryKey: ["patient", "home", "doctors"],
    queryFn: getHomeDoctors,
  });

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[#0058bc]">
            Đội ngũ chuyên môn
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-[28px]">
            Bác sĩ đồng hành cùng nụ cười của bạn
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Chọn bác sĩ phù hợp để đặt lịch khám và tư vấn chuyên sâu.
          </p>
        </div>
        <Link
          href="/appointment"
          className="hidden text-xs font-bold text-[#0058bc] sm:block"
        >
          Xem lịch hẹn
        </Link>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <DoctorSkeleton key={index} />
          ))}
        </div>
      ) : doctors.length ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.map((doctor) => (
            <article
              key={doctor.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
            >
              <DoctorImage doctor={doctor} />
              <div className="p-5">
                <h3 className="font-bold text-slate-900">{doctor.name}</h3>
                <p className="mt-1 text-xs text-[#0058bc]">
                  {doctor.specialization}
                </p>
                <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                  <p>Mã bác sĩ: {doctor.doctorCode}</p>
                  <p>Giấy phép: {doctor.licenseNumber}</p>
                </div>
                <div className="mt-4 grid gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={`/doctor/${doctor.id}`}
                    className="rounded-lg border border-[#0058bc] px-3 py-2.5 text-center text-xs font-bold text-[#0058bc] transition hover:bg-blue-50"
                  >
                    Xem chi tiết
                  </Link>
                  <Link
                    href={`/appointment?doctorId=${doctor.id}`}
                    className="rounded-lg bg-[#0058bc] px-3 py-2.5 text-center text-xs font-bold text-white transition hover:bg-[#004ca3]"
                  >
                    Đặt lịch
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Chưa có bác sĩ đang hoạt động để hiển thị.
        </div>
      )}
    </section>
  );
}
