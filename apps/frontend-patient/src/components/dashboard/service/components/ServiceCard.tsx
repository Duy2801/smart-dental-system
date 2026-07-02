import Image from "next/image";
import Link from "next/link";
import type { DentalService } from "../types";
import { DashboardIcon } from "../../common/DashboardIcon";

export function ServiceCard({ service }: { service: DentalService }) {
  return (
    <article className="group flex overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/60">
      <div className="flex w-full flex-col">
        <div className="relative h-52 overflow-hidden bg-slate-100">
          <Image
            src={service.image}
            alt={service.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />
          {service.badge && (
            <span className="absolute right-3 top-3 rounded-full bg-[#0863c5] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">
              {service.badge}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h2 className="text-base font-bold tracking-[-0.02em] text-slate-900 group-hover:text-[#0863c5]">
            {service.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{service.description}</p>
          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400">
              Từ <strong className="text-[#0863c5]">{service.price}</strong>
            </p>
            <Link
              href={`/appointment?service=${service.id}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0863c5] px-3.5 text-[10px] font-bold text-white transition hover:bg-[#0756aa]"
            >
              Đăng ký tư vấn
              <DashboardIcon name="arrow" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
