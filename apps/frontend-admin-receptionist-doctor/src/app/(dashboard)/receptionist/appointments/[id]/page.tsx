"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Header } from "@/src/components/layout/header";
import { AppointmentStatusBadge } from "@/src/components/shared/appointment-status-badge";
import type { AppointmentStatus } from "@/src/components/shared/appointment-status-badge";
import apiClient from "@/src/lib/api/client";
import { mapAppointment } from "@/src/lib/receptionist/mappers";
import type { ApiAppointment, ReceptionistAppointment } from "@/src/lib/receptionist/mappers";
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
} from "@phosphor-icons/react";

function formatTime(t?: string) {
  if (!t) return "--:--";
  return t.slice(0, 5);
}

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [apt, setApt] = useState<ReceptionistAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get(`/appointments/${id}`)
      .then((res) => setApt(mapAppointment(res.data as ApiAppointment)))
      .catch(() => setError("Không tải được lịch hẹn từ máy chủ."))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (
    status: AppointmentStatus,
    endpoint: string,
    message: string,
  ) => {
    if (!apt) return;
    setActing(true);
    try {
      await apiClient.patch(`/appointments/${apt.id}/${endpoint}`);
      setApt({ ...apt, status });
      setToast(message);
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Cập nhật trạng thái thất bại.");
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
        <div className="bg-muted min-h-screen p-6">
          <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
            <Warning size={18} className="shrink-0" />
            {error}
          </div>
        </div>
      </>
    );
  }

  if (!apt) return null;

  const name = apt.patient?.fullName ?? "Khách vãng lai";

  return (
    <>
      <Header title="Chi tiết lịch hẹn" description={apt.id} />

      <div className="bg-muted min-h-screen p-6 space-y-5">
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
                  <p className="font-mono text-xs text-muted-foreground">{apt.id}</p>
                  <h1 className="mt-1 text-xl font-bold text-brand-dark">{name}</h1>
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
                      BS. {apt.doctor.fullName}
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
                    void updateStatus("CONFIRMED", "confirm", "Đã xác nhận lịch hẹn")
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
                    void updateStatus("CHECKED_IN", "check-in", "Check-in thành công")
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
                    void updateStatus("IN_PROGRESS", "start", "Đã nhắc bác sĩ bắt đầu khám")
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-bold text-brand-dark shadow-sm hover:bg-muted disabled:opacity-60"
                >
                  <BellRinging size={15} /> Nhắc bác sĩ
                </button>
              )}

              {apt.status === "COMPLETED" && (
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

              {apt.status !== "CANCELLED" &&
                apt.status !== "COMPLETED" &&
                apt.status !== "NO_SHOW" && (
                  <div className="border-t border-border pt-3 space-y-2">
                    <button
                      disabled={acting}
                      onClick={() =>
                        void updateStatus("CANCELLED", "cancel", "Đã hủy lịch hẹn")
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <XCircle size={15} /> Khách báo hủy
                    </button>
                    <button
                      disabled={acting}
                      onClick={() =>
                        void updateStatus("NO_SHOW", "no-show", "Đã đánh dấu vắng mặt")
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
