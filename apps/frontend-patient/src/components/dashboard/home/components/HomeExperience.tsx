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
      <div className="grid min-h-[500px] lg:grid-cols-[1.05fr_.95fr]">
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
    <div className="relative grid min-h-[320px] place-items-center overflow-hidden bg-[#031b32] lg:min-h-[500px]">
      {service.imageUrl ? (
        <img
          src={service.imageUrl}
          alt={service.imageAlt}
          className="absolute inset-0 h-full w-full object-cover opacity-72 transition duration-700 ease-out"
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(76,211,239,.24),transparent_45%),linear-gradient(90deg,rgba(3,27,50,.62),rgba(3,27,50,.78))]" />
      <div className="absolute h-72 w-72 rounded-full border border-cyan-300/20" />
      <div className="absolute h-52 w-52 rounded-full border border-cyan-300/20" />
      <div className="absolute inset-x-16 top-1/2 h-px animate-pulse bg-cyan-300/70 shadow-[0_0_18px_4px_rgba(103,232,249,.35)]" />
      <DashboardIcon
        name="tooth"
        className="relative h-32 w-32 text-cyan-100/55 drop-shadow-[0_0_26px_rgba(125,211,252,.35)]"
      />
      <span className="absolute right-6 top-6 rounded-full border border-cyan-200/20 bg-cyan-200/10 px-3 py-1.5 text-[10px] font-bold tracking-widest text-cyan-100 backdrop-blur">
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

  useEffect(() => {
    if (active >= services.length) {
      setActive(0);
    }
  }, [active, services.length]);

  const slide = services[active];
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
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0058bc] via-[#0572df] to-[#0087ea] text-white shadow-xl shadow-blue-900/15">
      <div
        key={slide.id}
        className="grid min-h-[500px] animate-[hero-in_.55s_ease-out] lg:grid-cols-[1.05fr_.95fr]"
      >
        <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-10 lg:px-12">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
              <DashboardIcon name="sparkles" className="h-4 w-4" />
              Dịch vụ nổi bật
            </span>
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur">
              Từ {slide.price} đ
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85 backdrop-blur">
              <DashboardIcon name="clock" className="h-3.5 w-3.5" />
              {slide.durationMinutes} phút
            </span>
          </div>

          <h1 className="max-w-xl text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-[56px]">
            {slide.title}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/82">
            {slide.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/appointment?service=${slide.id}&intent=booking`}
              className="inline-flex h-14 items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-[#0058bc] shadow-lg transition hover:-translate-y-1"
            >
              Đặt lịch hẹn ngay
              <DashboardIcon name="arrow" className="h-4 w-4" />
            </Link>
            <Link
              href={slide.href}
              className="inline-flex h-14 items-center rounded-xl border border-white/30 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur transition hover:bg-white/15"
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
                  active === index ? "w-11 bg-white" : "w-2.5 bg-white/45 hover:bg-white/75"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative lg:order-none">
          <ServiceVisual service={slide} />
        </div>
      </div>

      {selectors.length > 1 ? (
        <div className="absolute bottom-5 right-5 hidden max-w-[430px] gap-2 lg:grid lg:grid-cols-2">
          {selectors.map((service, index) => (
            <button
              key={service.id}
              type="button"
              onClick={() => setActive(index)}
              className={`min-w-0 rounded-xl border px-3 py-2.5 text-left text-xs backdrop-blur transition ${
                active === index
                  ? "border-white/45 bg-white/18 text-white"
                  : "border-white/15 bg-white/8 text-white/70 hover:bg-white/14 hover:text-white"
              }`}
            >
              <span className="block truncate font-bold">{service.title}</span>
              <span className="mt-1 block truncate text-white/65">
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


