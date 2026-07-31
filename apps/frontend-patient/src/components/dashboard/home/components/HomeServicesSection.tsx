"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getHomeServices, type HomeServiceCard } from "../api";

function ServiceImage({ service }: { service: HomeServiceCard }) {
  if (!service.imageUrl) {
    return (
      <div className="grid aspect-[4/3] place-items-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-400">
        Chưa có ảnh
      </div>
    );
  }

  return (
    <img
      src={service.imageUrl}
      alt={service.imageAlt}
      className="aspect-[4/3] w-full rounded-xl object-cover"
    />
  );
}

function ServiceSkeleton() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="aspect-[4/3] animate-pulse rounded-xl bg-slate-100" />
      <div className="mt-4 h-5 w-2/3 animate-pulse rounded bg-slate-100" />
      <div className="mt-3 h-12 animate-pulse rounded bg-slate-100" />
      <div className="mt-6 h-8 w-1/2 animate-pulse rounded bg-slate-100" />
      <div className="mt-4 h-10 animate-pulse rounded bg-slate-100" />
    </article>
  );
}

export function HomeServicesSection() {
  const { data: services = [], isLoading: loading } = useQuery({
    queryKey: ["patient", "home", "services"],
    queryFn: getHomeServices,
  });

  return (
    <section id="services" className="scroll-mt-24">
      <div className="relative mx-auto max-w-3xl text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#0058bc]">
          Chăm sóc toàn diện
        </p>
        <h2 className="mx-auto mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#173761] sm:text-4xl">
          Danh sách dịch vụ nha khoa
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          Các dịch vụ điều trị nổi bật với chi phí rõ ràng và quy trình chăm sóc chuyên nghiệp.
        </p>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <ServiceSkeleton key={index} />
          ))}
        </div>
      ) : services.length ? (
        <>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <Link
                key={service.id}
                href={service.href}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                aria-label={`Xem chi tiết ${service.title}`}
              >
                <ServiceImage service={service} />
                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  {service.title}
                </h3>
                <p className="mt-2 min-h-14 text-xs leading-5 text-slate-500">
                  {service.description}
                </p>
                <div className="mt-auto pt-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Chỉ từ
                      </p>
                      <p className="mt-1 text-2xl font-bold text-[#0058bc]">
                        {service.price} <span className="text-sm">đ</span>
                      </p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#0058bc]">
                      {service.durationMinutes} phút
                    </span>
                  </div>
                  <span className="mt-4 block rounded-lg border border-[#0058bc] py-2.5 text-center text-xs font-bold text-[#0058bc] transition group-hover:bg-[#0058bc] group-hover:text-white">
                    Chi tiết
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/service"
              className="inline-flex items-center gap-2 rounded-xl border border-[#0058bc] bg-white px-6 py-3 text-xs font-bold text-[#0058bc] shadow-sm transition hover:bg-[#0058bc] hover:text-white"
            >
              Xem tất cả dịch vụ
            </Link>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Chưa có dịch vụ đang hoạt động để hiển thị.
        </div>
      )}
    </section>
  );
}
