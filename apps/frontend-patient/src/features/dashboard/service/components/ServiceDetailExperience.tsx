"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardIcon } from "../../common/DashboardIcon";
import { usePatientServiceDetailQuery } from "../hooks";
import { formatServicePrice } from "../api";
import {
  hasItems,
  minutesLabel,
  normalizeServiceIcon,
} from "../service-detail-utils";
import {
  BookingPanel,
  EmptyContent,
  SectionHeading,
  ServiceDetailLoadingState,
  ServiceDetailNotFound,
} from "./ServiceDetailShared";
import { ServiceDetailHero } from "./ServiceDetailHero";
import { T } from "../../common/typography";

export function ServiceDetailExperience({ serviceId }: { serviceId: string }) {
  const searchParams = useSearchParams();
  const methodIdFromUrl = searchParams.get("method");
  const { data: service = null, isLoading } =
    usePatientServiceDetailQuery(serviceId);

  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const treatmentMethods = service?.treatmentMethods ?? [];

  if (isLoading) return <ServiceDetailLoadingState />;

  if (!service) return <ServiceDetailNotFound />;

  const activeMethod =
    treatmentMethods.find((m) => m.id === selectedMethodId) ||
    treatmentMethods.find((m) => m.id === methodIdFromUrl) ||
    treatmentMethods[0] ||
    null;

  const stepsToDisplay =
    activeMethod?.procedureSteps && activeMethod.procedureSteps.length > 0
      ? activeMethod.procedureSteps
      : service.procedureSteps;

  const faqsToDisplay =
    activeMethod?.faqs && activeMethod.faqs.length > 0
      ? activeMethod.faqs
      : service.faqs;

  const gallery =
    activeMethod?.media && activeMethod.media.length > 0
      ? activeMethod.media
      : service.media;

  const hasOverviewContent =
    Boolean(service.detailSummary || service.description) ||
    hasItems(service.suitableFor) ||
    hasItems(service.includedItems);

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8">
      <ServiceDetailHero service={service} activeMethod={activeMethod} />

      {hasItems(treatmentMethods) ? (
        <section className="mt-7 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 p-6 shadow-sm sm:p-8">
          <SectionHeading
            eyebrow="Tùy chọn & Phương pháp"
            title="Các phương pháp điều trị"
            description="Lựa chọn phương pháp điều trị phù hợp với nhu cầu và ngân sách của bạn."
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {treatmentMethods.map((method) => {
              const isSelected = activeMethod?.id === method.id;
              return (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethodId(method.id)}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${isSelected
                    ? "border-[#0863c5] bg-white shadow-md ring-2 ring-[#0863c5]/20"
                    : "border-slate-200 bg-white/80 hover:border-blue-300 hover:bg-white"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0863c5]">
                      {method.durationMinutes ? minutesLabel(method.durationMinutes) : "Tư vấn kỹ"}
                    </span>
                    {isSelected && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0863c5] text-[10px] font-extrabold text-white">
                        ✓
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-extrabold text-slate-950">
                    {method.name}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-slate-500 line-clamp-3">
                    {method.description || "Chi tiết phương pháp điều trị chuyên sâu."}
                  </p>
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <span className={`${T.caption} text-slate-400`}>Chi phí:</span>
                    <p className="text-lg font-extrabold text-[#0863c5]">
                      {formatServicePrice(method.basePrice)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {hasItems(service.highlights) ? (
        <section className="mt-7 grid gap-4 md:grid-cols-3">
          {service.highlights.map((item) => (
            <article
              key={`${item.title}-${item.description}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-[#0863c5]">
                <DashboardIcon name={normalizeServiceIcon(item.icon)} className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-base font-extrabold text-slate-950">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.description}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      <div className="mt-7 grid items-start gap-7 lg:grid-cols-[1fr_380px]">
        <div className="space-y-7">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <SectionHeading
              eyebrow="Tổng quan"
              title={`Vì sao nên chọn ${service.title}?`}
              description="Nội dung trong phần này được lấy từ dữ liệu quản trị dịch vụ."
            />
            {hasOverviewContent ? (
              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.85fr]">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950">
                    Dịch vụ phù hợp với ai?
                  </h3>
                  {hasItems(service.suitableFor) ? (
                    <ul className="mt-4 space-y-3">
                      {service.suitableFor.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm leading-6 text-slate-600"
                        >
                          <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-50 text-[10px] font-bold text-[#0863c5]">
                            ✓
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-4">
                      <EmptyContent label="Đối tượng phù hợp" />
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <h3 className="text-sm font-extrabold text-slate-950">
                    Bao gồm trong buổi hẹn
                  </h3>
                  {hasItems(service.includedItems) ? (
                    <ul className="mt-4 space-y-3">
                      {service.includedItems.map((item) => (
                        <li
                          key={item}
                          className="flex gap-2 text-xs leading-5 text-slate-600"
                        >
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0863c5]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-4">
                      <EmptyContent label="Quyền lợi buổi hẹn" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-6">
                <EmptyContent label="Tổng quan dịch vụ" />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <SectionHeading
              eyebrow="Quy trình"
              title={`Các bước thực hiện${activeMethod ? ` (${activeMethod.name})` : ""}`}
              description="Quy trình được quản trị từ dữ liệu dịch vụ và phương pháp điều trị."
            />
            {hasItems(stepsToDisplay) ? (
              <div className="mt-7 space-y-5">
                {stepsToDisplay.map((step) => (
                  <article key={step.id} className="grid gap-4 sm:grid-cols-[56px_1fr]">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0863c5] text-sm font-extrabold text-white">
                      {step.stepOrder}
                    </span>
                    <div className="border-b border-slate-100 pb-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-extrabold text-slate-950">
                          {step.title}
                        </h3>
                        {step.durationMinutes ? (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-[#0863c5]">
                            {minutesLabel(step.durationMinutes)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {step.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6">
                <EmptyContent label="Quy trình điều trị" />
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6 sm:p-8">
              <SectionHeading
                eyebrow="Chi phí"
                title="Bảng thông tin dịch vụ"
                description={service.pricingNote || undefined}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-extrabold">Hạng mục</th>
                    <th className="px-6 py-4 font-extrabold">Thông tin</th>
                    <th className="px-6 py-4 font-extrabold">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-6 py-4 font-bold text-slate-950">
                      Dịch vụ
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {service.title}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      Theo danh mục {service.category}
                    </td>
                  </tr>
                  {activeMethod && (
                    <tr>
                      <td className="px-6 py-4 font-bold text-slate-950">
                        Phương pháp chọn
                      </td>
                      <td className="px-6 py-4 font-bold text-[#0863c5]">
                        {activeMethod.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {activeMethod.description}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="px-6 py-4 font-bold text-slate-950">
                      Chi phí
                    </td>
                    <td className="px-6 py-4 text-lg font-extrabold text-[#0863c5]">
                      {activeMethod ? formatServicePrice(activeMethod.basePrice) : service.price}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {service.pricingNote || "Chưa cập nhật ghi chú giá"}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-bold text-slate-950">
                      Thời lượng
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {minutesLabel(activeMethod?.durationMinutes || service.durationMinutes)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      Hệ thống tự lọc khung giờ phù hợp khi đặt lịch
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeading eyebrow="Trước buổi hẹn" title="Chuẩn bị" />
              {hasItems(service.preparationNotes) ? (
                <ul className="mt-5 space-y-3">
                  {service.preparationNotes.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0863c5]" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5">
                  <EmptyContent label="Nội dung chuẩn bị" />
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeading eyebrow="Sau điều trị" title="Chăm sóc" />
              {hasItems(service.aftercareNotes) ? (
                <ul className="mt-5 space-y-3">
                  {service.aftercareNotes.map((item) => (
                    <li key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5">
                  <EmptyContent label="Nội dung chăm sóc sau điều trị" />
                </div>
              )}
            </article>
          </section>

          {hasItems(service.importantNotes) ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-950">
                <DashboardIcon name="shield" className="h-5 w-5 text-amber-600" />
                Lưu ý quan trọng
              </h2>
              <ul className="mt-4 grid gap-3 md:grid-cols-2">
                {service.importantNotes.map((item) => (
                  <li key={item} className="text-sm leading-6 text-slate-700">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {hasItems(gallery) ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <SectionHeading
                eyebrow="Hình ảnh"
                title="Hình ảnh dịch vụ"
                description="Hình ảnh được lấy từ thư viện dịch vụ trong hệ thống quản trị."
              />
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {gallery.map((media) => (
                  <figure
                    key={media.id}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                  >
                    <img
                      src={media.url}
                      alt={media.alt || service.title}
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <figcaption className={`p-3 ${T.caption}`}>
                      {media.alt || service.title}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <SectionHeading
              eyebrow="FAQ"
              title="Câu hỏi thường gặp"
              description="FAQ được lấy từ dữ liệu quản trị dịch vụ."
            />
            {hasItems(faqsToDisplay) ? (
              <div className="mt-5 divide-y divide-slate-100">
                {faqsToDisplay.map((faq) => (
                  <details key={faq.id} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-extrabold text-slate-950">
                      {faq.question}
                      <DashboardIcon
                        name="chevron"
                        className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90"
                      />
                    </summary>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyContent label="FAQ" />
              </div>
            )}
          </section>

          <section className="rounded-[28px] bg-slate-950 p-6 text-white shadow-sm sm:p-8">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className={`${T.overline} text-blue-200`}>
                  Sẵn sàng bắt đầu?
                </p>
                <h2 className="mt-2 text-2xl font-extrabold">
                  Đặt lịch {service.title} với bác sĩ phù hợp
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Khi bấm đặt lịch, hệ thống chuyển sang trang lịch hẹn và chọn
                  sẵn dịch vụ này cho bạn.
                </p>
              </div>
              <Link
                href={`/appointment?service=${service.id}${activeMethod ? `&treatmentMethod=${activeMethod.id}` : ""}&intent=booking`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-extrabold text-[#0863c5] transition hover:bg-blue-50"
              >
                Đặt dịch vụ ngay
                <DashboardIcon name="arrow" className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>

        <BookingPanel service={service} activeMethod={activeMethod} />
      </div>
    </main>
  );
}
