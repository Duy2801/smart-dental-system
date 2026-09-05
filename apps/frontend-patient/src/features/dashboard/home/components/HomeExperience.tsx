"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DashboardIcon } from "../../common/DashboardIcon";
import { buildRoute, ROUTES } from "../../common/routes";
import { T } from "../../common/typography";
import {
  useHomeBannersQuery,
  useHomeServicesQuery,
  useHomeDoctorsQuery,
  usePrefetchDoctorDetail,
} from "../hooks/useHomeQueries";
import {
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
    <section className="relative w-full overflow-hidden bg-[#0066d9] shadow-xl">
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
  const { data: banners = [], isLoading: loadingBanners } = useHomeBannersQuery();
  const { data: services = [], isLoading: loadingServices } = useHomeServicesQuery();

  const [active, setActive] = useState(0);

  const hasBanners = banners.length > 0;
  const itemsCount = hasBanners ? banners.length : services.length;
  const isLoading = loadingBanners || (!hasBanners && loadingServices);

  useEffect(() => {
    if (itemsCount <= 1) return;

    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % itemsCount),
      5600,
    );

    return () => window.clearInterval(timer);
  }, [itemsCount]);

  const activeIndex = itemsCount ? active % itemsCount : 0;
  const currentBanner = hasBanners ? banners[activeIndex] : null;
  const slide = !hasBanners && services.length ? services[activeIndex] : null;

  const bannerSelectors = useMemo(() => banners.slice(0, 4), [banners]);
  const selectors = useMemo(() => services.slice(0, 4), [services]);

  if (isLoading) return <HeroSkeleton />;

  if (hasBanners && currentBanner) {
    return (
      <section data-no-reveal="true" className="relative w-full overflow-hidden bg-gradient-to-br from-[#004bb1] via-[#005bc4] to-[#007ded] text-white shadow-xl">
        {currentBanner.imageUrl ? (
          <div key={currentBanner.id} className="relative w-full overflow-hidden animate-[hero-in_.55s_ease-out]">
            <Link href={currentBanner.linkUrl || buildRoute.appointmentBooking()} className="block w-full">
              <img
                src={currentBanner.imageUrl}
                alt={currentBanner.title}
                className="w-full h-auto max-h-[560px] object-cover sm:object-fill"
              />
            </Link>
            {bannerSelectors.length > 1 ? (
              <div className="absolute bottom-4 right-6 z-30 flex items-center gap-2">
                {bannerSelectors.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`Chọn ${item.title}`}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      activeIndex === index ? "w-10 bg-white shadow-md" : "w-3 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
            <div
              key={currentBanner.id}
              className="grid min-h-[500px] sm:min-h-[540px] animate-[hero-in_.55s_ease-out] lg:grid-cols-[1.1fr_.9fr]"
            >
              <div className="relative z-10 flex flex-col justify-center px-4 py-10 sm:px-8 sm:py-12 lg:px-12">
                <div className="mb-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
                    <DashboardIcon name="sparkles" className="h-4 w-4 text-amber-300" />
                    Chương trình nổi bật
                  </span>
                </div>

                <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[58px]">
                  {currentBanner.title}
                </h1>
                {currentBanner.description && (
                  <p className="mt-5 max-w-xl text-base leading-7 text-white/85">
                    {currentBanner.description}
                  </p>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={currentBanner.linkUrl || buildRoute.appointmentBooking()}
                    className="inline-flex h-14 items-center justify-center rounded-2xl bg-white px-7 text-sm font-bold text-[#0058bc] shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-slate-50"
                  >
                    Khám phá ngay
                  </Link>
                </div>

                <div className="mt-10 flex items-center gap-3">
                  {bannerSelectors.map((item, index) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActive(index)}
                      aria-label={`Chọn ${item.title}`}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        activeIndex === index ? "w-12 bg-white" : "w-3 bg-white/40 hover:bg-white/75"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="relative h-full w-full min-h-[360px] lg:min-h-full">
                <div className="relative h-full w-full min-h-[360px] lg:min-h-full grid place-items-center overflow-hidden bg-[#003882]">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#005bc4] via-[#005bc4]/40 to-transparent z-10" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/20 z-10" />
                  <span className="absolute right-6 top-6 z-20 rounded-full border border-cyan-200/30 bg-black/25 px-3 py-1.5 text-[10px] font-bold tracking-widest text-cyan-100 backdrop-blur-md">
                    SMART DENTAL BANNER
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    );
  }

  if (!slide) {
    return (
      <section data-no-reveal="true" className="relative w-full overflow-hidden bg-gradient-to-br from-[#004bb1] via-[#005bc4] to-[#007ded] text-white shadow-xl">
        <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
          <div className="grid min-h-[500px] sm:min-h-[540px] lg:grid-cols-[1.1fr_.9fr]">
            <div className="relative z-10 flex flex-col justify-center px-4 py-10 sm:px-8 sm:py-12 lg:px-12">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
                  <DashboardIcon name="sparkles" className="h-4 w-4 text-amber-300" />
                  Hệ Thống Nha Khoa Kỹ Thuật Số AI
                </span>
              </div>

              <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[58px]">
                Chăm sóc nụ cười chuẩn Y Khoa
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/85">
                Hệ thống Smart Dental ứng dụng công nghệ trí tuệ nhân tạo (AI) hỗ trợ lập phác đồ điều trị chính xác, đặt lịch hẹn nhanh chóng và tư vấn trực tuyến 24/7.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={buildRoute.appointmentBooking()}
                  className="inline-flex h-14 items-center justify-center rounded-2xl bg-white px-7 text-sm font-bold text-[#0058bc] shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  Đặt lịch khám ngay
                </Link>
                <Link
                  href={ROUTES.service}
                  className="inline-flex h-14 items-center rounded-2xl border border-white/35 bg-white/12 px-7 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  Khám phá dịch vụ
                </Link>
              </div>
            </div>

            <div className="relative h-full w-full min-h-[360px] lg:min-h-full grid place-items-center overflow-hidden bg-[#003882]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#005bc4] via-[#005bc4]/50 to-transparent z-10" />
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
                SMART DENTAL AI
              </span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section data-no-reveal="true" className="relative w-full overflow-hidden bg-gradient-to-br from-[#004bb1] via-[#005bc4] to-[#007ded] text-white shadow-xl">
      <div className="mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8">
        <div
          key={slide.id}
          className="grid min-h-[500px] sm:min-h-[540px] animate-[hero-in_.55s_ease-out] lg:grid-cols-[1.1fr_.9fr]"
        >
          <div className="relative z-10 flex flex-col justify-center px-4 py-10 sm:px-8 sm:py-12 lg:px-12">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3.5 py-1.5 text-xs font-semibold backdrop-blur-md">
              <DashboardIcon name="sparkles" className="h-4 w-4 text-amber-300" />
              Dịch vụ nổi bật
            </span>
            <span className="inline-flex rounded-full border border-white/20 bg-white/12 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md">
              Từ {slide.price} đ
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md">
              <DashboardIcon name="sparkles" className="h-3.5 w-3.5 text-amber-300" />
              Chuẩn Y Khoa
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
              href={buildRoute.appointmentWithService(slide.id)}
              className="inline-flex h-14 items-center justify-center rounded-2xl bg-white px-7 text-sm font-bold text-[#0058bc] shadow-xl shadow-blue-950/20 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Đặt lịch hẹn ngay
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
      </div>
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
  ).slice(0, 4);

  const isPreview = mode === "preview";

  return (
    <article
      className={`relative overflow-hidden transition-all duration-500 rounded-3xl bg-white border min-h-[440px] sm:min-h-[480px] lg:h-[520px] flex flex-col justify-between ${
        isPreview
          ? "border-slate-200/60 opacity-40 scale-[0.93] shadow-sm select-none pointer-events-none"
          : "border-slate-100/80 shadow-[0_20px_50px_rgba(15,23,42,0.07)] opacity-100 scale-100 z-10"
      }`}
    >
      <div className="relative h-full p-5 sm:p-8 lg:p-10 flex flex-col lg:grid lg:grid-cols-[1.3fr_0.7fr] gap-4 sm:gap-6 justify-between items-stretch">
        {/* Left text & content container */}
        <div className="z-10 flex flex-col justify-between h-full min-w-0">
          <div>
            <p className="text-xs sm:text-[14px] font-semibold text-[#3b4c7c] tracking-wide mb-1">
              Bác sĩ chuyên khoa
            </p>
            <h3 className="text-xl sm:text-3xl lg:text-[34px] xl:text-[36px] font-bold text-[#1f2b56] tracking-tight leading-tight mb-3 line-clamp-1">
              {doctor.name}
            </h3>

            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-[14px] text-slate-700 leading-relaxed overflow-hidden">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-800" />
                  <span className="line-clamp-2">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3">
            <Link
              href={buildRoute.doctorDetail(doctor.id)}
              className="inline-flex items-center justify-center rounded-full bg-[#ecf3fe] px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#2563eb] transition duration-200 hover:bg-[#deebff]"
            >
              Xem chi tiết bác sĩ ›
            </Link>
          </div>
        </div>

        {/* Right graphic motif & doctor image cutout */}
        <div className="relative h-44 sm:h-60 lg:h-full flex items-end justify-center lg:justify-end overflow-hidden">
          <div className="absolute bottom-0 w-40 h-40 sm:w-56 sm:h-56 lg:w-68 lg:h-68 rounded-full bg-[#d0e2fe] z-0 pointer-events-none" />
          <div className="relative z-10 h-full w-auto max-w-full flex items-end">
            <img
              src={doctor.avatarUrl || "/dsbacsi.png"}
              alt={doctor.name}
              className="h-full w-auto object-contain object-bottom drop-shadow-md max-h-[220px] sm:max-h-[320px] lg:max-h-none"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

export function DoctorDirectory() {
  const { data: doctors = [], isLoading: loading } = useHomeDoctorsQuery();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!doctors.length) return;
    setActiveIndex((value) => Math.min(value, doctors.length - 1));
  }, [doctors.length]);

  function moveToIndex(nextIndex: number) {
    if (!doctors.length) return;
    setActiveIndex((nextIndex + doctors.length) % doctors.length);
  }

  function step(direction: -1 | 1) {
    if (!doctors.length) return;
    moveToIndex(activeIndex + direction);
  }

  function getCarouselOffset(index: number) {
    if (!doctors.length) return 0;
    const raw = index - activeIndex;
    if (raw > doctors.length / 2) return raw - doctors.length;
    if (raw < -doctors.length / 2) return raw + doctors.length;
    return raw;
  }

  return (
    <section className="relative overflow-hidden bg-[#f4f7fc] py-10 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-3.5 sm:px-6 lg:px-12">
        {/* Top Header Section */}
        <div className="relative mx-auto mb-8 max-w-4xl text-center lg:mb-12">
          <p className={T.overline}>
            Đội ngũ bác sĩ
          </p>
          <h2 className="mx-auto mt-2 text-2xl font-bold tracking-tight text-[#173761] sm:text-4xl lg:text-5xl">
            Gặp gỡ đội ngũ bác sĩ giàu kinh nghiệm
          </h2>
          <p className={`mx-auto mt-3 text-xs sm:text-base ${T.body}`}>
            Đội ngũ bác sĩ tận tâm, chuyên nghiệp, luôn lắng nghe và mang đến trải nghiệm điều trị tốt nhất.
          </p>
        </div>

        {loading ? (
          <div className="mx-auto max-w-4xl">
            <DoctorSkeleton />
          </div>
        ) : doctors.length ? (
          <div className="relative mt-6 flex flex-col items-center lg:mt-12">
            <div className="relative min-h-[460px] sm:min-h-[520px] lg:min-h-[560px] w-full max-w-[1240px] overflow-hidden">
              {/* Navigation Arrows */}
              {doctors.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    aria-label="Bác sĩ trước"
                    className="absolute left-1 sm:left-4 top-1/2 z-30 grid h-9 w-9 sm:h-12 sm:w-12 -translate-y-1/2 place-items-center rounded-full border border-slate-100 bg-white text-slate-800 shadow-md transition hover:scale-105 active:scale-95"
                  >
                    <span className="text-xl sm:text-2xl font-light leading-none">‹</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Bác sĩ tiếp theo"
                    className="absolute right-1 sm:right-4 top-1/2 z-30 grid h-9 w-9 sm:h-12 sm:w-12 -translate-y-1/2 place-items-center rounded-full border border-slate-100 bg-white text-slate-800 shadow-md transition hover:scale-105 active:scale-95"
                  >
                    <span className="text-xl sm:text-2xl font-light leading-none">›</span>
                  </button>
                </>
              ) : null}

              {/* Carousel Container */}
              <div className="absolute inset-0">
                {doctors.map((doctor, index) => {
                  const offset = getCarouselOffset(index);
                  const distance = Math.abs(offset);
                  const isActive = index === activeIndex;

                  return (
                    <div
                      key={doctor.id}
                      onClick={() => moveToIndex(index)}
                      className={`absolute left-1/2 top-0 w-[calc(100%-1rem)] sm:w-[min(82vw,880px)] cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isActive
                          ? "z-20 opacity-100 scale-100"
                          : distance === 1
                            ? "hidden sm:block z-10 opacity-45 scale-[0.9]"
                            : "hidden opacity-0 scale-[0.86] pointer-events-none"
                      }`}
                      style={{
                        transform: `translateX(calc(-50% + ${offset * 560}px))`,
                      }}
                    >
                      <DoctorCardContent
                        doctor={doctor}
                        mode={isActive ? "active" : "preview"}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Indicator Dots for Mobile & Desktop */}
            {doctors.length > 1 && (
              <div className="mt-4 flex justify-center gap-1.5">
                {doctors.map((doctor, index) => (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => moveToIndex(index)}
                    aria-label={`Chọn ${doctor.name}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeIndex ? "w-6 bg-[#0058bc]" : "w-2 bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Xem tất cả bác sĩ Button */}
            <div className="mt-6 flex justify-center">
              <Link
                href={ROUTES.doctor}
                className="inline-flex h-11 items-center rounded-full border border-[#0058bc] bg-white px-7 text-xs sm:text-sm font-bold text-[#0058bc] shadow-sm transition hover:bg-[#f5f9ff]"
              >
                Xem tất cả bác sĩ ›
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
