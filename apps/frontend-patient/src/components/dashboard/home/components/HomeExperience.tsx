"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DashboardIcon } from "../../common/DashboardIcon";
import {
  getHomeDoctors,
  getHomeServices,
  getDoctorBullets,
  type HomeDoctorCard,
  type HomeServiceCard,
} from "../api";

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

function HeroSkeleton() {
  return (
    <section className="overflow-hidden rounded-2xl bg-[#0066d9] shadow-xl shadow-blue-900/15">
      <div className="grid min-h-125 lg:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-5 p-8 sm:p-10 lg:p-12">
          <div className="h-8 w-56 animate-pulse rounded-full bg-white/15" />
          <div className="h-24 w-4/5 animate-pulse rounded-2xl bg-white/15" />
          <div className="h-20 w-3/4 animate-pulse rounded-2xl bg-white/15" />
          <div className="flex gap-3">
            <div className="h-14 w-44 animate-pulse rounded-xl bg-white/20" />
            <div className="h-14 w-44 animate-pulse rounded-xl bg-white/10" />
          </div>
        </div>
        <div className="relative hidden bg-[#031b32] lg:block">
          <div className="absolute inset-16 animate-pulse rounded-[28px] bg-white/10" />
        </div>
      </div>
    </section>
  );
}

function ServiceVisual({ service }: { service: HomeServiceCard }) {
  return (
    <div className="relative h-full w-full min-h-[360px] lg:min-h-full grid place-items-center overflow-hidden bg-[#003882]">
      {service.imageUrl ? (
        <img
          src={service.imageUrl}
          alt={service.imageAlt}
          className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-700 ease-out"
        />
      ) : null}
      {/* Seamless blend gradient from left hero background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#005bc4] via-[#005bc4]/50 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20 z-10" />
      
      <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative grid place-items-center">
          <div className="absolute h-64 w-64 rounded-full border border-cyan-300/20" />
          <div className="absolute h-48 w-48 rounded-full border border-cyan-300/25" />
          <DashboardIcon
            name="tooth"
            className="h-28 w-28 text-cyan-100/60 drop-shadow-[0_0_24px_rgba(125,211,252,.45)]"
          />
        </div>
      </div>
      <span className="absolute right-6 top-6 z-20 rounded-full border border-cyan-200/30 bg-black/25 px-3 py-1.5 text-[10px] font-bold tracking-widest text-cyan-100 backdrop-blur-md">
        SERVICE DATA
      </span>
    </div>
  );
}

export function HomeHeroSlideshow() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["patient", "home", "services"],
    queryFn: getHomeServices,
  });
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (services.length <= 1) return;

    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % services.length),
      5600,
    );

    return () => window.clearInterval(timer);
  }, [services.length]);

  const activeIndex = services.length ? active % services.length : 0;
  const slide = services[activeIndex];
  const selectors = useMemo(() => services.slice(0, 4), [services]);

  if (isLoading) return <HeroSkeleton />;

  if (!slide) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
        Chưa có dịch vụ nổi bật để hiển thị.
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#004bb1] via-[#005bc4] to-[#007ded] text-white shadow-2xl shadow-blue-900/15">
      <div
        key={slide.id}
        className="grid min-h-[500px] sm:min-h-[540px] animate-[hero-in_.55s_ease-out] lg:grid-cols-[1.1fr_.9fr]"
      >
        <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-12 sm:py-12 lg:px-16">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
              <DashboardIcon name="sparkles" className="h-4 w-4 text-amber-300" />
              Dịch vụ nổi bật
            </span>
            <span className="inline-flex rounded-full border border-white/20 bg-white/12 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md">
              Từ {slide.price} đ
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md">
              <DashboardIcon name="clock" className="h-3.5 w-3.5" />
              {slide.durationMinutes} phút
            </span>
          </div>

          <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[58px]">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/85">
            {slide.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/appointment?service=${slide.id}&intent=booking`}
              className="inline-flex h-14 items-center gap-2.5 rounded-2xl bg-white px-7 text-sm font-bold text-[#0058bc] shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Đặt lịch hẹn ngay
              <DashboardIcon name="arrow" className="h-4 w-4" />
            </Link>
            <Link
              href={slide.href}
              className="inline-flex h-14 items-center rounded-2xl border border-white/35 bg-white/12 px-7 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
            >
              Xem chi tiết dịch vụ
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-3">
            {selectors.map((service, index) => (
              <button
                key={service.id}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Chọn ${service.title}`}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  activeIndex === index ? "w-12 bg-white" : "w-3 bg-white/40 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative h-full w-full min-h-[360px] lg:min-h-full">
          <ServiceVisual service={slide} />
        </div>
      </div>

      {selectors.length > 1 ? (
        <div className="absolute bottom-6 right-6 z-30 hidden max-w-lg gap-2.5 lg:grid lg:grid-cols-2">
          {selectors.map((service, index) => (
            <button
              key={service.id}
              type="button"
              onClick={() => setActive(index)}
              className={`min-w-0 rounded-2xl border p-3 text-left text-xs backdrop-blur-md transition ${
                activeIndex === index
                  ? "border-white/60 bg-white/25 text-white shadow-lg ring-1 ring-white/40"
                  : "border-white/20 bg-black/30 text-white/80 hover:bg-black/40 hover:text-white"
              }`}
            >
              <span className="block truncate font-bold text-white">{service.title}</span>
              <span className="mt-1 block truncate text-[11px] text-white/75">
                Từ {service.price} đ
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function DoctorSkeleton() {
  return (
    <article className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,.06)]">
      <div className="grid min-h-105 animate-pulse lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-4 p-7 sm:p-9 lg:p-10">
          <div className="h-3 w-28 rounded-full bg-slate-100" />
          <div className="h-10 w-2/3 rounded-2xl bg-slate-100" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-slate-100" />
            <div className="h-4 w-11/12 rounded bg-slate-100" />
            <div className="h-4 w-9/12 rounded bg-slate-100" />
          </div>
          <div className="mt-8 h-11 w-36 rounded-full bg-slate-100" />
        </div>
        <div className="relative hidden bg-slate-50 lg:block">
          <div className="absolute inset-8 rounded-4xl bg-slate-100" />
        </div>
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
      <div className="relative grid h-56 place-items-center bg-linear-to-br from-[#0058bc] to-[#00b8d9]">
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
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={doctor.avatarUrl}
        alt={doctor.name}
        className="h-full w-full object-contain object-bottom"
      />
    </div>
  );
}

function DoctorBadge({ doctor }: { doctor: HomeDoctorCard }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[#0058bc]/10 bg-[#eef5ff] px-3 py-1.5 text-[11px] font-semibold text-[#0058bc]">
      <span className="h-2 w-2 rounded-full bg-[#0058bc]" />
      Bác sĩ
    </div>
  );
}

function DoctorCardContent({
  doctor,
  mode = "active",
}: {
  doctor: HomeDoctorCard;
  mode?: "active" | "preview";
}) {
  const bullets = (
    doctor.bullets && doctor.bullets.length > 0
      ? doctor.bullets
      : getDoctorBullets(doctor)
  ).slice(0, 5);

  const isPreview = mode === "preview";

  return (
    <article
      className={`relative overflow-hidden transition-all duration-500 rounded-[28px] bg-white border h-[480px] sm:h-[500px] lg:h-[520px] flex flex-col justify-between ${
        isPreview
          ? "border-slate-200/60 opacity-40 scale-[0.93] shadow-sm select-none pointer-events-none"
          : "border-slate-100/80 shadow-[0_20px_50px_rgba(15,23,42,0.07)] opacity-100 scale-100 z-10"
      }`}
    >
      <div className="relative h-full p-7 sm:p-9 lg:p-10 grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-stretch">
        {/* Left text & content container */}
        <div className="z-10 flex flex-col justify-between h-full min-w-0">
          <div>
            <p className="text-[13px] sm:text-[14px] font-semibold text-[#3b4c7c] tracking-wide mb-1">
              Bác sĩ
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-[34px] xl:text-[36px] font-bold text-[#1f2b56] tracking-tight leading-tight mb-4 line-clamp-1">
              {doctor.name}
            </h3>

            <ul className="space-y-2 lg:space-y-2.5 text-[13px] sm:text-[13.5px] lg:text-[14px] text-slate-700 leading-relaxed font-normal overflow-hidden">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-800" />
                  <span className="line-clamp-2">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3">
            <Link
              href={`/doctor/${doctor.id}`}
              className="inline-flex items-center justify-center rounded-full bg-[#ecf3fe] px-7 py-2.5 text-xs sm:text-sm font-semibold text-[#2563eb] transition duration-200 hover:bg-[#deebff] hover:text-[#1d4ed8]"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>

        {/* Right graphic motif & doctor image cutout */}
        <div className="relative h-full flex items-end justify-center lg:justify-end overflow-hidden">
          {/* Circular soft blue background shape */}
          <div className="absolute bottom-2 right-4 sm:right-6 lg:right-8 w-48 h-48 sm:w-56 sm:h-56 lg:w-68 lg:h-68 rounded-full bg-[#d0e2fe] z-0 pointer-events-none" />

          {/* Doctor cutout portrait */}
          <div className="relative z-10 h-[260px] sm:h-[320px] lg:h-[370px] w-auto max-w-full flex items-end">
            <img
              src={doctor.avatarUrl || "/doctor/pham_thi_ha_xuyen.png"}
              alt={doctor.name}
              className="h-full w-auto object-contain object-bottom drop-shadow-md"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export function DoctorDirectory() {
  const { data: doctors = [], isLoading: loading } = useQuery({
    queryKey: ["patient", "home", "doctors"],
    queryFn: getHomeDoctors,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const activeDoctor = doctors[activeIndex] ?? doctors[0];
  const previousDoctor = doctors.length
    ? doctors[(activeIndex - 1 + doctors.length) % doctors.length]
    : undefined;
  const nextDoctor = doctors.length
    ? doctors[(activeIndex + 1) % doctors.length]
    : undefined;

  function step(direction: -1 | 1) {
    if (!doctors.length) return;
    setActiveIndex((value) => (value + direction + doctors.length) % doctors.length);
  }

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#f4f7fc] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-12">
        {/* Top Header Section */}
        <div className="relative mx-auto max-w-4xl text-center mb-10 lg:mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#0058bc]">
            Đội ngũ bác sĩ
          </p>
          <h2 className="mx-auto mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#173761] sm:text-4xl lg:text-5xl">
            Gặp gỡ đội ngũ bác sĩ răng hàm mặt giàu kinh nghiệm
          </h2>
          <p className="mx-auto mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Đội ngũ bác sĩ tận tâm, chính trực và phối hợp chặt chẽ để mang đến
            trải nghiệm điều trị an toàn, chính xác và dễ hiểu cho từng khách
            hàng.
          </p>
        </div>

        {loading ? (
          <div className="mx-auto max-w-4xl">
            <DoctorSkeleton />
          </div>
        ) : doctors.length ? (
          <div className="relative flex flex-col items-center">
            <div className="relative w-full flex items-center justify-center min-h-[500px]">
              {/* Navigation Arrows */}
              {doctors.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Bác sĩ trước"
                    className="absolute left-2 sm:left-6 lg:left-10 top-1/2 -translate-y-1/2 z-30 grid h-11 w-11 sm:h-13 sm:w-13 place-items-center rounded-full bg-white text-slate-800 shadow-[0_8px_25px_rgba(0,0,0,0.12)] border border-slate-100 transition-all duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span className="text-2xl font-light leading-none">‹</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Bác sĩ tiếp theo"
                    className="absolute right-2 sm:right-6 lg:right-10 top-1/2 -translate-y-1/2 z-30 grid h-11 w-11 sm:h-13 sm:w-13 place-items-center rounded-full bg-white text-slate-800 shadow-[0_8px_25px_rgba(0,0,0,0.12)] border border-slate-100 transition-all duration-200 hover:bg-slate-50 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span className="text-2xl font-light leading-none">›</span>
                  </button>
                </>
              ) : null}

              {/* Carousel Container */}
              <div className="w-full flex items-center justify-center gap-6 overflow-visible">
                {/* Left Preview Card */}
                {previousDoctor ? (
                  <div
                    onClick={() => step(-1)}
                    className="hidden xl:block w-[500px] shrink-0 opacity-40 scale-90 cursor-pointer transition-all duration-500 hover:opacity-60"
                  >
                    <DoctorCardContent doctor={previousDoctor} mode="preview" />
                  </div>
                ) : null}

                {/* Main Active Card */}
                <div className="w-full max-w-[880px] shrink-0 z-10 transition-all duration-500">
                  <DoctorCardContent doctor={activeDoctor} mode="active" />
                </div>

                {/* Right Preview Card */}
                {nextDoctor ? (
                  <div
                    onClick={() => step(1)}
                    className="hidden xl:block w-[500px] shrink-0 opacity-40 scale-90 cursor-pointer transition-all duration-500 hover:opacity-60"
                  >
                    <DoctorCardContent doctor={nextDoctor} mode="preview" />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Indicator Dots */}
            <div className="mt-8 flex items-center justify-center gap-2">
              {doctors.map((doctor, index) => (
                <button
                  key={doctor.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Chọn ${doctor.name}`}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === activeIndex ? "w-9 bg-[#2563eb]" : "w-2.5 bg-[#c2d7fc] hover:bg-[#8eb6fa]"
                  }`}
                />
              ))}
            </div>

            {/* Xem tất cả bác sĩ Button */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/doctors"
                className="inline-flex h-12 items-center rounded-full border border-[#0058bc] bg-white px-8 text-sm font-semibold text-[#0058bc] shadow-sm transition hover:bg-[#f5f9ff]"
              >
                Xem tất cả bác sĩ
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            Chưa có bác sĩ đang hoạt động để hiển thị.
          </div>
        )}
      </div>
    </section>
  );
}


