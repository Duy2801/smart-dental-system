"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getLiveClinicConfigInfo } from "../api";
import { ROUTES } from "../../common/routes";
import { T } from "../../common/typography";

type BusinessHour = {
  id: number;
  label: string;
  isOpen: boolean;
  start: string;
  end: string;
};

function formatBusinessHours(hours: BusinessHour[] = []) {
  return hours
    .filter((day) => day.isOpen)
    .map((day) => ({
      label: day.label,
      time: `${day.start} - ${day.end}`,
    }));
}

function InfoIcon({ children }: { children: ReactNode }) {
  return (
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100/70 text-[#0058bc]">
      {children}
    </div>
  );
}

export function ClinicLocationSection() {
  const {
    data: clinic,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["patient", "clinic-config"],
    queryFn: getLiveClinicConfigInfo,
  });
  const [copied, setCopied] = useState(false);

  const openHours = formatBusinessHours(clinic?.businessHours);
  const hasAddress = Boolean(clinic?.address?.trim());
  const mapEmbedUrl = hasAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(clinic!.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`
    : "";
  const mapDirectUrl = hasAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clinic!.address)}`
    : "";

  const handleCopyAddress = () => {
    if (!clinic?.address || typeof window === "undefined" || !navigator.clipboard) return;

    navigator.clipboard.writeText(clinic.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="h-6 w-52 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-8 grid gap-8 lg:grid-cols-12">
          <div className="h-[420px] animate-pulse rounded-2xl bg-slate-100 lg:col-span-5" />
          <div className="h-[420px] animate-pulse rounded-2xl bg-slate-100 lg:col-span-7" />
        </div>
      </section>
    );
  }

  if (isError || !clinic) {
    return (
      <section className="rounded-3xl border border-dashed border-rose-200 bg-white p-8 text-center text-sm text-rose-600 shadow-sm">
        Không tải được thông tin phòng khám từ hệ thống. Vui lòng kiểm tra API
        <span className="font-semibold"> /clinic-config</span>.
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#0058bc]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0058bc] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0058bc]" />
            </span>
            Vị trí phòng khám & Bản đồ
          </span>
          <h2 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            Thông tin & Vị trí Phòng khám
          </h2>
          <p className={`mt-1 ${T.body}`}>
            Thông tin được lấy trực tiếp từ cấu hình phòng khám trong hệ thống.
          </p>
        </div>

        {hasAddress ? (
          <a
            href={mapDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 self-start rounded-xl bg-blue-50 px-4 py-2.5 text-xs font-bold text-[#0058bc] transition hover:bg-[#0058bc] hover:text-white"
          >
            Mở chỉ đường Google Maps &rarr;
          </a>
        ) : null}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-stretch">
        <div className="flex flex-col justify-between space-y-6 rounded-2xl border border-slate-100 bg-slate-50/60 p-6 lg:col-span-5">
          <div className="space-y-5">
            <div className="flex items-start gap-4 border-b border-slate-200/80 pb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0058bc] text-white shadow-md shadow-blue-500/20">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {clinic.name || "Chưa cập nhật tên phòng khám"}
                </h3>
                <span className="mt-1 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                  ● Đang mở cửa đón khách
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <InfoIcon>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </InfoIcon>
              <div className="flex-1 text-xs">
                <p className={T.fieldLabel}>
                  Địa chỉ phòng khám
                </p>
                <p className="mt-1 font-semibold leading-relaxed text-slate-900">
                  {clinic.address || "Chưa cập nhật địa chỉ"}
                </p>
                {hasAddress ? (
                  <button
                    type="button"
                    onClick={handleCopyAddress}
                    className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0058bc] hover:underline focus:outline-none"
                  >
                    {copied ? "✓ Đã sao chép địa chỉ" : "Sao chép địa chỉ"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <InfoIcon>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </InfoIcon>
              <div className="text-xs">
                <p className={T.fieldLabel}>
                  Hotline &amp; Tư vấn đặt lịch
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  {clinic.phone ? (
                    <a href={`tel:${clinic.phone}`} className="text-base font-extrabold text-[#0058bc] hover:underline">
                      {clinic.phone}
                    </a>
                  ) : (
                    <span className="font-semibold text-slate-500">Chưa cập nhật số điện thoại</span>
                  )}
                  {clinic.email ? (
                    <a href={`mailto:${clinic.email}`} className="font-medium text-slate-600 hover:text-[#0058bc]">
                      {clinic.email}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href={ROUTES.appointment}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0058bc] px-5 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#004494]"
            >
              Đặt lịch khám tại cơ sở này
            </Link>
          </div>
        </div>

        <div className="relative min-h-[360px] overflow-hidden rounded-2xl border border-slate-200 shadow-inner lg:col-span-7">
          {hasAddress ? (
            <>
              <iframe
                title={`Bản đồ vị trí ${clinic.name || "phòng khám"}`}
                src={mapEmbedUrl}
                className="h-full min-h-[380px] w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="pointer-events-none absolute left-4 right-4 top-4 flex items-center justify-between">
                <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/95 px-3 py-2 text-xs font-bold text-slate-800 shadow-md backdrop-blur">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-[#0058bc]" />
                  <span>{clinic.name || "Phòng khám"}</span>
                </div>
                <a
                  href={mapDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto rounded-xl bg-slate-900/90 px-3 py-2 text-xs font-bold text-white shadow-md backdrop-blur transition hover:bg-slate-900"
                >
                  Chỉ đường &rarr;
                </a>
              </div>
            </>
          ) : (
            <div className="grid h-full min-h-[380px] place-items-center bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
              Chưa có địa chỉ để hiển thị bản đồ.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
