import Link from "next/link";
import type { DentalService } from "../types";
import { DashboardIcon } from "../../common/DashboardIcon";
import { buildRoute } from "../../common/routes";
import { T } from "../../common/typography";

export function ServiceCard({ service }: { service: DentalService }) {
  return (
    <Link
      href={buildRoute.serviceDetail(service.id)}
      className="group flex overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60"
      aria-label={`Xem chi tiết ${service.title}`}
    >
      <div className="flex w-full flex-col">
        <div className="relative h-52 overflow-hidden bg-slate-100">
          <img
            src={service.image}
            alt={service.imageAlt}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />
          {service.badge && (
            <span className={`absolute right-3 top-3 rounded-full bg-[#0863c5] px-2.5 py-1 ${T.overline} text-white shadow-sm`}>
              {service.badge}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h2 className="text-base font-bold tracking-[-0.02em] text-slate-900 group-hover:text-[#0863c5]">
            {service.title}
          </h2>
          <p className={`mt-2 line-clamp-3 ${T.bodySm}`}>
            {service.shortDescription}
          </p>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              <p className={T.fieldLabel}>Chỉ từ</p>
              <p className="mt-1 text-lg font-extrabold text-[#0863c5]">
                {service.price}
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-[#0863c5]">
              Chuẩn Y Khoa
            </span>
          </div>
          <span
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#0863c5] px-4 text-xs font-bold text-[#0863c5] transition hover:bg-blue-50"
          >
            Chi tiết
          </span>
        </div>
      </div>
    </Link>
  );
}
