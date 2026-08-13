"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/src/lib/utils/cn";
import apiClient from "@/src/lib/api/client";
import { localDateStr } from "@/src/lib/receptionist/mappers";
import { getApiErrorMessage } from "@/src/lib/utils/api-error";
import { formatDoctorName } from "@/src/lib/utils/format";
import {
  ArrowLeft,
  UserPlus,
  CalendarBlank,
  Clock,
  Check,
  SpinnerGap,
} from "@phosphor-icons/react";

type PatientOpt = { id: string; name: string; phone: string };
type ServiceOpt = { id: string; name: string };
type DoctorOpt = {
  id: string;
  name: string;
  spec: string;
  status: "AVAILABLE" | "BUSY";
};

function NewAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefillId = searchParams.get("patientId") ?? "";
  const prefillName = searchParams.get("patientName") ?? "";
  const prefillPhone = searchParams.get("patientPhone") ?? "";

  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [services, setServices] = useState<ServiceOpt[]>([]);
  const [doctors, setDoctors] = useState<DoctorOpt[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(true);

  const [patientId, setPatientId] = useState(prefillId);
  const [serviceId, setServiceId] = useState("");
  const [treatmentMethodId, setTreatmentMethodId] = useState("");
  const [date, setDate] = useState(localDateStr());
  const [checkInMode, setCheckInMode] = useState<"PENDING" | "WAITING">("PENDING");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingOpts(true);
        const [patientsRes, optionsRes] = await Promise.all([
          apiClient.get("/patients"),
          apiClient.get("/appointments/booking-options"),
        ]);

        const pList = Array.isArray(patientsRes.data) ? patientsRes.data : [];
        const mappedPatients: PatientOpt[] = pList.map(
          (p: { id: string; fullName?: string; phone?: string | null }) => ({
            id: p.id,
            name: p.fullName ?? "—",
            phone: p.phone ?? "",
          }),
        );
        if (
          prefillId &&
          !mappedPatients.some((p) => p.id === prefillId)
        ) {
          mappedPatients.unshift({
            id: prefillId,
            name: prefillName || `BN ${prefillId.slice(0, 8)}`,
            phone: prefillPhone,
          });
        }
        setPatients(mappedPatients);

        const opts = optionsRes.data as {
          services?: { id: string; name: string }[];
          selectedTreatmentMethodId?: string;
          doctors?: {
            id: string;
            specialization?: string;
            user?: { fullName?: string };
          }[];
          timeSlots?: string[];
        };
        if (opts.selectedTreatmentMethodId) {
          setTreatmentMethodId(opts.selectedTreatmentMethodId);
        }
        setServices(
          (opts.services ?? []).map((s) => ({ id: s.id, name: s.name })),
        );
        setDoctors(
          (opts.doctors ?? []).map((d) => ({
            id: d.id,
            name: formatDoctorName(d.user?.fullName ?? "—"),
            spec: d.specialization ?? "",
            status: "AVAILABLE" as const,
          })),
        );
        setTimeSlots(opts.timeSlots ?? []);
      } catch (err) {
        setError(getApiErrorMessage(err, "Không tải được dữ liệu đặt lịch từ máy chủ."));
      } finally {
        setLoadingOpts(false);
      }
    };
    void load();
  }, [prefillId, prefillName, prefillPhone]);

  useEffect(() => {
    if (!serviceId && !selectedDoctor && !date) return;
    apiClient
      .get("/appointments/booking-options", {
        params: {
          ...(serviceId ? { serviceId } : {}),
          ...(selectedDoctor ? { doctorId: selectedDoctor } : {}),
          ...(date ? { date } : {}),
          ...(selectedTime ? { time: selectedTime } : {}),
        },
      })
      .then((res) => {
        const opts = res.data as {
          timeSlots?: string[];
          selectedTreatmentMethodId?: string;
          doctors?: {
            id: string;
            specialization?: string;
            user?: { fullName?: string };
          }[];
        };
        if (opts.selectedTreatmentMethodId) {
          setTreatmentMethodId(opts.selectedTreatmentMethodId);
        }
        if (opts.timeSlots) {
          setTimeSlots(opts.timeSlots);
          if (selectedTime && !opts.timeSlots.includes(selectedTime)) {
            setSelectedTime("");
            setError("Khung giờ bạn vừa chọn không khả dụng cho bác sĩ này. Vui lòng chọn lại.");
          }
        }
        if (opts.doctors) {
          setDoctors(
            opts.doctors.map((d) => ({
              id: d.id,
              name: formatDoctorName(d.user?.fullName ?? "—"),
              spec: d.specialization ?? "",
              status: "AVAILABLE" as const,
            })),
          );
        }
      })
      .catch(() => undefined);
  }, [serviceId, selectedDoctor, date, selectedTime]);

  const handleSubmit = async () => {
    setError(null);
    if (!patientId || !serviceId || !treatmentMethodId || !date || !selectedTime || !selectedDoctor) {
      setError("Vui lòng chọn đủ bệnh nhân, dịch vụ, ngày, giờ và bác sĩ.");
      return;
    }
    if (timeSlots.length === 0) {
      setError("Không còn khung giờ trống cho ngày đã chọn.");
      return;
    }
    if (!timeSlots.includes(selectedTime)) {
      setError("Khung giờ đã chọn không còn khả dụng. Vui lòng chọn lại.");
      return;
    }
    if (date < localDateStr()) {
      setError("Không thể đặt lịch cho ngày đã qua.");
      return;
    }

    setSubmitting(true);
    const scheduledAt = new Date(`${date}T${selectedTime}:00`).toISOString();
    try {
      const res = await apiClient.post<{ id: string }>("/appointments/staff", {
        patientId,
        serviceId,
        doctorId: selectedDoctor,
        scheduledAt,
        notes: notes.trim() || undefined,
        walkIn: checkInMode === "WAITING",
      });
      router.push(`/receptionist/appointments/${res.data?.id ?? ""}`);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Tạo lịch hẹn thất bại. Kiểm tra slot còn trống và thử lại.",
        ),
      );
      setSubmitting(false);
    }
  };

  if (loadingOpts) {
    return (
      <div className="flex h-64 items-center justify-center">
        <SpinnerGap size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50/50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 space-y-4">
          <Link
            href="/receptionist/appointments"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft size={16} /> Quay lại Lịch hẹn
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-brand-dark">
                Tạo Lịch Hẹn Mới / Walk-in
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sắp xếp ca khám cho bệnh nhân mới hoặc tái khám.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/receptionist/appointments"
                className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                Hủy bỏ
              </Link>
              <button
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark disabled:opacity-60 active:scale-[0.98]"
              >
                {submitting ? (
                  <SpinnerGap size={16} className="animate-spin" />
                ) : (
                  <Check size={16} weight="bold" />
                )}
                Xác nhận Đặt lịch
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-2xl border border-border bg-white p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-slate-900">
                  1. Thông tin Bệnh nhân
                </h2>
                <Link
                  href="/receptionist/patients/new"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:text-brand-dark transition-colors"
                >
                  <UserPlus size={16} /> Thêm mới nhanh
                </Link>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Bệnh nhân <span className="text-red-500">*</span>
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full rounded-xl border-transparent bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 cursor-pointer"
                >
                  <option value="">-- Chọn bệnh nhân --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - {p.phone}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 md:p-8 shadow-sm">
              <h2 className="mb-6 text-base font-bold text-slate-900">
                2. Dịch vụ & Thời gian
              </h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Dịch vụ yêu cầu <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={serviceId}
                    onChange={(e) => setServiceId(e.target.value)}
                    className="w-full rounded-xl border-transparent bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 cursor-pointer"
                  >
                    <option value="">-- Chọn dịch vụ --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Ngày hẹn <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <CalendarBlank
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      />
                      <input
                        type="date"
                        value={date}
                        min={localDateStr()}
                        onChange={(e) => {
                          setDate(e.target.value);
                          setSelectedTime("");
                        }}
                        className="w-full rounded-xl border-transparent bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Trạng thái Check-in
                    </label>
                    <select
                      value={checkInMode}
                      onChange={(e) =>
                        setCheckInMode(e.target.value as "PENDING" | "WAITING")
                      }
                      className="w-full rounded-xl border-transparent bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 cursor-pointer"
                    >
                      <option value="PENDING">Đặt trước (xác nhận luôn)</option>
                      <option value="WAITING">Walk-in (check-in ngay)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-muted-foreground" />
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Chọn khung giờ
                    </label>
                  </div>
                  {timeSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Không có khung giờ trống cho ngày này.
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={cn(
                            "rounded-lg border py-2 text-xs font-bold font-mono transition-all active:scale-[0.95]",
                            selectedTime === time
                              ? "border-brand bg-brand text-white shadow-md"
                              : "border-border bg-white text-slate-700 hover:border-brand/50 hover:bg-slate-50",
                          )}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 md:p-8 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-slate-900">
                3. Ghi chú cho Bác sĩ
              </h2>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Bệnh nhân sợ đau..."
                className="w-full rounded-xl border-transparent bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 resize-y"
              />
            </div>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sticky top-8">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Phân công Bác sĩ
              </h2>

              <div className="space-y-3">
                {doctors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Không có bác sĩ khả dụng.
                  </p>
                ) : (
                  doctors.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedDoctor(doc.id)}
                      className={cn(
                        "w-full flex flex-col items-start gap-2 rounded-xl border p-4 transition-all text-left active:scale-[0.99]",
                        selectedDoctor === doc.id
                          ? "border-brand bg-brand/5 shadow-sm ring-1 ring-inset ring-brand/20"
                          : "border-border bg-white hover:border-brand/50 hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "font-bold",
                          selectedDoctor === doc.id
                            ? "text-brand-dark"
                            : "text-slate-900",
                        )}
                      >
                        {doc.name}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {doc.spec}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <SpinnerGap size={32} className="animate-spin text-brand" />
        </div>
      }
    >
      <NewAppointmentForm />
    </Suspense>
  );
}
