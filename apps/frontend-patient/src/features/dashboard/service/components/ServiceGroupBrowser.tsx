"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardIcon } from "../../common/DashboardIcon";
import { formatServicePrice } from "../api";
import type { DentalService, ServiceFaq, TreatmentMethod } from "../types";
import { buildRoute, ROUTES } from "../../common/routes";
import { T } from "../../common/typography";
import { EmptySearchResult } from "../../common/EmptySearchResult";

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

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
      <div
        className={`relative flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-2xl p-1.5 transition-all duration-300 ${
          selected
            ? "bg-white shadow-md ring-2 ring-[#0863c5]/30 scale-105"
            : "bg-white/90 shadow-sm ring-1 ring-slate-200/60 group-hover:bg-white group-hover:shadow-md group-hover:scale-105"
        }`}
      >
        {service.icon ? (
          <img
            src={service.icon}
            alt={service.title}
            className="h-full w-full object-contain rounded-xl transition duration-300"
            aria-hidden="true"
          />
        ) : (
          <span className="text-base sm:text-xl font-black text-[#0863c5]">
            {service.title.slice(0, 2)}
          </span>
        )}
      </div>
      <span
        className={`mt-2 sm:mt-3.5 line-clamp-2 min-h-8 sm:min-h-11 text-center text-xs sm:text-[14px] font-extrabold leading-tight transition-colors duration-200 ${
          selected
            ? "text-[#0863c5]"
            : "text-slate-700 group-hover:text-[#0863c5]"
        }`}
      >
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
  const className = `group relative flex min-h-[120px] sm:min-h-[160px] flex-col items-center justify-center rounded-2xl border p-2.5 sm:p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
    selected
      ? "border-[#0863c5] bg-gradient-to-b from-blue-50/90 via-blue-50/40 to-white shadow-md ring-2 ring-[#0863c5]/20"
      : "border-slate-200/70 bg-gradient-to-b from-slate-50/80 to-white hover:border-blue-300/80 hover:bg-gradient-to-b hover:from-blue-50/40 hover:to-white"
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
  const imageUrl = method.imageUrl || method.media?.[0]?.url;
  const imageAlt = method.media?.[0]?.alt || method.name;

  return (
    <div
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] sm:aspect-square w-full max-h-52 sm:max-h-none overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-blue-50 px-4 text-center text-xs font-extrabold text-[#0863c5]">
            {method.name}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <span className={`${T.fieldLabel}`}>
          {service.title}
        </span>
        <h3 className="mt-1 line-clamp-2 text-base font-extrabold leading-6 text-slate-950 group-hover:text-[#0863c5]">
          {method.name}
        </h3>
        <p className={`mt-2 line-clamp-2 sm:line-clamp-3 flex-1 ${T.body}`}>
          {method.description || service.shortDescription}
        </p>

        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
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
            className="rounded-xl bg-[#0863c5] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0756aa] active:scale-95"
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
  const imageUrl = method.imageUrl || method.media?.[0]?.url;
  const imageAlt = method.media?.[0]?.alt || method.name;

  return (
    <div className="group grid h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg sm:grid-cols-[200px_1fr]">
      <div className="relative aspect-[4/3] sm:aspect-square w-full sm:w-[200px] max-h-52 sm:max-h-none overflow-hidden bg-slate-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full min-h-[160px] w-full items-center justify-center bg-blue-50 px-5 text-center text-sm font-extrabold text-[#0863c5]">
            {method.name}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col p-4 sm:p-5">
        <span className={`${T.fieldLabel}`}>
          {service.title}
        </span>
        <h3 className="mt-1 line-clamp-2 text-base sm:text-lg font-extrabold leading-6 sm:leading-7 text-slate-950 group-hover:text-[#0863c5]">
          {method.name}
        </h3>
        <p className={`mt-2 line-clamp-2 sm:line-clamp-3 flex-1 ${T.body}`}>
          {method.description || service.shortDescription}
        </p>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#0863c5]">
              {formatServicePrice(method.basePrice)}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              Chuyên sâu
            </span>
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
    <section className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-7">
      <div className="mx-auto max-w-3xl text-center">
        <p className={`${T.overline} text-[#0863c5]`}>
          Được yêu thích
        </p>
        <h3 className="mt-1 text-xl font-black text-[#07366f] sm:text-3xl">
          Dịch vụ được đặt nhiều nhất
        </h3>
        <p className={`mx-auto mt-1 max-w-2xl text-xs sm:text-sm ${T.body}`}>
          Tự động xếp hạng theo số lượt đặt lịch thực tế trong hệ thống.
        </p>
      </div>

      <div className="mt-4 sm:mt-6 grid gap-3.5 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
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
  const searchParams = useSearchParams();
  const keywordFromUrl = searchParams.get("keyword") || "";

  const filteredServices = useMemo(() => {
    if (!keywordFromUrl) return orderedServices;
    const kw = normalizeText(keywordFromUrl);
    return orderedServices.filter((service) => {
      const matchTitle = normalizeText(service.title).includes(kw);
      const matchSlug = service.slug && normalizeText(service.slug).includes(kw);
      const matchDesc = service.description && normalizeText(service.description).includes(kw);
      const matchMethods = (service.treatmentMethods ?? []).some(
        (m) =>
          normalizeText(m.name).includes(kw) ||
          (m.description && normalizeText(m.description).includes(kw))
      );
      return matchTitle || matchSlug || matchDesc || matchMethods;
    });
  }, [orderedServices, keywordFromUrl]);

  const [selectedServiceId, setSelectedServiceId] = useState(
    filteredServices[0]?.id ?? "",
  );

  useEffect(() => {
    if (filteredServices.length > 0) {
      if (!filteredServices.some((s) => s.id === selectedServiceId)) {
        setSelectedServiceId(filteredServices[0].id);
      }
    }
  }, [filteredServices, selectedServiceId]);

  const selectedService =
    filteredServices.find((service) => service.id === selectedServiceId) ||
    filteredServices[0] ||
    null;

  const selectedMethods = useMemo<MethodMatch[]>(() => {
    if (!selectedService) return [];
    return (selectedService.treatmentMethods ?? []).map((method) => ({
      service: selectedService,
      method,
    }));
  }, [selectedService]);

  const popularMethods = useMemo<MethodMatch[]>(() => {
    return filteredServices
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
  }, [filteredServices]);

  const serviceFaqs = useMemo<FaqMatch[]>(() => {
    return filteredServices.flatMap((service) =>
      (service.treatmentMethods ?? []).flatMap((method) =>
        (method.faqs ?? []).slice(0, 2).map((faq) => ({
          ...faq,
          serviceTitle: service.title,
          methodName: method.name,
        })),
      ),
    );
  }, [filteredServices]);

  if (keywordFromUrl && !filteredServices.length) {
    return (
      <div className="py-6">
        <EmptySearchResult
          title="Không tìm thấy dịch vụ hoặc bác sĩ"
          description="Hãy thử tìm kiếm từ khóa dịch vụ, phương pháp điều trị hoặc tên bác sĩ khác"
          actionHref={ROUTES.service}
          actionText="Xem tất cả dịch vụ"
        />
      </div>
    );
  }

  if (!filteredServices.length) return null;

  if (compact) {
    return (
      <div className="space-y-9">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {filteredServices.map((service) => (
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
        {filteredServices.map((service) => (
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
            <EmptySearchResult
              title="Không tìm thấy sản phẩm"
              description="Hãy thử tìm kiếm từ khóa dịch vụ khác"
            />
          )}
        </section>
      ) : null}

      <ServiceFaqSection faqs={serviceFaqs} />
    </div>
  );
}
