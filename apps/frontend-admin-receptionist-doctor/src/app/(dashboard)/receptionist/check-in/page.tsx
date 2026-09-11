"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import apiClient from "@/src/lib/api/client";
import { getApiErrorMessage } from "@/src/lib/utils/api-error";
import {
  mapAppointments,
  localDateStr,
  type ReceptionistAppointment,
} from "@/src/lib/receptionist/mappers";
import { formatDoctorName } from "@/src/lib/utils/format";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Stethoscope,
  UserCheck,
  Phone,
  WarningCircle,
  NotePencil,
  MagnifyingGlass,
  X,
  Warning,
  CircleNotch,
  ArrowClockwise,
} from "@phosphor-icons/react";

interface AppointmentInfo {
  id: string;
  appointmentCode: string;
  patientName: string;
  patientPhone: string;
  patientInitials: string;
  allergies: string[];
  serviceName: string;
  doctorName: string;
  startTime: string;
  endTime: string;
  status: string;
  bookingSource?: string | null;
}

type Mode = "search" | "pick" | "confirm" | "done";

const MIN_SEARCH_LEN = 2;
const MAX_NOTES_LEN = 500;

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

function doctorLabel(name: string) {
  return formatDoctorName(name);
}

function bookingLabel(source?: string | null) {
  if (source === "RECEPTIONIST") return "Lễ tân đặt";
  if (source === "WALK_IN" || source === "WALKIN") return "Walk-in";
  if (source === "PATIENT_APP") return "App BN";
  if (source === "WEBSITE") return "Website";
  return "Lịch hẹn";
}

function toInfo(apt: ReceptionistAppointment): AppointmentInfo {
  const name = apt.patient?.fullName ?? "Khách vãng lai";
  return {
    id: apt.id,
    appointmentCode: apt.appointmentCode,
    patientName: name,
    patientPhone: apt.patient?.phone || "--",
    patientInitials: getInitials(name),
    allergies: apt.allergies ?? [],
    serviceName: apt.service?.name ?? "--",
    doctorName: apt.doctor?.fullName ?? "--",
    startTime: apt.startTime?.slice(0, 5) ?? "--:--",
    endTime: apt.endTime?.slice(0, 5) ?? "",
    status: apt.status,
    bookingSource: apt.bookingSource,
  };
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl",
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800",
      )}
    >
      {type === "success" ? (
        <CheckCircle size={16} weight="fill" className="shrink-0 text-emerald-600" />
      ) : (
        <Warning size={16} weight="fill" className="shrink-0 text-red-500" />
      )}
      <span className="text-sm font-semibold">{message}</span>
      <button
        type="button"
        aria-label="Đóng thông báo"
        onClick={onClose}
        className="ml-2 text-current opacity-60 hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function CheckInPage() {
  const [mode, setMode] = useState<Mode>("search");
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<AppointmentInfo[]>([]);
  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);
  const [historyOk, setHistoryOk] = useState(false);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [searchError, setSearchError] = useState("");
  const searchRequestId = useRef(0);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const runSearch = async (query: string) => {
    const q = query.trim();
    const requestId = ++searchRequestId.current;
    if (q.length < MIN_SEARCH_LEN) {
      setSearching(false);
      setSearchError(`Nhập ít nhất ${MIN_SEARCH_LEN} ký tự để tìm kiếm.`);
      setMode("search");
      return;
    }
    setSearching(true);
    setSearchError("");
    setCandidates([]);

    try {
      const today = localDateStr();
      const res = await apiClient.get(
        `/appointments?date=${today}&search=${encodeURIComponent(q)}`,
      );
      const list = mapAppointments(res.data)
        .filter((a) => a.status === "PENDING" || a.status === "CONFIRMED")
        .map(toInfo);

      if (requestId !== searchRequestId.current) return;

      if (list.length === 0) {
        setSearchError(
          "Không tìm thấy lịch hẹn phù hợp hôm nay (Chờ xác nhận / Đã xác nhận).",
        );
        setMode("search");
        return;
      }

      if (list.length === 1) {
        setAppointment(list[0]);
        setHistoryOk(false);
        setNotes("");
        setMode("confirm");
        return;
      }

      setCandidates(list);
      setMode("pick");
    } catch (err) {
      if (requestId !== searchRequestId.current) return;
      setSearchError(
        getApiErrorMessage(err, "Không tải được lịch hẹn từ máy chủ."),
      );
      setMode("search");
    } finally {
      if (requestId === searchRequestId.current) setSearching(false);
    }
  };

  const handleSearch = () => void runSearch(searchValue);

  const handleCheckIn = async () => {
    if (!appointment) return;
    if (!historyOk) {
      showToast("Vui lòng xác nhận tiền sử bệnh lý trước khi check-in.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.patch(`/appointments/${appointment.id}/check-in`, {
        medicalHistoryConfirmed: historyOk,
        notes: notes.trim().slice(0, MAX_NOTES_LEN) || undefined,
      });
      setMode("done");
      showToast("Check-in thành công! Bệnh nhân đã vào phòng chờ.", "success");
    } catch (err) {
      showToast(
        getApiErrorMessage(
          err,
          "Check-in thất bại. Lịch có thể đã được check-in hoặc không còn hiệu lực.",
        ),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    searchRequestId.current += 1;
    setMode("search");
    setSearching(false);
    setSearchValue("");
    setAppointment(null);
    setCandidates([]);
    setNotes("");
    setHistoryOk(false);
    setSearchError("");
  };

  if (mode === "done" && appointment) {
    return (
      <>
        <Header title="Check-in" />
        <div className="bg-muted flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle size={36} weight="fill" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Check-in thành công!
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-brand-dark">
                {appointment.patientName}
              </span>{" "}
              ({appointment.appointmentCode}) đã vào phòng chờ.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={resetAll}
                className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-muted"
              >
                Check-in tiếp
              </button>
              <Link
                href="/receptionist"
                className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm hover:bg-brand-dark"
              >
                Về tổng quan
              </Link>
            </div>
          </div>
        </div>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Header
        title="Check-in bệnh nhân"
        description="Xác nhận bệnh nhân đã có mặt để chuyển vào phòng chờ."
      />

      <div className="bg-muted p-6">
        <div className="mx-auto max-w-xl space-y-5">
          {mode === "search" && (
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="border-b border-border bg-brand/5 px-6 py-5 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <UserCheck size={28} weight="duotone" />
                </div>
                <h2 className="text-lg font-bold text-brand-dark">
                  Tìm lịch hẹn hôm nay
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nhập SĐT, tên hoặc mã lịch hẹn
                </p>
              </div>

              <div className="space-y-4 p-6">
                <div className="relative">
                  <MagnifyingGlass
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="search"
                    aria-label="Tìm lịch hẹn hôm nay"
                    value={searchValue}
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                      setSearchError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="VD: 0977889900 hoặc APT-SEED-001"
                    minLength={MIN_SEARCH_LEN}
                    className="w-full rounded-lg border border-border bg-muted py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                    autoFocus
                  />
                </div>

                {searchError && (
                  <div role="alert" className="flex items-start justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">
                    <div className="flex items-start gap-2 min-w-0">
                      <Warning
                        weight="fill"
                        size={14}
                        className="mt-0.5 shrink-0 text-amber-500"
                      />
                      <span>{searchError}</span>
                    </div>
                    {searchValue.trim().length >= MIN_SEARCH_LEN && (
                      <button
                        type="button"
                        onClick={() => void runSearch(searchValue)}
                        disabled={searching}
                        className="inline-flex shrink-0 items-center gap-1 font-semibold hover:underline disabled:opacity-50"
                      >
                        <ArrowClockwise size={12} />
                        Thử lại
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searching || searchValue.trim().length < MIN_SEARCH_LEN}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {searching ? (
                    <>
                      <CircleNotch size={16} className="animate-spin" />
                      Đang tìm kiếm...
                    </>
                  ) : (
                    "Tìm lịch hẹn"
                  )}
                </button>
              </div>
            </div>
          )}

          {mode === "pick" && (
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-bold text-brand-dark">
                    Chọn lịch hẹn
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Có {candidates.length} lịch phù hợp hôm nay
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-xs font-semibold text-muted-foreground hover:text-brand-dark"
                >
                  Tìm lại
                </button>
              </div>
              <div className="divide-y divide-border/50">
                {candidates.map((apt) => (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => {
                      setAppointment(apt);
                      setHistoryOk(false);
                      setNotes("");
                      setMode("confirm");
                    }}
                    className="flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand-dark">
                      {apt.patientInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {apt.patientName}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {apt.appointmentCode} · {apt.patientPhone}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {apt.startTime}
                        {apt.endTime ? `–${apt.endTime}` : ""} ·{" "}
                        {apt.serviceName} · {doctorLabel(apt.doctorName)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "confirm" && appointment && (
            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="border-b border-border bg-brand/5 px-6 py-5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      if (candidates.length > 1) {
                        setMode("pick");
                        setAppointment(null);
                      } else {
                        resetAll();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-brand-dark"
                  >
                    <ArrowLeft size={14} /> Quay lại
                  </button>
                  <span className="font-mono text-xs text-muted-foreground">
                    {appointment.appointmentCode}
                  </span>
                </div>
                <div className="mt-4 text-center">
                  <h2 className="text-base font-bold text-brand-dark">
                    Xác nhận Check-in
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Kiểm tra thông tin rồi chuyển bệnh nhân vào phòng chờ.
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div className="space-y-4 rounded-xl border border-border bg-muted p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand-dark">
                        {appointment.patientInitials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {appointment.patientName}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 font-mono text-xs text-muted-foreground">
                          <Phone size={11} />
                          {appointment.patientPhone}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-brand/10 px-2 py-1 text-[10px] font-bold uppercase text-brand ring-1 ring-inset ring-brand/20">
                      {bookingLabel(appointment.bookingSource)}
                    </span>
                  </div>

                  {appointment.allergies.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                      <WarningCircle
                        size={15}
                        weight="fill"
                        className="shrink-0 text-red-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-red-700">
                          Cảnh báo dị ứng
                        </p>
                        <p className="mt-0.5 text-xs text-red-600">
                          {appointment.allergies.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Dịch vụ
                      </p>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                        <Stethoscope size={13} className="shrink-0 text-brand" />
                        {appointment.serviceName}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Giờ hẹn
                      </p>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                        <Clock size={13} className="shrink-0 text-brand" />
                        {appointment.startTime}
                        {appointment.endTime
                          ? ` - ${appointment.endTime}`
                          : ""}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Bác sĩ phụ trách
                      </p>
                      <span className="inline-flex items-center rounded-md bg-brand-light px-2 py-1 text-xs font-bold text-brand-dark ring-1 ring-inset ring-brand/20">
                        {doctorLabel(appointment.doctorName)}
                      </span>
                    </div>
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-sm hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={historyOk}
                    onChange={(e) => setHistoryOk(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-2 focus:ring-brand"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Tiền sử bệnh lý không thay đổi
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Bắt buộc xác nhận dị ứng / tiền sử trước khi check-in.
                    </p>
                  </div>
                </label>

                <div className="space-y-1.5">
                  <label
                    htmlFor="receptionist-check-in-notes"
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                  >
                    <NotePencil size={13} />
                    Ghi chú lễ tân (tuỳ chọn)
                  </label>
                  <textarea
                    id="receptionist-check-in-notes"
                    rows={2}
                    value={notes}
                    maxLength={MAX_NOTES_LEN}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="VD: Bệnh nhân đến trễ 15 phút..."
                    className="w-full resize-y rounded-lg border border-border bg-white px-4 py-3 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <p className="text-right text-[10px] text-muted-foreground">
                    {notes.length}/{MAX_NOTES_LEN}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
                  <button
                    type="button"
                    onClick={resetAll}
                    className="rounded-lg px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCheckIn()}
                    disabled={submitting || !historyOk}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <CircleNotch size={16} className="animate-spin" />
                    ) : (
                      <UserCheck size={16} weight="bold" />
                    )}
                    {submitting ? "Đang xử lý..." : "Hoàn tất Check-in"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
