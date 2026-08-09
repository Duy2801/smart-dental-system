"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { DashboardIcon } from "../common/DashboardIcon";
import { getDoctorDetail, type DoctorDetail } from "../home/api";
import { ROUTES, buildRoute } from "../common/routes";
import { T } from "../common/typography";

function formatDate(value?: string | null) {
  if (!value) return "Đang cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function DoctorHeroImage({ doctor }: { doctor: DoctorDetail }) {
  if (doctor.avatarUrl) {
    return (
      <img
        src={doctor.avatarUrl}
        alt={doctor.name}
        className="h-full min-h-[420px] w-full object-cover object-top"
      />
    );
  }

  const initials = doctor.name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative grid min-h-[420px] place-items-center bg-gradient-to-br from-[#0058bc] to-[#00b8d9]">
      <DashboardIcon
        name="user"
        className="absolute bottom-0 h-80 w-80 text-white/15"
      />
      <span className="relative grid h-28 w-28 place-items-center rounded-full border-2 border-white/30 bg-white/15 text-3xl font-extrabold text-white backdrop-blur">
        {initials || "BS"}
      </span>
    </div>
  );
}

function ContactPanel({ doctor }: { doctor: DoctorDetail }) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">
          <DashboardIcon name="calendar" className="h-5 w-5 text-[#0058bc]" />
          Đặt lịch khám với bác sĩ
        </h2>
        <p className={`mt-2 ${T.bodySm}`}>
          Hệ thống tự động ưu tiên chọn {doctor.name} làm bác sĩ điều trị chính khi bạn đăng ký.
        </p>
        <Link
          href={buildRoute.appointmentBooking()}
          className="mt-4 block rounded-xl bg-[#0058bc] px-5 py-3.5 text-center text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#004ca3]"
        >
          Đặt lịch khám ngay
        </Link>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-100 text-xs font-bold text-[#0058bc]">
            {doctor.avatarUrl ? (
              <img
                src={doctor.avatarUrl}
                alt={doctor.name}
                className="h-full w-full object-cover"
              />
            ) : (
              "BS"
            )}
            <i className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Tư vấn trực tuyến 1:1
            </h2>
            <p className="text-xs text-slate-500">
              Kết nối trực tiếp qua video call
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Đăng ký lịch tư vấn trực tuyến từ xa với bác sĩ để nhận chẩn đoán sơ bộ và phương án điều trị.
        </p>
        <Link
          href="/consultation"
          className="block w-full rounded-xl border border-blue-200 bg-blue-50/60 py-2.5 text-center text-xs font-bold text-[#0058bc] transition hover:bg-blue-100"
        >
          Đăng ký tư vấn Telehealth
        </Link>
      </section>
    </aside>
  );
}

function LoadingState() {
  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8">
      <div className="h-[520px] animate-pulse rounded-3xl bg-slate-100" />
      <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-56 animate-pulse rounded-2xl bg-slate-100" />
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </main>
  );
}

export function DoctorDetailExperience({ doctorId }: { doctorId: string }) {
  const { data: doctor = null, isLoading: loading } = useQuery({
    queryKey: ["patient", "doctor-detail", doctorId],
    queryFn: () => getDoctorDetail(doctorId),
    enabled: Boolean(doctorId),
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const visibleMedia = useMemo(() => doctor?.media.slice(0, 4) ?? [], [doctor]);

  if (loading) return <LoadingState />;

  if (!doctor) {
    return (
      <main className="mx-auto grid min-h-[60vh] w-full max-w-[960px] place-items-center px-4 py-10 text-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Không tìm thấy bác sĩ
          </h1>
          <p className={`mt-2 ${T.body}`}>
            Hồ sơ bác sĩ có thể đã ngừng hoạt động hoặc chưa được công khai.
          </p>
          <Link
            href={ROUTES.home}
            className="mt-5 inline-flex rounded-xl bg-[#0058bc] px-5 py-3 text-sm font-bold text-white"
          >
            Về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 lg:px-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <Link href={ROUTES.home} className="hover:text-[#0058bc]">
          Trang chủ
        </Link>
        <span>/</span>
        <span>Đội ngũ bác sĩ</span>
        <span>/</span>
        <span className="font-semibold text-slate-800">{doctor.name}</span>
      </nav>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[390px_1fr]">
          <div className="relative overflow-hidden">
            <DoctorHeroImage doctor={doctor} />
            <div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/25 bg-slate-950/35 p-4 text-white backdrop-blur">
              <p className="text-xs text-white/70">Nơi công tác</p>
              <p className="mt-1 text-sm font-bold">{doctor.workplace}</p>
            </div>
          </div>

          <div className="p-7 sm:p-10">
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#0058bc]">
              {doctor.specialization}
            </span>
            <h1 className="mt-5 text-3xl font-extrabold text-[#0058bc] sm:text-4xl">
              {doctor.name}
            </h1>
            <p className="mt-3 text-base text-slate-600">
              <strong className="text-slate-900">Chức vụ:</strong>{" "}
              {doctor.position}
            </p>
            <p className={`mt-5 max-w-3xl ${T.body}`} style={{ lineHeight: "1.75rem" }}>
              {doctor.bio}
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-blue-50 p-4">
                <strong className="text-2xl text-[#0058bc]">
                  {doctor.yearsExperience}
                </strong>
                <p className={`mt-1 ${T.caption}`}>Năm kinh nghiệm</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4">
                <strong className="text-2xl text-emerald-600">
                  {doctor.educations.length}
                </strong>
                <p className={`mt-1 ${T.caption}`}>Bằng cấp</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4">
                <strong className="text-2xl text-amber-500">
                  {doctor.averageRating ? `★ ${doctor.averageRating}` : "Mới"}
                </strong>
                <p className={`mt-1 ${T.caption}`}>
                  {doctor.reviews.length} đánh giá
                </p>
              </div>
              <div className="rounded-2xl bg-violet-50 p-4">
                <strong className="text-2xl text-violet-600">
                  {doctor.certificates.length}
                </strong>
                <p className={`mt-1 ${T.caption}`}>Chứng chỉ</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={buildRoute.appointmentBooking()}
                className="rounded-xl bg-[#0058bc] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200"
              >
                Đặt lịch hẹn
              </Link>
              <a
                href="#doctor-chat"
                className="rounded-xl border border-[#0058bc] px-5 py-3 text-sm font-bold text-[#0058bc]"
              >
                Trao đổi với bác sĩ
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-7 grid items-start gap-7 lg:grid-cols-[1fr_380px]">
        <div className="space-y-7">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className={T.sectionTitle}>Học vấn và bằng cấp</h2>
            <div className="mt-6 space-y-4">
              {doctor.educations.map((education, index) => (
                <article key={education.id} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0058bc] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="border-b border-slate-100 pb-4">
                    <h3 className="font-bold text-slate-900">
                      {education.degree}
                    </h3>
                    <p className="mt-1 text-sm text-[#0058bc]">
                      {education.school}
                      {education.graduationYear
                        ? ` · ${education.graduationYear}`
                        : ""}
                    </p>
                    {education.description ? (
                      <p className={`mt-2 ${T.body}`}>
                        {education.description}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className={T.sectionTitle}>Chứng chỉ chuyên môn</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {doctor.certificates.map((certificate) => (
                <article
                  key={certificate.id}
                  className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                >
                  {certificate.imageUrl ? (
                    <img
                      src={certificate.imageUrl}
                      alt={certificate.title}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  ) : null}
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900">
                      {certificate.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-[#0058bc]">
                      {certificate.issuer} · {formatDate(certificate.issuedAt)}
                    </p>
                    {certificate.description ? (
                      <p className={`mt-2 ${T.bodySm}`}>
                        {certificate.description}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          {visibleMedia.length ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className={T.sectionTitle}>Hình ảnh minh chứng</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {visibleMedia.map((media) => (
                  <figure
                    key={media.id}
                    className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50"
                  >
                    <img
                      src={media.url}
                      alt={media.alt || doctor.name}
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <figcaption className={`p-3 ${T.caption}`}>
                      {media.alt || "Hình ảnh hồ sơ bác sĩ"}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className={T.sectionTitle}>Đánh giá từ bệnh nhân</h2>
            {doctor.reviews.length ? (
              <div className="mt-6 space-y-4">
                {doctor.reviews.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          {review.patient?.user?.fullName || "Bệnh nhân ẩn danh"}
                        </h3>
                        <p className={`${T.bodySm}`}>
                          {review.appointment?.service?.name || "Khám & Điều trị nha khoa"}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                        ★ {review.rating}
                      </span>
                    </div>
                    {review.comment ? (
                      <p className={`mt-3 ${T.body}`}>{review.comment}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <p className={`mt-4 ${T.body}`}>
                Bác sĩ chưa có đánh giá công khai.
              </p>
            )}
          </section>
        </div>

        <div id="doctor-chat">
          <ContactPanel doctor={doctor} />
        </div>
      </div>
    </main>
  );
}
