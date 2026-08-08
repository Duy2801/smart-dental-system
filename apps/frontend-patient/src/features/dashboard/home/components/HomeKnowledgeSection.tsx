"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DashboardIcon, type DashboardIconName } from "../../common/DashboardIcon";
import { ROUTES, buildRoute } from "../../common/routes";
import { T } from "../../common/typography";
import type {
  getLiveClinicConfigInfo,
  HomeServiceCard,
} from "../api";
import {
  useClinicConfigQuery,
  useHomeServicesQuery,
} from "../hooks/useHomeQueries";

type BusinessHour = {
  id: number;
  label: string;
  isOpen: boolean;
  start: string;
  end: string;
};

type FaqItem = {
  id: string;
  badge: string;
  icon: DashboardIconName;
  question: string;
  answer: string;
  href: string;
};

function formatOpenHours(hours: BusinessHour[] = []) {
  const openHours = hours.filter((day) => day.isOpen);

  if (!openHours.length) return "Phòng khám chưa cấu hình lịch làm việc.";

  return openHours
    .map((day) => `${day.label} ${day.start} - ${day.end}`)
    .join(", ");
}

function buildServiceFaqs(services: HomeServiceCard[]): FaqItem[] {
  return services.slice(0, 4).map((service, index) => {
    const questions = [
      `Dịch vụ ${service.title} mất bao lâu?`,
      `${service.title} có chi phí từ bao nhiêu?`,
      `Khi nào nên đặt lịch ${service.title}?`,
      `${service.title} có cần tư vấn trước không?`,
    ];
    const answers = [
      `Thời gian dự kiến khoảng ${service.durationMinutes} phút, tùy tình trạng răng miệng thực tế khi bác sĩ thăm khám.`,
      `Chi phí tham khảo từ ${service.price} đ. Mức cuối cùng sẽ được xác nhận sau khi bác sĩ đánh giá tình trạng cụ thể.`,
      service.description,
      "Bạn nên đặt lịch trước để phòng khám chuẩn bị khung giờ phù hợp và tư vấn đúng nhu cầu điều trị.",
    ];

    return {
      id: `service-${service.id}`,
      badge: service.title,
      icon: index % 2 === 0 ? "braces" : "sparkles",
      question: questions[index % questions.length],
      answer: answers[index % answers.length],
      href: buildRoute.appointmentWithService(service.id),
    };
  });
}

function buildClinicFaqs(
  clinic: Awaited<ReturnType<typeof getLiveClinicConfigInfo>> | undefined,
): FaqItem[] {
  return [
    {
      id: "clinic-hours",
      badge: "Giờ làm việc",
      icon: "clock",
      question: "Phòng khám làm việc vào những khung giờ nào?",
      answer: formatOpenHours(clinic?.businessHours),
      href: ROUTES.appointment,
    },
    {
      id: "clinic-contact",
      badge: "Tư vấn nhanh",
      icon: "chat",
      question: "Tôi có thể liên hệ phòng khám bằng cách nào?",
      answer: clinic?.phone
        ? `Bạn có thể gọi hotline ${clinic.phone}${clinic.email ? ` hoặc gửi email đến ${clinic.email}` : ""}.`
        : "Phòng khám chưa cập nhật hotline trong cấu hình hệ thống.",
      href: ROUTES.appointment,
    },
  ];
}

function FaqSkeleton() {
  return (
    <section className="space-y-8">
      <div className="mx-auto space-y-3 text-center">
        <div className="mx-auto h-4 w-44 animate-pulse rounded-full bg-slate-200" />
        <div className="mx-auto h-10 w-80 max-w-full animate-pulse rounded-xl bg-slate-200" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-2xl bg-slate-200"
          />
        ))}
      </div>
    </section>
  );
}

function FaqCard({ item }: { item: FaqItem }) {
  return (
    <Link
      href={item.href}
      className="group flex min-h-[220px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,.05)] transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_20px_48px_rgba(15,23,42,.08)]"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-extrabold text-[#0058bc]">
            <DashboardIcon name={item.icon} className="h-3.5 w-3.5" />
            FAQ
          </span>
          <span className="max-w-[58%] truncate rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-extrabold text-slate-600">
            {item.badge}
          </span>
        </div>

        <h3 className={`mt-5 line-clamp-2 ${T.cardTitleLg}`}>
          {item.question}
        </h3>
        <p className={`mt-3 line-clamp-3 ${T.body}`}>
          {item.answer}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className={T.linkCta}>
          Đặt lịch tư vấn
        </span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0058bc] text-white shadow-lg shadow-blue-500/20 transition group-hover:translate-x-1">
          <DashboardIcon name="arrow" className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export function HomeKnowledgeSection() {
  const {
    data: services = [],
    isLoading: loadingServices,
    isError: servicesError,
  } = useHomeServicesQuery();

  const { data: clinic, isLoading: loadingClinic } = useClinicConfigQuery();

  const faqItems = useMemo(
    () => [...buildServiceFaqs(services)],
    [clinic, services],
  );

  if (loadingServices || loadingClinic) {
    return <FaqSkeleton />;
  }

  return (
    <section id="blog" className="space-y-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className={T.overline}>
          Hỏi đáp nha khoa
        </p>
        <h2 className={`mt-3 ${T.sectionTitleLg}`}>
          Câu hỏi thường gặp
        </h2>
        <p className={`mx-auto mt-3 max-w-2xl ${T.body}`}>
          Những thắc mắc phổ biến được tổng hợp từ dữ liệu dịch vụ và cấu hình
          thực tế của phòng khám.
        </p>
      </div>

      {servicesError ? (
        <div className="rounded-2xl border border-dashed border-rose-200 bg-white p-8 text-center text-sm font-semibold text-rose-600">
          Không tải được dữ liệu dịch vụ thật từ hệ thống.
        </div>
      ) : faqItems.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {faqItems.map((item) => (
            <FaqCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-500">
          Chưa có dữ liệu để hiển thị câu hỏi thường gặp.
        </div>
      )}

      <div className="flex justify-center">
        <Link
          href={ROUTES.appointment}
          className="inline-flex h-11 items-center gap-2 rounded-full border border-[#0058bc]/20 bg-white px-5 text-sm font-extrabold text-[#0058bc] shadow-sm transition hover:border-[#0058bc] hover:bg-blue-50"
        >
          Đặt lịch hẹn với bác sĩ
        </Link>
      </div>
    </section>
  );
}
