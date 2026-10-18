"use client";

import Link from "next/link";
import { useMemo } from "react";
import { DashboardIcon, type DashboardIconName } from "../../common/DashboardIcon";
import { ROUTES } from "../../common/routes";
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
  cta: string;
};

function formatOpenHours(hours: BusinessHour[] = []) {
  const openHours = hours.filter((day) => day.isOpen);

  if (!openHours.length) return "Phòng khám chưa cấu hình lịch làm việc.";

  return openHours
    .map((day) => `${day.label} ${day.start} - ${day.end}`)
    .join(", ");
}

function buildServiceFaqs(services: HomeServiceCard[]): FaqItem[] {
  const faqsByService: FaqItem[][] = services.map((service, serviceIndex) =>
    service.faqs.map((faq, faqIndex): FaqItem => ({
      id: `service-${service.id}-faq-${faq.id}`,
      badge: service.title,
      icon: (serviceIndex + faqIndex) % 2 === 0 ? "braces" : "sparkles",
      question: faq.question,
      answer: faq.answer,
      href: service.href,
      cta: "Xem dịch vụ",
    })),
  );

  // Lấy xen kẽ từng câu của mỗi dịch vụ để 4 thẻ không bị dồn vào cùng một dịch vụ
  const seededFaqs: FaqItem[] = [];
  const maxFaqs = Math.max(0, ...faqsByService.map((faqs) => faqs.length));
  for (let round = 0; round < maxFaqs && seededFaqs.length < 4; round += 1) {
    for (const faqs of faqsByService) {
      if (faqs[round]) seededFaqs.push(faqs[round]);
      if (seededFaqs.length >= 4) break;
    }
  }

  if (seededFaqs.length) {
    return seededFaqs;
  }

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
      href: ROUTES.consultation,
      cta: "Đặt lịch tư vấn",
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
      href: ROUTES.consultation,
      cta: "Đặt lịch tư vấn",
    },
    {
      id: "clinic-contact",
      badge: "Tư vấn nhanh",
      icon: "chat",
      question: "Tôi có thể liên hệ phòng khám bằng cách nào?",
      answer: clinic?.phone
        ? `Bạn có thể gọi hotline ${clinic.phone}${clinic.email ? ` hoặc gửi email đến ${clinic.email}` : ""}.`
        : "Phòng khám chưa cập nhật hotline trong cấu hình hệ thống.",
      href: ROUTES.consultation,
      cta: "Đặt lịch tư vấn",
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
      className="group flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,.04)] transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_44px_rgba(15,23,42,.08)] sm:p-6"
    >
      <div className="flex flex-1 items-start gap-4 pb-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-[#0058bc] transition group-hover:bg-[#0058bc] group-hover:text-white">
          <DashboardIcon name={item.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-base font-bold leading-snug text-slate-900 sm:text-[17px]">
            {item.question}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
            {item.answer}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0058bc]/60" />
          <span className="truncate">{item.badge}</span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#0058bc]">
          {item.cta}
          <DashboardIcon
            name="arrow"
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          />
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
    () => [...buildServiceFaqs(services), ...buildClinicFaqs(clinic)].slice(0, 4),
    [clinic, services],
  );

  if (loadingServices || loadingClinic) {
    return <FaqSkeleton />;
  }

  return (
    <section id="blog" className="space-y-4 sm:space-y-8">
      <div className="mx-auto max-w-3xl text-center">
        
        <h2 className="text-3xl font-extrabold tracking-tight text-[#07366f] sm:text-4xl">
          Câu hỏi thường gặp
        </h2>
        <p className={`mx-auto mt-1.5 sm:mt-3 max-w-2xl ${T.body}`}>
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
    </section>
  );
}
