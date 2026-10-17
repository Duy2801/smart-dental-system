import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";
import type { DentalService, TreatmentMethod } from "../types";
import { EmptyContent } from "./ServiceDetailShared";
import { ROUTES } from "../../common/routes";

type ServiceDetailHeroProps = {
  service: DentalService;
  activeMethod?: TreatmentMethod | null;
};

export function ServiceDetailHero({
  service,
  activeMethod,
}: ServiceDetailHeroProps) {
  const heroMedia = activeMethod?.media?.[0];
  const title = activeMethod?.name ?? service.title;
  const description =
    activeMethod?.description || service.detailSummary || service.description;
  const image = activeMethod?.imageUrl || heroMedia?.url || service.image;
  const imageAlt = heroMedia?.alt || service.imageAlt || title;

  return (
    <>
      {/* Breadcrumb Navigation */}
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link href={ROUTES.home} className="hover:text-[#0863c5] transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href={ROUTES.service} className="hover:text-[#0863c5] transition-colors">
          Dịch vụ
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700">{service.title}</span>
        {activeMethod ? (
          <>
            <span>/</span>
            <span className="font-semibold text-slate-900">
              {activeMethod.name}
            </span>
          </>
        ) : null}
      </nav>

      {/* Main Unified Hero Card */}
      <section className="max-w-full overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-7 lg:p-8">
        <div className="grid items-center gap-6 lg:grid-cols-[300px_1fr] lg:gap-8 xl:grid-cols-[320px_1fr]">
          
          {/* Left: Media Showcase Frame */}
          <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/40 p-2.5 shadow-inner sm:mx-auto sm:max-w-md lg:max-w-none lg:aspect-square">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-blue-300/20 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-indigo-300/20 blur-3xl" />

            {/* Poster Image */}
            <img
              src={image}
              alt={imageAlt}
              className="relative z-10 h-full w-full rounded-xl object-cover object-center shadow-md ring-1 ring-slate-900/5 transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </div>

          {/* Right: Content & Action Panel */}
          <div className="min-w-0 flex flex-col justify-center space-y-5">
            <div>
              {/* Category Badge & Status */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-[#0863c5]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0863c5]" />
                  {service.title}
                </span>
                {activeMethod && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                    Chuyên sâu
                  </span>
                )}
              </div>

              {/* Main Title */}
              <h1 className="mt-3 break-words text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl lg:text-4xl">
                {title}
              </h1>

              {/* Description */}
              {description ? (
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600 line-clamp-3">
                  {description}
                </p>
              ) : (
                <div className="mt-3">
                  <EmptyContent label="Thông tin phương pháp điều trị" />
                </div>
              )}
            </div>

            {/* Quick Spec Highlights */}
            <div className="grid grid-cols-1 gap-3.5 min-[420px]:grid-cols-2 sm:gap-4">
              <div className="flex items-center gap-3.5 rounded-2xl border border-blue-100/70 bg-blue-50/50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/80 text-[#0863c5]">
                  <DashboardIcon name="shield" className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500">Tiêu chuẩn phục vụ</p>
                  <strong className="block break-words text-base font-extrabold text-slate-900">
                    Chuẩn Y Khoa
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-100/70 bg-emerald-50/50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100/80 text-emerald-600">
                  <DashboardIcon name="shield" className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500">Kế hoạch điều trị</p>
                  <strong className="block break-words text-base font-extrabold text-slate-900">
                    Cá nhân hóa
                  </strong>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
