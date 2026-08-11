"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/src/lib/utils/cn";
import { Header } from "@/src/components/layout/header";
import apiClient from "@/src/lib/api/client";
import {
  mapAppointments,
  localDateStr,
  type ReceptionistAppointment,
} from "@/src/lib/receptionist/mappers";
import { formatDoctorName } from "@/src/lib/utils/format";
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
      <button onClick={onClose} className="ml-2 text-current opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

export default function CheckInPage() {
  const [mode, setMode] = useState<Mode>("search");
  const [isQRMode, setIsQRMode] = useState(false);
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
  const [cameraError, setCameraError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
  };

  useEffect(() => {
    if (!isQRMode) {
      stopCamera();
      setCameraError("");
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    const start = async () => {
      setCameraError("");
      setCameraReady(false);
      const Detector = (
        window as unknown as {
          BarcodeDetector?: new (opts: {
            formats: string[];
          }) => {
            detect: (source: ImageBitmapSource) => Promise<{ rawValue: string }[]>;
          };
        }
      ).BarcodeDetector;

      if (!Detector || !navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Trình duyệt không hỗ trợ quét QR. Nhập mã lịch bên dưới.",
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);

        const detector = new Detector({ formats: ["qr_code"] });
        timer = setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;
          try {
            const codes = await detector.detect(video);
            const raw = codes[0]?.rawValue?.trim();
            if (!raw) return;
            stopCamera();
            setIsQRMode(false);
            setSearchValue(raw);
            void runSearch(raw);
          } catch {
            // ignore frame errors
          }
        }, 600);
      } catch {
        setCameraError(
          "Không mở được camera. Cho phép quyền camera hoặc nhập mã lịch thủ công.",
        );
      }
    };

    void start();
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isQRMode]);

  const runSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;
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
    } catch {
      setSearchError("Không tải được lịch hẹn từ máy chủ.");
      setMode("search");
    } finally {
      setSearching(false);
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
        notes: notes.trim() || undefined,
      });
      setMode("done");
      showToast("Check-in thành công! Bệnh nhân đã vào phòng chờ.", "success");
    } catch {
      showToast(
        "Check-in thất bại. Lịch có thể đã được check-in hoặc không còn hiệu lực.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    stopCamera();
    setMode("search");
    setIsQRMode(false);
    setSearchValue("");
    setAppointment(null);
    setCandidates([]);
    setNotes("");
    setHistoryOk(false);
    setSearchError("");
    setCameraError("");
  };

  if (isQRMode) {
    return (
      <>
        <Header
          title="Check-in"
          description="Quét mã QR hoặc nhập mã lịch hẹn."
        />
        <div className="bg-muted flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-sm text-center space-y-5">
            <div className="relative mx-auto h-60 w-60 overflow-hidden rounded-2xl border-2 border-dashed border-brand bg-slate-900">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/70">
                  <QrCode size={48} className="text-white/40" />
                  <p className="text-xs font-semibold px-4">
                    {cameraError || "Đang mở camera..."}
                  </p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-base font-bold text-brand-dark">
                Quét mã QR lịch hẹn
              </h2>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Mã QR chứa mã lịch (vd. APT-SEED-001) hoặc SĐT bệnh nhân.
              </p>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-xs font-semibold text-muted-foreground">
                Hoặc nhập mã thủ công
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchValue.trim()) {
                      setIsQRMode(false);
                      void runSearch(searchValue);
                    }
                  }}
                  placeholder="APT-SEED-001"
                  className="flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="button"
                  disabled={!searchValue.trim() || searching}
                  onClick={() => {
                    setIsQRMode(false);
                    void runSearch(searchValue);
                  }}
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  Tìm
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                stopCamera();
                setIsQRMode(false);
              }}
              className="text-sm font-bold text-brand transition-colors hover:text-brand-dark hover:underline"
            >
              Quay lại tìm kiếm thủ công
            </button>
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
      >
        <button
          onClick={() => setIsQRMode(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-dark px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98]"
        >
          <QrCode size={15} weight="fill" />
          Quét mã QR
        </button>
      </Header>

      <div className="bg-muted p-6">
        <div className="mx-auto max-w-xl space-y-5">
          {mode === "search" && (
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
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
                    type="text"
                    value={searchValue}
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                      setSearchError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="VD: 0977889900 hoặc APT-SEED-001"
                    className="w-full rounded-lg border border-border bg-muted py-3 pl-10 pr-4 text-sm font-medium outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                    autoFocus
                  />
                </div>

                {searchError && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-800">
                    <Warning
                      weight="fill"
                      size={14}
                      className="mt-0.5 shrink-0 text-amber-500"
                    />
                    {searchError}
                  </div>
                )}

                <button
                  onClick={handleSearch}
                  disabled={searching || !searchValue.trim()}
                  className="w-full rounded-lg bg-brand py-3 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {searching ? "Đang tìm kiếm..." : "Tìm lịch hẹn"}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  Hoặc{" "}
                  <button
                    onClick={() => setIsQRMode(true)}
                    className="font-bold text-brand hover:underline"
                  >
                    quét mã QR
                  </button>
                </p>
              </div>
            </div>
          )}

          {mode === "pick" && (
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
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
            <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
              <div className="border-b border-border bg-brand/5 px-6 py-5">
                <div className="flex items-center justify-between">
                  <button
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
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <NotePencil size={13} />
                    Ghi chú lễ tân (tuỳ chọn)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="VD: Bệnh nhân đến trễ 15 phút..."
                    className="w-full resize-y rounded-lg border border-border bg-white px-4 py-3 text-sm font-medium outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
                  <button
                    onClick={resetAll}
                    className="rounded-lg px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => void handleCheckIn()}
                    disabled={submitting || !historyOk}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
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
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
