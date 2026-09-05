"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Clock,
  User,
  Stethoscope,
  Hash,
  Phone,
  SpinnerGap,
  VideoCamera,
  ClockCounterClockwise,
  ArrowUpRight,
} from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";
import { PatientAiBrief } from "@/src/components/doctor/patient-ai-brief";
import apiClient from "@/src/lib/api/client";
import { getDoctorIdFromCookie } from "@/src/lib/doctor/session";
import type { ScheduleAppointment, AppointmentStatus } from "./types";
import { statusConfig } from "./types";

type Props = {
  appointment: ScheduleAppointment;
  onClose: () => void;
  onStatusChange: (id: string, action: "start" | "complete") => Promise<void>;
};

type PreviousVisit = {
  id: string;
  scheduledAt: string | null;
  createdAt: string;
  serviceName: string | null;
  diagnosis: string | null;
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

export function AppointmentDetailPanel({
  appointment: apt,
  onClose,
  onStatusChange,
}: Props) {
  const [loading, setLoading] = useState<"start" | "complete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previousVisits, setPreviousVisits] = useState<PreviousVisit[]>([]);
  const [historyLoading, setHistoryLoading] = useState(Boolean(apt.patientId));
  const config =
    statusConfig[apt.status as AppointmentStatus] ?? statusConfig.PENDING;

  const scheduledDate = new Date(apt.scheduledAt);
  const endDate = new Date(
    scheduledDate.getTime() + apt.durationMinutes * 60000,
  );

  useEffect(() => {
    if (!apt.patientId) {
      return;
    }
    const doctorId = getDoctorIdFromCookie();
    if (!doctorId) {
      void Promise.resolve().then(() => setHistoryLoading(false));
      return;
    }

    let cancelled = false;
    void apiClient
      .get<PreviousVisit[]>(
        `/medical-records?doctorId=${doctorId}&patientId=${apt.patientId}`,
      )
      .then((response) => {
        if (cancelled) return;
        const currentTime = new Date(apt.scheduledAt).getTime();
        setPreviousVisits(
          (response.data ?? [])
            .filter(
              (visit) =>
                new Date(visit.scheduledAt ?? visit.createdAt).getTime() <
                currentTime,
            )
            .slice(0, 3),
        );
      })
      .catch(() => {
        if (!cancelled) setPreviousVisits([]);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apt.id, apt.patientId, apt.scheduledAt]);

  async function handleAction(action: "start" | "complete") {
    setLoading(action);
    setError(null);
    try {
      await onStatusChange(apt.id, action);
    } catch {
      setError(
        action === "start"
          ? "Không thể bắt đầu ca khám."
          : "Không thể kết thúc ca khám.",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex h-[693px] w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-brand-dark">
          Chi tiết lịch hẹn
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted"
        >
          <X size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-color:theme(colors.slate.300)_transparent] [scrollbar-width:thin]">
        <div className="flex flex-col gap-5">
          <span
            className={cn(
              "inline-flex w-fit items-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
              config.color,
              config.ring,
            )}
          >
            {config.label}
          </span>

          <div className="flex flex-col gap-3.5">
            <InfoRow
              icon={<Hash size={15} />}
              label="Mã lịch hẹn"
              value={apt.appointmentCode}
            />
            <InfoRow
              icon={<Clock size={15} />}
              label="Thời gian"
              value={`${scheduledDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} · ${scheduledDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${endDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} (${apt.durationMinutes} phút)`}
            />
            <InfoRow
              icon={<User size={15} />}
              label="Bệnh nhân"
              value={`${apt.patientName} (${apt.patientCode})`}
            />
            <InfoRow
              icon={<Phone size={15} />}
              label="Số điện thoại"
              value={apt.patientPhone || "-"}
            />
            <InfoRow
              icon={<Stethoscope size={15} />}
              label="Dịch vụ"
              value={apt.serviceName}
            />
          </div>

          {apt.notes && (
            <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
              <span className="font-medium">Ghi chú: </span>
              {apt.notes}
            </div>
          )}

          {apt.patientId && (
            <section className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <ClockCounterClockwise size={15} className="text-brand" />
                  <h4 className="text-xs font-semibold text-slate-800">
                    Lần khám trước
                  </h4>
                </div>
                <Link
                  href={`/doctor/patients/${apt.patientId}/records`}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand hover:underline"
                >
                  Xem tất cả <ArrowUpRight size={11} />
                </Link>
              </div>

              {historyLoading ? (
                <div className="flex items-center gap-2 py-2 text-[11px] text-slate-500">
                  <SpinnerGap size={13} className="animate-spin" />
                  Đang tải lịch sử...
                </div>
              ) : previousVisits.length === 0 ? (
                <p className="py-1 text-[11px] text-slate-500">
                  Chưa có hồ sơ bệnh án từ lần khám trước.
                </p>
              ) : (
                <div className="space-y-2">
                  {previousVisits.map((visit) => (
                    <Link
                      key={visit.id}
                      href={`/doctor/medical-records?recordId=${visit.id}`}
                      className="block rounded-lg border border-slate-200 bg-white px-3 py-2 transition hover:border-brand/30 hover:shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <time className="font-mono text-[10px] font-semibold text-slate-500">
                          {new Date(
                            visit.scheduledAt ?? visit.createdAt,
                          ).toLocaleDateString("vi-VN")}
                        </time>
                        <ArrowUpRight
                          size={11}
                          className="shrink-0 text-slate-400"
                        />
                      </div>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-800">
                        {visit.serviceName || "Khám nha khoa"}
                      </p>
                      {visit.diagnosis && (
                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {visit.diagnosis}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          <PatientAiBrief
            key={apt.id}
            patientId={apt.patientId}
            consultationId={apt.type === "ONLINE" ? apt.id : null}
            patientName={apt.patientName}
            compact
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-200">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 pt-1">
            {apt.type === "ONLINE" && apt.status !== "CANCELLED" && (
              <Link
                href={`/doctor/consultations/${apt.id}`}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-dark"
              >
                <VideoCamera size={18} weight="fill" />
                Mở phòng tư vấn
              </Link>
            )}

            {apt.type === "OFFLINE" && apt.status === "CHECKED_IN" && (
              <button
                onClick={() => handleAction("start")}
                disabled={loading !== null}
                className="flex items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-dark disabled:opacity-60"
              >
                {loading === "start" && (
                  <SpinnerGap size={14} className="animate-spin" />
                )}
                {loading === "start" ? "Đang xử lý..." : "Bắt đầu khám"}
              </button>
            )}
            {apt.type === "OFFLINE" && apt.status === "IN_PROGRESS" && (
              <button
                onClick={() => handleAction("complete")}
                disabled={loading !== null}
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white transition-all hover:bg-orange-600 disabled:opacity-60"
              >
                {loading === "complete" && (
                  <SpinnerGap size={14} className="animate-spin" />
                )}
                {loading === "complete" ? "Đang xử lý..." : "Kết thúc khám"}
              </button>
            )}
            {apt.type === "OFFLINE" && apt.status === "COMPLETED" && (
              <Link
                href={
                  apt.medicalRecordId
                    ? `/doctor/medical-records?recordId=${apt.medicalRecordId}`
                    : "/doctor/medical-records"
                }
                className="flex items-center justify-center rounded-xl bg-brand/10 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand/20"
              >
                Cập nhật hồ sơ
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
