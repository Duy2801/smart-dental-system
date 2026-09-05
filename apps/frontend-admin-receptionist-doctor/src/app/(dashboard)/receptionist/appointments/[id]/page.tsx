"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/src/components/layout/header";
import { AppointmentStatusBadge } from "@/src/components/shared/appointment-status-badge";
import type { AppointmentStatus } from "@/src/components/shared/appointment-status-badge";
import apiClient from "@/src/lib/api/client";
import { localDateStr, mapAppointment } from "@/src/lib/receptionist/mappers";
import type {
  ApiAppointment,
  ReceptionistAppointment,
} from "@/src/lib/receptionist/mappers";
import { formatDoctorName } from "@/src/lib/utils/format";
import { getApiErrorMessage } from "@/src/lib/utils/api-error";
import { cn } from "@/src/lib/utils/cn";
import { useAppDialog } from "@/src/providers/app-dialog-provider";
import {
  ArrowLeft,
  Phone,
  UserCircleCheck,
  BellRinging,
  Receipt,
  SpinnerGap,
  Warning,
  Stethoscope,
  CalendarBlank,
  NotePencil,
  CheckCircle,
  XCircle,
  UserMinus,
  ClockCountdown,
  ArrowClockwise,
} from "@phosphor-icons/react";

function formatTime(t?: string) {
  if (!t) return "--:--";
  return t.slice(0, 5);
}

function dateFromIso(iso?: string) {
  if (!iso) return localDateStr();
  return localDateStr(new Date(iso));
}

export default function AppointmentDetailPage() {
  const { showConfirm } = useAppDialog();
  const { id } = useParams<{ id: string }>();
  const [apt, setApt] = useState<ReceptionistAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(localDateStr());
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const loadAppointment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/appointments/${id}`);
      const mapped = mapAppointment(res.data as ApiAppointment);
      setApt(mapped);
      setRescheduleDate(dateFromIso(mapped.scheduledAt));
      setRescheduleTime(formatTime(mapped.startTime));
    } catch (err) {
      setError(getApiErrorMessage(err, "Không tải được lịch hẹn từ máy chủ."));
      setApt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!showReschedule || !apt?.doctor?.id || !apt.service?.id) return;
    setLoadingSlots(true);
    apiClient
      .get("/appointments/booking-options", {
        params: {
          doctorId: apt.doctor.id,
          serviceId: apt.service.id,
          date: rescheduleDate,
        },
      })
      .then((res) => {
        const slots = (res.data as { timeSlots?: string[] }).timeSlots ?? [];
        const current =
          dateFromIso(apt.scheduledAt) === rescheduleDate
            ? formatTime(apt.startTime)
            : "";
        const merged =
          current && !slots.includes(current) ? [current, ...slots] : slots;
        setTimeSlots(merged);
        if (merged.length && !merged.includes(rescheduleTime)) {
          setRescheduleTime(current || "");
        }
      })
      .catch(() => setTimeSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [showReschedule, apt?.doctor?.id, apt?.service?.id, rescheduleDate]);

  const updateStatus = async (
    status: AppointmentStatus,
    endpoint: string,
    message: string,
  ) => {
    if (!apt) return;
    if (status === "CANCELLED") {
      const confirmed = await showConfirm({
        title: "Hủy lịch hẹn?",
        description: "Lịch hẹn này sẽ được chuyển sang trạng thái đã hủy.",
        confirmLabel: "Hủy lịch hẹn",
        tone: "danger",
      });
      if (!confirmed) return;
    }
    if (status === "NO_SHOW") {
      const confirmed = await showConfirm({
        title: "Đánh dấu bệnh nhân vắng mặt?",
        description: "Xác nhận bệnh nhân đã không đến theo lịch hẹn này.",
        confirmLabel: "Xác nhận vắng mặt",
        tone: "danger",
      });
      if (!confirmed) return;
    }
    setActing(true);
    setError(null);
    try {
      await apiClient.patch(`/appointments/${apt.id}/${endpoint}`);
      await loadAppointment();
      setToast(message);
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      setError(getApiErrorMessage(err, "Cập nhật trạng thái thất bại."));
    } finally {
      setActing(false);
    }
  };

  const handleReschedule = async () => {
    if (!apt || !rescheduleDate || !rescheduleTime) {
      setError("Chọn ngày và giờ mới.");
      return;
    }
    setActing(true);
    setError(null);
    try {
      const scheduledAt = new Date(
        `${rescheduleDate}T${rescheduleTime}:00`,
      ).toISOString();
      const res = await apiClient.patch(
        `/appointments/${apt.id}/reschedule`,
        { scheduledAt },
      );
      setApt(mapAppointment(res.data as ApiAppointment));
      setShowReschedule(false);
      setToast("Đã đổi lịch hẹn");
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      setError(getApiErrorMessage(err, "Đổi lịch thất bại."));
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Chi tiết lịch hẹn" />
        <div className="flex h-64 items-center justify-center bg-muted">
          <SpinnerGap size={32} className="animate-spin text-brand" />
        </div>
      </>
    );
  }

  if (error && !apt) {
    return (
      <>
        <Header title="Chi tiết lịch hẹn" />
        <div className="bg-muted p-6">
          <div className="flex items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <div className="flex items-center gap-2 min-w-0">
              <Warning size={18} className="shrink-0" />
              <span className="truncate">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadAppointment()}
              className="inline-flex shrink-0 items-center gap-1.5 font-semibold hover:underline"
            >
              <ArrowClockwise size={14} />
              Thử lại
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!apt) return null;

  const name = apt.patient?.fullName ?? "Khách vãng lai";
  const canReschedule =
    apt.status === "PENDING" || apt.status === "CONFIRMED";

  return (
    <>
      <Header title="Chi tiết lịch hẹn" description={apt.appointmentCode} />

      <div className="bg-muted p-6 space-y-5">
        <Link
          href="/receptionist/appointments"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand-dark"
        >
          <ArrowLeft size={16} /> Quay lại lịch hẹn
        </Link>

        {toast && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            <CheckCircle size={16} weight="fill" />
            {toast}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <Warning size={16} weight="fill" />
            {error}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {apt.appointmentCode}
                  </p>
                  <h1 className="mt-1 text-xl font-bold text-brand-dark">
                    {name}
                  </h1>
                  {apt.patient?.phone && (
                    <p className="mt-1 flex items-center gap-1.5 font-mono text-sm text-muted-foreground">
                      <Phone size={14} /> {apt.patient.phone}
                    </p>
                  )}
                </div>
                <AppointmentStatusBadge status={apt.status} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-muted p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CalendarBlank size={12} /> Thời gian
                  </p>
                  <p className="mt-1.5 font-mono text-sm font-bold text-slate-900">
                    {formatTime(apt.startTime)}
                    {apt.endTime ? ` – ${formatTime(apt.endTime)}` : ""}
                  </p>
                  {apt.scheduledAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(apt.scheduledAt).toLocaleDateString("vi-VN", {
                        weekday: "long",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-muted p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Stethoscope size={12} /> Dịch vụ
                  </p>
                  <p className="mt-1.5 text-sm font-bold text-slate-900">
                    {apt.service?.name ?? "--"}
                  </p>
                  {apt.doctor && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDoctorName(apt.doctor.fullName)}
                    </p>
                  )}
                </div>
              </div>

              {apt.notes && (
                <div className="rounded-xl border border-dashed border-border bg-slate-50 p-4">
                  <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <NotePencil size={12} /> Ghi chú
                  </p>
                  <p className="text-sm text-slate-700">{apt.notes}</p>
                </div>
              )}

              {showReschedule && (
                <div className="rounded-xl border border-brand/30 bg-brand/5 p-4 space-y-4">
                  <p className="text-sm font-bold text-brand-dark flex items-center gap-2">
                    <ClockCountdown size={16} /> Đổi ngày / giờ
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                        Ngày mới
                      </label>
                      <input
                        type="date"
                        value={rescheduleDate}
                        min={localDateStr()}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                        Giờ mới
                      </label>
                      {loadingSlots ? (
                        <p className="text-xs text-muted-foreground py-2">
                          Đang tải slot...
                        </p>
                      ) : timeSlots.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">
                          Không còn khung giờ trống.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                          {timeSlots.map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setRescheduleTime(t)}
                              className={cn(
                                "rounded-md border px-2 py-1 font-mono text-xs font-bold",
                                rescheduleTime === t
                                  ? "border-brand bg-brand text-white"
                                  : "border-border bg-white text-slate-700 hover:border-brand/50",
                              )}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={acting || !rescheduleTime}
                      onClick={() => void handleReschedule()}
                      className="rounded-lg bg-brand px-4 py-2 text-xs font-bold text-white hover:bg-brand-dark disabled:opacity-60"
                    >
                      Lưu lịch mới
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReschedule(false)}
                      className="rounded-lg px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-white"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-white p-5 shadow-sm space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Thao tác
              </h2>

              {apt.status === "PENDING" && (
                <button
                  disabled={acting}
                  onClick={() =>
                    void updateStatus(
                      "CONFIRMED",
                      "confirm",
                      "Đã xác nhận lịch hẹn",
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
                >
                  <Phone size={15} weight="fill" /> Xác nhận
                </button>
              )}

              {(apt.status === "CONFIRMED" || apt.status === "PENDING") && (
                <button
                  disabled={acting}
                  onClick={() =>
                    void updateStatus(
                      "CHECKED_IN",
                      "check-in",
                      "Check-in thành công",
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-dark disabled:opacity-60"
                >
                  <UserCircleCheck size={15} weight="fill" /> Check-in
                </button>
              )}

              {apt.status === "CHECKED_IN" && (
                <button
                  disabled={acting}
                  onClick={() =>
                    void updateStatus(
                      "IN_PROGRESS",
                      "start",
                      "Đã nhắc bác sĩ bắt đầu khám",
                    )
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-brand-dark shadow-sm hover:bg-muted disabled:opacity-60"
                >
                  <BellRinging size={15} /> Nhắc bác sĩ
                </button>
              )}

              {canReschedule && !showReschedule && (
                <button
                  disabled={acting}
                  onClick={() => setShowReschedule(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-muted disabled:opacity-60"
                >
                  <ClockCountdown size={15} /> Đổi lịch
                </button>
              )}

              {apt.status === "COMPLETED" && apt.invoicePending && (
                <Link
                  href="/receptionist/billing"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-brand-dark"
                >
                  <Receipt size={15} weight="fill" /> Thu tiền
                </Link>
              )}

              {apt.patient?.id && (
                <Link
                  href={`/receptionist/patients/${apt.patient.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-muted"
                >
                  Hồ sơ bệnh nhân
                </Link>
              )}

              {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <button
                      disabled={acting}
                      onClick={() =>
                        void updateStatus(
                          "CANCELLED",
                          "cancel",
                          "Đã hủy lịch hẹn",
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <XCircle size={15} /> Khách báo hủy
                    </button>
                    <button
                      disabled={acting}
                      onClick={() =>
                        void updateStatus(
                          "NO_SHOW",
                          "no-show",
                          "Đã đánh dấu vắng mặt",
                        )
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <UserMinus size={15} /> Vắng mặt
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
