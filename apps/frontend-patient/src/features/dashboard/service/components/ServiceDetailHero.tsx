import Link from "next/link";
import { DashboardIcon } from "../../common/DashboardIcon";
import { formatServicePrice } from "../api";
import { minutesLabel } from "../service-detail-utils";
import type { DentalService, TreatmentMethod } from "../types";
import { EmptyContent } from "./ServiceDetailShared";
import { ROUTES, buildRoute } from "../../common/routes";
import { T } from "../../common/typography";

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
  const image = heroMedia?.url || service.image;
  const imageAlt = heroMedia?.alt || service.imageAlt || title;
  const price = activeMethod
    ? formatServicePrice(activeMethod.basePrice)
    : service.price;
  const duration = activeMethod?.durationMinutes || service.durationMinutes;
  const bookingHref = `${ROUTES.appointment}?service=${service.id}${activeMethod ? `&treatmentMethod=${activeMethod.id}` : ""
    }&intent=booking`;

  return (
    <>
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link href={ROUTES.home} className="hover:text-[#0863c5]">
          Trang chủ
        </Link>
        <span>/</span>
        <Link href={ROUTES.service} className="hover:text-[#0863c5]">
          Dịch vụ
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-800">{service.title}</span>
        {activeMethod ? (
          <>
            <span>/</span>
            <span className="font-semibold text-slate-800">
              {activeMethod.name}
            </span>
          </>
        ) : null}
      </nav>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,0.98fr)_minmax(380px,0.82fr)]">
          <div className="relative min-h-[300px] overflow-hidden bg-slate-100 sm:min-h-[360px] lg:min-h-[460px]">
            <img
              src={image}
              alt={imageAlt}
              className="h-full min-h-[300px] w-full object-cover sm:min-h-[360px] lg:min-h-[460px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent" />
            <div className="absolute inset-x-5 bottom-5 text-white sm:inset-x-7 sm:bottom-7">
              <span className={`rounded-full border border-white/20 bg-white/15 px-3 py-1.5 ${T.overline} text-white backdrop-blur`}>
                {service.title}
              </span>
              <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                {title}
              </h1>
              <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-white/85">
                {description || service.shortDescription}
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center p-5 sm:p-6 lg:p-8">
            <p className={`${T.overline} text-[#0863c5]`}>
              {activeMethod ? "Thông tin phương pháp" : "Thông tin dịch vụ"}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-[28px]">
              Lộ trình rõ ràng trước khi điều trị
            </h2>
            {description ? (
              <p className={`mt-3 line-clamp-4 whitespace-pre-line ${T.body}`}>
                {description}
              </p>
            ) : (
              <div className="mt-4">
                <EmptyContent label="Tóm tắt chuyên sâu" />
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-blue-50 p-3.5">
                <DashboardIcon
                  name="clock"
                  className="h-4 w-4 text-[#0863c5]"
                />
                <p className={`mt-2.5 ${T.fieldLabel}`}>Thời lượng</p>
                <strong className="mt-1 block text-lg text-slate-900">
                  {minutesLabel(duration)}
                </strong>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3.5">
                <DashboardIcon
                  name="shield"
                  className="h-4 w-4 text-emerald-600"
                />
                <p className={`mt-2.5 ${T.fieldLabel}`}>Kế hoạch</p>
                <strong className="mt-1 block text-lg text-slate-900">
                  Cá nhân hóa
                </strong>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className={T.fieldLabel}>Giá từ</p>
                  <p className="mt-1 text-3xl font-extrabold text-[#0863c5]">
                    {price}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                  Tư vấn trước điều trị
                </span>
              </div>
              <Link
                href={bookingHref}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0863c5] text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#0756aa]"
              >
                Đặt dịch vụ ngay
                <DashboardIcon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
