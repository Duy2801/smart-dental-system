"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PatientPageSkeleton } from "@/features/dashboard/common/PatientSkeleton";
import { getDoctors, getDoctorBullets, type HomeDoctorCard } from "@/features/dashboard/home/api";
import { getPatientServices } from "@/features/dashboard/service/api";
import { EmptySearchResult } from "@/features/dashboard/common/EmptySearchResult";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isDoctorRelatedToService(doctor: HomeDoctorCard, serviceText: string) {
  const haystack = normalizeText(
    [
      doctor.name,
      doctor.specialization,
      doctor.position,
      doctor.workplace,
      doctor.bio,
    ].join(" "),
  );
  const service = normalizeText(serviceText);

  const keywordGroups = [
    ["chinh nha", "nieng rang", "invisalign", "rang tre em"],
    ["implant", "cay ghep", "phuc hinh", "rang su"],
    ["tay trang", "tham my", "veneer", "cuoi"],
    ["noi nha", "tuy", "dieu tri tuy", "root"],
    ["tong quat", "kham", "cao voi", "ve sinh", "nha chu"],
    ["tieu phau", "nho rang", "rang khon", "phau thuat"],
  ];

  const directWords = service.split(/\s+/).filter((word) => word.length > 3);
  if (directWords.some((word) => haystack.includes(word))) return true;

  const matchedGroup = keywordGroups.find((group) =>
    group.some((keyword) => service.includes(keyword)),
  );

  return matchedGroup
    ? matchedGroup.some((keyword) => haystack.includes(keyword))
    : false;
}

function DoctorCard({ doctor }: { doctor: HomeDoctorCard }) {
  const bullets = (
    doctor.bullets && doctor.bullets.length > 0
      ? doctor.bullets
      : getDoctorBullets(doctor)
  ).slice(0, 5);

  return (
    <article className="relative overflow-hidden transition-all duration-300 rounded-[28px] bg-white border border-slate-100/90 shadow-[0_18px_45px_rgba(15,23,42,0.06)] h-[480px] sm:h-[500px] lg:h-[520px] flex flex-col justify-between">
      <div className="relative h-full p-7 sm:p-9 lg:p-10 grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6 items-stretch">
        {/* Left text & content container */}
        <div className="z-10 flex flex-col justify-between h-full min-w-0">
          <div>
            <p className="text-[13px] sm:text-[14px] font-semibold text-[#3b4c7c] tracking-wide mb-1">
              Bác sĩ
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-[#1f2b56] tracking-tight leading-tight mb-4 line-clamp-1">
              {doctor.name}
            </h3>

            <ul className="space-y-2 lg:space-y-2.5 text-[13px] sm:text-[13.5px] text-slate-700 leading-relaxed font-normal overflow-hidden">
              {bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-800" />
                  <span className="line-clamp-2">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-3">
            <Link
              href={`/doctor/${doctor.id}`}
              className="inline-flex items-center justify-center rounded-full bg-[#ecf3fe] px-7 py-2.5 text-xs sm:text-sm font-semibold text-[#2563eb] transition duration-200 hover:bg-[#deebff] hover:text-[#1d4ed8]"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>

        {/* Right graphic motif & doctor image cutout */}
        <div className="relative h-full flex items-end justify-center lg:justify-end overflow-hidden">
          {/* Circular soft blue background shape */}
          <div className="absolute bottom-2 right-4 sm:right-6 w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full bg-[#d0e2fe] z-0 pointer-events-none" />

          {/* Doctor cutout portrait */}
          <div className="relative z-10 h-[250px] sm:h-[300px] lg:h-[350px] w-auto max-w-full flex items-end">
            <img
              src={doctor.avatarUrl || "/doctor/pham_thi_ha_xuyen.png"}
              alt={doctor.name}
              className="h-full w-auto object-contain object-bottom drop-shadow-md"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function DoctorsPageContent() {
  const searchParams = useSearchParams();
  const keywordFromUrl = searchParams.get("keyword") || "";
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [doctorName, setDoctorName] = useState(keywordFromUrl);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [searched, setSearched] = useState(true);

  useEffect(() => {
    if (keywordFromUrl) {
      setDoctorName(keywordFromUrl);
      setSearched(true);
    }
  }, [keywordFromUrl]);

  const doctorsQuery = useQuery({
    queryKey: ["patient", "doctors"],
    queryFn: getDoctors,
  });
  const servicesQuery = useQuery({
    queryKey: ["patient", "doctor-search-services"],
    queryFn: getPatientServices,
  });

  const doctors = useMemo(() => doctorsQuery.data ?? [], [doctorsQuery.data]);
  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);
  const selectedService = services.find((service) => service.id === selectedServiceId);

  const relatedDoctors = useMemo(() => {
    if (!selectedService) return [];

    const serviceText = [
      selectedService.title,
      selectedService.name,
      selectedService.category,
      selectedService.shortDescription,
      selectedService.description,
    ].join(" ");
    const matches = doctors.filter((doctor) =>
      isDoctorRelatedToService(doctor, serviceText),
    );

    return matches.length ? matches : doctors;
  }, [doctors, selectedService]);

  const visibleDoctors = useMemo(() => {
    if (!searched) return [];

    const keyword = normalizeText(doctorName.trim());
    const pool = selectedService ? relatedDoctors : doctors;

    return pool.filter((doctor) => {
      const matchesSelectedDoctor =
        !selectedDoctorId || doctor.id === selectedDoctorId;
      const matchesKeyword =
        !keyword ||
        normalizeText(
          [
            doctor.name,
            doctor.specialization,
            doctor.position,
            doctor.doctorCode,
          ].join(" "),
        ).includes(keyword);

      return matchesSelectedDoctor && matchesKeyword;
    });
  }, [doctorName, doctors, relatedDoctors, searched, selectedDoctorId, selectedService]);

  if (doctorsQuery.isLoading || servicesQuery.isLoading) {
    return <PatientPageSkeleton />;
  }

  return (
    <main className="mx-auto w-full max-w-[1360px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-56 bg-slate-100 sm:h-64 lg:h-[360px]">
          <Image
            src="/dsbacsi.png"
            alt="Đội ngũ bác sĩ"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        <div className="px-6 py-8 sm:px-8 lg:px-10">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/home" className="font-semibold hover:text-[#0058bc]">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="font-semibold text-[#0058bc]">Bác sĩ</span>
          </nav>

          <section className="mt-8">
            <h1 className="max-w-4xl text-3xl font-extrabold leading-tight text-[#354a8a] sm:text-4xl">
              Đội ngũ bác sĩ răng hàm mặt giàu kinh nghiệm
            </h1>
            <p className="mt-4 max-w-5xl text-base leading-7 text-slate-700">
              Chọn dịch vụ bạn quan tâm, hệ thống sẽ gợi ý các bác sĩ phù hợp.
              Bạn cũng có thể nhập tên bác sĩ để tìm nhanh hơn.
            </p>
          </section>

          <section className="mx-auto mt-12 max-w-4xl">
            <div className="grid gap-6">
              <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
                <label className="text-base font-bold text-[#354a8a]">
                  Dịch vụ
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(event) => {
                    setSelectedServiceId(event.target.value);
                    setSelectedDoctorId("");
                    setSearched(false);
                  }}
                  className="h-14 w-full rounded-full border border-slate-200 bg-white px-5 text-base outline-none transition focus:border-blue-300"
                >
                  <option value="">Chọn dịch vụ</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
                <label className="text-base font-bold text-[#354a8a]">
                  Tên bác sĩ
                </label>
                <input
                  value={doctorName}
                  onChange={(event) => {
                    setDoctorName(event.target.value);
                    setSearched(false);
                  }}
                  className="h-14 w-full rounded-full border border-slate-200 bg-white px-5 text-base outline-none transition focus:border-blue-300"
                  placeholder="Nhập tên bác sĩ"
                />
              </div>

              {selectedService ? (
                <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
                  <label className="text-base font-bold text-[#354a8a]">
                    Bác sĩ phù hợp
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(event) => {
                      setSelectedDoctorId(event.target.value);
                      setSearched(false);
                    }}
                    className="h-14 w-full rounded-full border border-slate-200 bg-white px-5 text-base outline-none transition focus:border-blue-300"
                  >
                    <option value="">Tất cả bác sĩ liên quan</option>
                    {relatedDoctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialization}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setSearched(true)}
                  className="inline-flex min-w-[240px] items-center justify-center rounded-full bg-gradient-to-r from-[#3f658f] to-[#433f92] px-8 py-4 text-base font-bold text-white transition hover:shadow-lg"
                >
                  Tìm bác sĩ
                </button>
              </div>
            </div>
          </section>
        </div>
      </section>

      {searched ? (
        <section id="doctor-results" className="mt-8">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0058bc]">
                Kết quả tìm kiếm
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-950">
                Tìm thấy {visibleDoctors.length} bác sĩ
              </h2>
            </div>
            <Link href="/appointment" className="text-sm font-bold text-[#0058bc]">
              Đặt lịch khám
            </Link>
          </div>

          {visibleDoctors.length ? (
            <div className="grid gap-8 xl:grid-cols-2">
              {visibleDoctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
          ) : (
            <EmptySearchResult
              title="Không tìm thấy dịch vụ hoặc bác sĩ"
              description="Hãy thử tìm kiếm từ khóa dịch vụ, phương pháp điều trị hoặc tên bác sĩ khác"
              onReset={() => {
                setDoctorName("");
                setSelectedServiceId("");
                setSelectedDoctorId("");
              }}
            />
          )}
        </section>
      ) : null}
    </main>
  );
}

export default function DoctorsPage() {
  return (
    <Suspense fallback={<PatientPageSkeleton />}>
      <DoctorsPageContent />
    </Suspense>
  );
}

