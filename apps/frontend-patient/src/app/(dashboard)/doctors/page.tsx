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
import { DashboardIcon } from "@/features/dashboard/common/DashboardIcon";

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

  return (
    <main className="mx-auto w-full max-w-[1360px] space-y-8 px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
      {/* Intro Header Section (Left-aligned) */}
      <section className="py-2 space-y-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0058bc]">
            <DashboardIcon name="sparkles" className="h-3.5 w-3.5 text-[#0058bc]" />
            Đội Ngũ Chuyên Gia
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Đội Ngũ Bác Sĩ Răng Hàm Mặt
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          Chọn dịch vụ bạn quan tâm hoặc tìm kiếm theo tên bác sĩ để tham khảo thông tin chi tiết và đặt lịch khám cùng các chuyên gia hàng đầu.
        </p>
      </section>

      {/* Hero Banner Image Section */}
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-[#eef2f6] shadow-xs">
        <div className="relative w-full flex items-center justify-center p-2 sm:p-3">
          <img
            src="/dsbacsi.png"
            alt="Đội ngũ bác sĩ Smart Dental"
            className="w-full h-auto max-h-[340px] sm:max-h-[400px] object-contain rounded-2xl"
          />
        </div>
      </section>

      {/* Search & Filter Control Bar */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-end">
          {/* Service Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dịch vụ nha khoa
            </label>
            <select
              value={selectedServiceId}
              onChange={(event) => {
                setSelectedServiceId(event.target.value);
                setSelectedDoctorId("");
                setSearched(true);
              }}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-semibold text-slate-800 outline-none ring-2 ring-transparent focus:border-[#0058bc] focus:bg-white focus:ring-blue-100 transition cursor-pointer"
            >
              <option value="">Tất cả dịch vụ</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tên bác sĩ
            </label>
            <div className="relative flex items-center">
              <DashboardIcon
                name="search"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={doctorName}
                onChange={(event) => {
                  setDoctorName(event.target.value);
                  setSearched(true);
                }}
                placeholder="Nhập tên bác sĩ cần tìm..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-11 pr-8 text-sm font-semibold text-slate-800 outline-none ring-2 ring-transparent focus:border-[#0058bc] focus:bg-white focus:ring-blue-100 transition"
              />
              {doctorName && (
                <button
                  type="button"
                  onClick={() => {
                    setDoctorName("");
                    setSearched(true);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                >
                  Xóa
                </button>
              )}
            </div>
          </div>

          {/* Related Doctor Dropdown if service selected */}
          {selectedService ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Bác sĩ phù hợp
              </label>
              <select
                value={selectedDoctorId}
                onChange={(event) => {
                  setSelectedDoctorId(event.target.value);
                  setSearched(true);
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-semibold text-slate-800 outline-none ring-2 ring-transparent focus:border-[#0058bc] focus:bg-white focus:ring-blue-100 transition cursor-pointer"
              >
                <option value="">Tất cả bác sĩ liên quan</option>
                {relatedDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setSearched(true)}
                className="h-12 w-full rounded-2xl bg-[#0058bc] text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:bg-[#004bb0] active:scale-95 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <DashboardIcon name="search" className="h-4 w-4" />
                <span>Tìm bác sĩ</span>
              </button>
            </div>
          )}
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

          {doctorsQuery.isLoading || servicesQuery.isLoading ? (
            <div className="grid gap-8 xl:grid-cols-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[480px] rounded-[28px] bg-slate-100 border border-slate-200/60 animate-pulse"
                />
              ))}
            </div>
          ) : visibleDoctors.length ? (
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

