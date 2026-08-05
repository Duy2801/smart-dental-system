"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardIcon } from "../../common/DashboardIcon";
import { formatServicePrice } from "../api";
import type { DentalService, ServiceFaq, TreatmentMethod } from "../types";
import { buildRoute } from "../../common/routes";
import { T } from "../../common/typography";

type ServiceGroupBrowserProps = {
  services: DentalService[];
  compact?: boolean;
};

type MethodMatch = {
  service: DentalService;
  method: TreatmentMethod;
};

type FaqMatch = ServiceFaq & {
  serviceTitle: string;
  methodName: string;
};

const SERVICE_ORDER_BY_SLUG: Record<string, number> = {
  "trong-rang-implant": 1,
  "boc-rang-su": 2,
  "dan-su-veneer": 3,
  "nieng-rang": 4,
  "nieng-rang-mac-cai": 5,
  "nha-khoa-tong-quat": 6,
  "nho-rang-khon": 7,
  "nha-khoa-tre-em": 8,
};

function getServiceOrder(service: DentalService) {
  return (
    (service.slug ? SERVICE_ORDER_BY_SLUG[service.slug] : undefined) ??
    service.displayOrder ??
    999
  );
}

function methodHref(service: DentalService, method: TreatmentMethod) {
  return `${buildRoute.serviceDetail(service.id)}?method=${method.id}`;
}

function ServiceIconContent({
  service,
  selected = false,
}: {
  service: DentalService;
  selected?: boolean;
}) {
  return (
    <>
      <span
        className={`grid h-20 w-20 place-items-center rounded-full transition ${selected ? "bg-white" : "bg-cyan-50"
          }`}
      >
        {service.icon ? (
          <img
            src={service.icon}
            alt=""
            className="h-14 w-14 object-contain"
            aria-hidden="true"
          />
        ) : (
          <span className="text-xl font-black text-[#0863c5]">
            {service.title.slice(0, 2)}
          </span>
        )}
      </span>
      <span className="mt-3 line-clamp-2 min-h-12 text-[15px] font-bold leading-6 text-slate-800 group-hover:text-[#0863c5]">
        {service.title}
      </span>
    </>
  );
}

function ServiceIconTile({
  service,
  selected = false,
  onSelect,
}: {
  service: DentalService;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const className = `group flex min-h-[150px] flex-col items-center justify-center rounded-2xl border p-4 text-center transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${selected
    ? "border-[#0863c5] bg-blue-50 shadow-sm ring-2 ring-blue-100"
    : "border-slate-100 bg-slate-50 hover:border-blue-100 hover:bg-white"
    }`;

  if (!onSelect) {
    return (
      <Link
        href={buildRoute.serviceDetail(service.id)}
        className={className}
        aria-label={`Xem chi tiết ${service.title}`}
      >
        <ServiceIconContent service={service} selected={selected} />
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={className}
      aria-label={`Xem phương pháp thuộc ${service.title}`}
      aria-pressed={selected}
    >
      <ServiceIconContent service={service} selected={selected} />
    </button>
  );
}

function PopularMethodCard({
  service,
  method,
}: {
  service: DentalService;
  method: TreatmentMethod;
}) {
  const methodImage = method.media?.[0];

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        {methodImage?.url ? (
          <img
            src={methodImage.url}
            alt={methodImage.alt || method.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-blue-50 px-5 text-center text-sm font-extrabold text-[#0863c5]">
            {method.name}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className={`${T.fieldLabel}`}>
          {service.title}
        </span>
        <h3 className="mt-1 line-clamp-2 text-base font-extrabold leading-6 text-slate-950 group-hover:text-[#0863c5]">
          {method.name}
        </h3>
        <p className={`mt-4 line-clamp-3 flex-1 ${T.body}`}>
          {method.description || service.shortDescription}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-bold text-[#0863c5]">
              {formatServicePrice(method.basePrice)}
            </p>
            <span className="text-[10px] text-slate-400">
              {method.bookingCount ?? 0} lượt đặt
            </span>
          </div>
          <Link
            href={buildRoute.appointmentBooking(service.id, method.id)}
            className="rounded-xl bg-[#0863c5] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0756aa]"
          >
            Đặt lịch
          </Link>
        </div>
      </div>
    </div>
  );
}

function MethodCard({
  service,
  method,
}: {
  service: DentalService;
  method: TreatmentMethod;
}) {
  const methodImage = method.media?.[0];

  return (
    <div className="group grid h-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg sm:grid-cols-[180px_1fr]">
      <div className="relative min-h-[180px] overflow-hidden bg-slate-100">
        {methodImage?.url ? (
          <img
            src={methodImage.url}
            alt={methodImage.alt || method.name}
            className="h-full min-h-[180px] w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full min-h-[180px] w-full items-center justify-center bg-blue-50 px-5 text-center text-sm font-extrabold text-[#0863c5]">
            {method.name}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col p-5">
        <span className={`${T.fieldLabel}`}>
          {service.title}
        </span>
        <h3 className="mt-1 line-clamp-2 text-lg font-extrabold leading-7 text-slate-950 group-hover:text-[#0863c5]">
          {method.name}
        </h3>
        <p className={`mt-3 line-clamp-3 flex-1 ${T.body}`}>
          {method.description || service.shortDescription}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0863c5]">
              {formatServicePrice(method.basePrice)}
            </span>
            {method.durationMinutes ? (
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                {method.durationMinutes} phút
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={methodHref(service, method)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
            >
              Chi tiết
            </Link>
            <Link
              href={buildRoute.appointmentBooking(service.id, method.id)}
              className="rounded-lg bg-[#0863c5] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0756aa]"
            >
              Đặt lịch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function PopularMethodsSection({ methods }: { methods: MethodMatch[] }) {
  if (!methods.length) return null;

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
      <div className="mx-auto max-w-3xl text-center">
        <p className={`${T.overline} text-[#0863c5]`}>
          Được yêu thích
        </p>
        <h3 className="mt-2 text-2xl font-black text-[#07366f] sm:text-3xl">
          Dịch vụ được đặt nhiều nhất
        </h3>
        <p className={`mx-auto mt-2 max-w-2xl ${T.body}`}>
          Tự động xếp hạng theo số lượt đặt lịch thực tế trong hệ thống.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {methods.map(({ service, method }) => (
          <PopularMethodCard
            key={method.id}
            service={service}
            method={method}
          />
        ))}
      </div>
    </section>
  );
}

function ServiceFaqSection({ faqs }: { faqs: FaqMatch[] }) {
  if (!faqs.length) return null;

  return (
    <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
      <div>
        <p className={`${T.overline} text-[#0863c5]`}>
          Câu hỏi thường gặp
        </p>
        <h2 className="mt-2 text-2xl font-black text-[#07366f] sm:text-3xl">
          Giải đáp liên quan đến dịch vụ
        </h2>
      </div>

      <div className="mt-6 divide-y divide-slate-100">
        {faqs.slice(0, 8).map((faq) => (
          <details key={faq.id} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-extrabold text-slate-950">
              <span>
                {faq.question}
                <span className="mt-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
                  {faq.serviceTitle} · {faq.methodName}
                </span>
              </span>
              <DashboardIcon
                name="chevron"
                className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90"
              />
            </summary>
            <p className={`mt-3 ${T.body}`} style={{ lineHeight: "1.75rem" }}>
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function ServiceGroupBrowser({
  services,
  compact = false,
}: ServiceGroupBrowserProps) {
  const orderedServices = useMemo(
    () =>
      [...services].sort((a, b) => {
        const orderDiff = getServiceOrder(a) - getServiceOrder(b);
        if (orderDiff !== 0) return orderDiff;
        return a.title.localeCompare(b.title, "vi");
      }),
    [services],
  );
  const [selectedServiceId, setSelectedServiceId] = useState(
    orderedServices[0]?.id ?? "",
  );

  const selectedService =
    orderedServices.find((service) => service.id === selectedServiceId) ||
    orderedServices[0] ||
    null;

  const selectedMethods = useMemo<MethodMatch[]>(() => {
    if (!selectedService) return [];
    return (selectedService.treatmentMethods ?? []).map((method) => ({
      service: selectedService,
      method,
    }));
  }, [selectedService]);

  const popularMethods = useMemo<MethodMatch[]>(() => {
    return orderedServices
      .flatMap((service) =>
        (service.treatmentMethods ?? []).map((method) => ({
          service,
          method,
        })),
      )
      .sort((a, b) => {
        const countDiff =
          (b.method.bookingCount ?? 0) - (a.method.bookingCount ?? 0);
        if (countDiff !== 0) return countDiff;
        return (a.method.displayOrder ?? 0) - (b.method.displayOrder ?? 0);
      })
      .slice(0, 4);
  }, [orderedServices]);

  const serviceFaqs = useMemo<FaqMatch[]>(() => {
    return orderedServices.flatMap((service) =>
      (service.treatmentMethods ?? []).flatMap((method) =>
        (method.faqs ?? []).slice(0, 2).map((faq) => ({
          ...faq,
          serviceTitle: service.title,
          methodName: method.name,
        })),
      ),
    );
  }, [orderedServices]);

  if (!orderedServices.length) return null;

  if (compact) {
    return (
      <div className="space-y-9">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
          {orderedServices.map((service) => (
            <ServiceIconTile key={service.id} service={service} />
          ))}
        </div>
        <PopularMethodsSection methods={popularMethods} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Centered Intro Header Section (Clean layout, matching PromotionWorkspace) */}
      <section className="text-center py-4 space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0058bc]">
          <DashboardIcon name="sparkles" className="h-4 w-4 text-[#0058bc]" />
          Chăm Sóc Nụ Cười Toàn Diện
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Danh Sách Dịch Vụ Nha Khoa
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Chọn nhóm dịch vụ bên dưới để xem các phương pháp điều trị, chi phí và quy trình chi tiết.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        {orderedServices.map((service) => (
          <ServiceIconTile
            key={service.id}
            service={service}
            selected={selectedService?.id === service.id}
            onSelect={() => setSelectedServiceId(service.id)}
          />
        ))}
      </div>

      {selectedService ? (
        <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <div>
            <p className={`${T.overline} text-[#0863c5]`}>
              {selectedService.title}
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#07366f] sm:text-3xl">
              Các phương pháp điều trị
            </h2>
          </div>

          {selectedMethods.length ? (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {selectedMethods.map(({ service, method }) => (
                <MethodCard
                  key={method.id}
                  service={service}
                  method={method}
                />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
              Chưa có phương pháp điều trị trong nhóm này.
            </div>
          )}
        </section>
      ) : null}

      <ServiceFaqSection faqs={serviceFaqs} />
    </div>
  );
}
