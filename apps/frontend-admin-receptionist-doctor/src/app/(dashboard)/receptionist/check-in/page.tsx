"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import apiClient from "@/src/lib/api/client";
import { mapAppointments } from "@/src/lib/receptionist/mappers";
import {
  ArrowLeft,
  QrCode,
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
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AppointmentInfo {
  id: string;
  patientName: string;
  patientPhone: string;
  patientInitials: string;
  allergies: string[];
  serviceName: string;
  doctorName: string;
  startTime: string;
  endTime: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Toast component (tạm thời, không cần thư viện)
// ---------------------------------------------------------------------------

function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-xl",
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      )}
    >
      {type === "success" ? (
        <CheckCircle size={16} weight="fill" className="shrink-0 text-emerald-600" />
      ) : (
        <Warning size={16} weight="fill" className="shrink-0 text-red-500" />
      )}
      <span className="text-sm font-semibold">{message}</span>
      <button onClick={onClose} className="ml-2 text-current opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

type Mode = "search" | "confirm" | "done";

export default function CheckInPage() {
  const [mode, setMode] = useState<Mode>("search");
  const [isQRMode, setIsQRMode] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentInfo | null>(null);
  const [historyOk, setHistoryOk] = useState(true);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [searchError, setSearchError] = useState("");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Tìm lịch hẹn theo SĐT hoặc mã
  const handleSearch = async () => {
    if (!searchValue.trim()) return;
    setSearching(true);
    setSearchError("");

    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await apiClient.get(
        `/appointments?date=${today}&search=${encodeURIComponent(searchValue.trim())}`,
      );
      const list = mapAppointments(res.data).filter(
        (a) => a.status === "PENDING" || a.status === "CONFIRMED",
      );
      if (list.length === 0) {
        setSearchError("Không tìm thấy lịch hẹn phù hợp hôm nay. Kiểm tra lại SĐT hoặc mã lịch.");
        return;
      }

      const apt = list[0];
      const name = apt.patient?.fullName ?? "Khách vãng lai";
      setAppointment({
        id: apt.id,
        patientName: name,
        patientPhone: apt.patient?.phone ?? "--",
        patientInitials: getInitials(name),
        allergies: [],
        serviceName: apt.service?.name ?? "--",
        doctorName: apt.doctor?.fullName ?? "--",
        startTime: apt.startTime?.slice(0, 5) ?? "--:--",
        endTime: apt.endTime?.slice(0, 5) ?? "",
        status: apt.status,
      });
      setMode("confirm");
    } catch {
      setSearchError("Không tìm thấy lịch hẹn phù hợp hôm nay. Kiểm tra lại SĐT hoặc mã lịch.");
    } finally {
      setSearching(false);
    }
  };

  // Hoàn tất check-in
  const handleCheckIn = async () => {
    if (!appointment) return;
    setSubmitting(true);

    try {
      await apiClient.patch(`/appointments/${appointment.id}/check-in`, { notes });
      setMode("done");
      showToast("Check-in thành công! Bệnh nhân đã vào phòng chờ.", "success");
    } catch {
      showToast("Check-in thất bại.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setMode("search");
    setIsQRMode(false);
    setSearchValue("");
    setAppointment(null);
    setNotes("");
    setHistoryOk(true);
    setSearchError("");
  };

  // ---------------------------------------------------------------------------
  // QR Scan View
  // ---------------------------------------------------------------------------

  if (isQRMode) {
    return (
      <>
        <Header title="Check-in" description="Quét mã QR hoặc tìm lịch hẹn theo SĐT / mã lịch." />
        <div className="bg-muted min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm text-center">
            {/* QR Viewport */}
            <div className="relative mx-auto h-60 w-60 overflow-hidden rounded-2xl border-2 border-dashed border-brand bg-brand/5">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <QrCode size={48} className="text-brand/40" />
                <p className="text-xs font-semibold">Camera đang mở...</p>
              </div>
              {/* Scan line — keyframe defined in globals.css */}
              <div className="animate-scan absolute left-0 h-0.5 w-full bg-brand/70 shadow-[0_0_12px_3px_rgba(0,151,255,0.5)]" />
            </div>

            <h2 className="mt-6 text-base font-bold text-brand-dark">
              Đưa mã QR của bệnh nhân vào khung hình
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Khách hàng mở mã QR trên Zalo Mini App hoặc Email xác nhận.
            </p>

            <button
              onClick={() => setIsQRMode(false)}
              className="mt-6 text-sm font-bold text-brand transition-colors hover:text-brand-dark hover:underline"
            >
              Quay lại xác nhận thủ công
            </button>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Done View
  // ---------------------------------------------------------------------------

  if (mode === "done" && appointment) {
    return (
      <>
        <Header title="Check-in" />
        <div className="bg-muted min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-white p-8 shadow-sm text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
              <CheckCircle size={36} weight="fill" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Check-in thành công!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <span className="font-semibold text-brand-dark">{appointment.patientName}</span> đã được xác nhận vào phòng chờ. Bác sĩ sẽ được thông báo.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={resetAll}
                className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-muted active:scale-[0.98]"
              >
                Check-in tiếp
              </button>
              <Link
                href="/receptionist"
                className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98]"
              >
                Về tổng quan
              </Link>
            </div>
          </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // Search / Confirm View
  // ---------------------------------------------------------------------------

  return (
    <>
      <Header
        title="Check-in bệnh nhân"
        description="Xác nhận bệnh nhân đã có mặt để chuyển vào phòng chờ."
      >
        <button
          onClick={() => setIsQRMode(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <QrCode size={15} weight="fill" />
          Quét mã QR
        </button>
      </Header>

      <div className="bg-muted min-h-screen p-6">
        <div className="mx-auto max-w-xl space-y-5">

          {/* ── SEARCH PANEL ──────────────────────────────────────── */}
          {mode === "search" && (
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="bg-brand/5 border-b border-border px-6 py-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand mb-3">
                  <UserCheck size={28} weight="duotone" />
                </div>
                <h2 className="text-lg font-bold text-brand-dark">Tìm lịch hẹn</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nhập SĐT hoặc mã lịch hẹn của bệnh nhân
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="relative">
                  <MagnifyingGlass
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => { setSearchValue(e.target.value); setSearchError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="VD: 0977889900 hoặc AP-1003"
                    className="w-full rounded-lg border border-border bg-muted py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                    autoFocus
                  />
                </div>

                {searchError && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">
                    <Warning weight="fill" size={14} className="shrink-0 mt-0.5 text-amber-500" />
                    {searchError}
                  </div>
                )}

                <button
                  onClick={handleSearch}
                  disabled={searching || !searchValue.trim()}
                  className="w-full rounded-lg bg-brand py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searching ? "Đang tìm kiếm..." : "Tìm lịch hẹn"}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  Hoặc{" "}
                  <button
                    onClick={() => setIsQRMode(true)}
                    className="font-bold text-brand hover:underline"
                  >
                    quét mã QR bệnh nhân
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ── CONFIRM PANEL ─────────────────────────────────────── */}
          {mode === "confirm" && appointment && (
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">

              {/* Header xác nhận */}
              <div className="border-b border-border bg-brand/5 px-6 py-5">
                <div className="flex items-center justify-between">
                  <button
                    onClick={resetAll}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-brand-dark"
                  >
                    <ArrowLeft size={14} /> Tìm lại
                  </button>
                  <span className="font-mono text-xs text-muted-foreground">{appointment.id}</span>
                </div>
                <div className="mt-4 text-center">
                  <h2 className="text-base font-bold text-brand-dark">Xác nhận Check-in</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Kiểm tra thông tin và hoàn tất để chuyển bệnh nhân vào phòng chờ.
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-5">

                {/* Patient info card */}
                <div className="rounded-xl border border-border bg-muted p-4 space-y-4">

                  {/* Avatar + tên + SĐT */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand-dark">
                        {appointment.patientInitials}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{appointment.patientName}</p>
                        <p className="flex items-center gap-1 font-mono text-xs text-muted-foreground mt-0.5">
                          <Phone size={11} />
                          {appointment.patientPhone}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md bg-brand/10 px-2 py-1 text-[10px] font-bold uppercase text-brand ring-1 ring-inset ring-brand/20">
                      Lịch đặt trước
                    </span>
                  </div>

                  {/* Allergy warning */}
                  {appointment.allergies.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                      <WarningCircle size={15} weight="fill" className="shrink-0 text-red-500" />
                      <div>
                        <p className="text-xs font-bold text-red-700">Cảnh báo dị ứng</p>
                        <p className="text-xs text-red-600 mt-0.5">
                          {appointment.allergies.join(", ")}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Dịch vụ</p>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                        <Stethoscope size={13} className="text-brand shrink-0" />
                        {appointment.serviceName}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Giờ hẹn</p>
                      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
                        <Clock size={13} className="text-brand shrink-0" />
                        {appointment.startTime}{appointment.endTime ? ` - ${appointment.endTime}` : ""}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Bác sĩ phụ trách</p>
                      <span className="inline-flex items-center rounded-md bg-brand-light px-2 py-1 text-xs font-bold text-brand-dark ring-1 ring-inset ring-brand/20">
                        BS. {appointment.doctorName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Xác nhận tiền sử */}
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-sm transition-colors hover:bg-muted">
                  <input
                    type="checkbox"
                    checked={historyOk}
                    onChange={(e) => setHistoryOk(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-brand focus:ring-brand focus:ring-2"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Tiền sử bệnh lý không thay đổi
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Xác nhận thông tin dị ứng / huyết áp vẫn như hồ sơ cũ.
                    </p>
                  </div>
                </label>

                {/* Ghi chú lễ tân */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <NotePencil size={13} />
                    Ghi chú lễ tân (Tùy chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="VD: Bệnh nhân đến trễ 15 phút, ngồi khu vực sảnh chờ số 1..."
                    className="w-full resize-y rounded-lg border border-border bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
                  <button
                    onClick={resetAll}
                    className="rounded-lg px-5 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-muted active:scale-[0.98]"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCheckIn}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <UserCheck size={16} weight="bold" />
                    {submitting ? "Đang xử lý..." : "Hoàn tất Check-in"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
