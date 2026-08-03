"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/src/lib/utils/cn";
import {
  ArrowLeft,
  FileText,
  SpinnerGap,
  Warning,
  CalendarBlank,
  Pill,
  ArrowUpRight,
  User,
} from "@phosphor-icons/react";
import apiClient from "@/src/lib/api/client";
import {
  genderLabel,
  getDoctorIdFromCookie,
} from "@/src/lib/doctor/session";
import axios from "axios";

type RecordSummary = {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  diagnosis: string | null;
  chiefComplaint: string | null;
  serviceName: string | null;
  scheduledAt: string | null;
  followUpDate: string | null;
  prescriptionCount: number;
  createdAt: string;
};

type PatientBasic = {
  id: string;
  patientCode: string;
  fullName: string;
  phone: string | null;
  gender: string | null;
  age: number | null;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function PatientRecordsPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientBasic | null>(null);
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const doctorId = getDoctorIdFromCookie();

  useEffect(() => {
    if (!id || !isUuid(id)) {
      setError("Mã bệnh nhân không hợp lệ.");
      setLoading(false);
      return;
    }
    if (!doctorId) {
      setError("Không tìm thấy thông tin bác sĩ. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    Promise.all([
      apiClient.get<PatientBasic>(`/patients/${id}?doctorId=${doctorId}`),
      apiClient.get<RecordSummary[]>(
        `/medical-records?doctorId=${doctorId}&patientId=${id}`,
      ),
    ])
      .then(([ptRes, recRes]) => {
        if (!ptRes.data) {
          setError("Không tìm thấy bệnh nhân.");
          return;
        }
        setPatient(ptRes.data);
        setRecords(Array.isArray(recRes.data) ? recRes.data : []);
      })
      .catch((err) => {
        const status = axios.isAxiosError(err) ? err.response?.status : null;
        if (status === 403) {
          setError("Bạn không có quyền xem bệnh nhân này.");
        } else if (status === 404) {
          setError("Không tìm thấy bệnh nhân.");
        } else {
          setError("Không thể tải dữ liệu hồ sơ bệnh nhân.");
        }
      })
      .finally(() => setLoading(false));
  }, [id, doctorId]);

  const initials = patient
    ? patient.fullName
        .split(" ")
        .slice(-2)
        .map((n) => n[0])
        .join("")
    : "";

  return (
    <div className="p-6 md:p-8">
      <Link
        href={`/doctor/patients/${id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-brand-dark"
      >
        <ArrowLeft size={16} />
        Quay lại hồ sơ bệnh nhân
      </Link>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          <Warning size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <SpinnerGap size={32} className="animate-spin text-brand" />
        </div>
      ) : (
        !error && (
          <>
            {patient && (
              <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand/10 text-xl font-bold text-brand">
                  {initials || <User size={22} />}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    {patient.fullName}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {patient.patientCode}
                    </span>
                    <span>{genderLabel(patient.gender)}</span>
                    {patient.age != null && <span>{patient.age} tuổi</span>}
                    {patient.phone && (
                      <span className="font-mono">{patient.phone}</span>
                    )}
                  </div>
                </div>
                <div className="ml-auto">
                  <span className="rounded-full bg-brand/10 px-3 py-1 text-sm font-semibold text-brand">
                    {records.length} hồ sơ
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h2 className="text-base font-semibold text-brand-dark">
                Lịch sử hồ sơ bệnh án
              </h2>

              {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white py-24 shadow-sm">
                  <FileText
                    size={48}
                    className="mb-4 text-slate-300"
                    weight="duotone"
                  />
                  <p className="text-sm text-muted-foreground">
                    Chưa có hồ sơ bệnh án nào
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                  {records.map((r, idx) => (
                    <div
                      key={r.id}
                      className={cn(
                        "flex flex-col gap-3 p-5 transition-colors hover:bg-slate-50/60 sm:flex-row sm:items-center sm:justify-between",
                        idx !== records.length - 1 &&
                          "border-b border-border/50",
                      )}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                            <CalendarBlank size={14} className="text-brand" />
                            {formatDateTime(r.scheduledAt)}
                          </span>
                          {r.serviceName && (
                            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                              {r.serviceName}
                            </span>
                          )}
                        </div>

                        {r.diagnosis && (
                          <p className="font-mono text-sm font-semibold text-brand-dark">
                            {r.diagnosis}
                          </p>
                        )}

                        {r.chiefComplaint && (
                          <p className="text-sm text-slate-600">
                            {r.chiefComplaint}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {r.followUpDate && (
                            <span>Tái khám: {formatDate(r.followUpDate)}</span>
                          )}
                          {r.prescriptionCount > 0 && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Pill size={11} />
                              {r.prescriptionCount} đơn thuốc
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/doctor/medical-records?recordId=${r.id}`}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-medium text-brand-dark transition-colors hover:border-brand/40 hover:text-brand"
                      >
                        Mở hồ sơ <ArrowUpRight size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
