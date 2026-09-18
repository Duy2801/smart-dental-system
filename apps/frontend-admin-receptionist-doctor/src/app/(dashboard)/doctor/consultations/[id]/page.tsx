"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  ChatCircleDots,
  FloppyDisk,
  PhoneDisconnect,
  SpinnerGap,
  User,
  VideoCamera,
  Warning,
  CheckCircle,
  XCircle,
  PaperPlaneTilt,
  Sparkle,
  CaretUp,
  CaretDown,
} from "@phosphor-icons/react";
import { PatientAiBrief } from "@/src/components/doctor/patient-ai-brief";
import { ROUTES } from "@/src/constants/routes";
import apiClient from "@/src/lib/api/client";
import { cn } from "@/src/lib/utils/cn";
import { useAppDialog } from "@/src/providers/app-dialog-provider";
import { getDoctorInfoFromCookie } from "@/src/lib/doctor/session";

function buildDoctorJitsiUrl(rawUrl: string, doctorFullName?: string | null) {
  let base = rawUrl.split("#")[0];
  if (base.includes("meet.ffmuc.net") || base.includes("meet.jit.si")) {
    base = base.replace(/meet\.(ffmuc\.net|jit\.si)/, "meet.darmstadt.social");
  }
  const displayName = encodeURIComponent(
    doctorFullName ? `BS. ${doctorFullName}` : "Bác sĩ Chuyên khoa",
  );
  const toolbarButtons = encodeURIComponent(
    JSON.stringify(["microphone", "camera", "chat", "tileview", "fullscreen"]),
  );
  const subject = encodeURIComponent("Tư vấn trực tuyến - Smart Dental");
  return `${base}#userInfo.displayName="${displayName}"&config.prejoinConfig.enabled=false&config.prejoinPageEnabled=false&config.toolbarButtons=${toolbarButtons}&config.disableDeepLinking=true&config.hideConferenceSubject=true&config.subject="${subject}"&config.disableModeratorIndicator=true`;
}

type ConsultStatus =
  | "PENDING_PAYMENT"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "DOCTOR_MISSED";

type ChatMessage = { role: string; content: string };

type ChatSession = {
  id: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  messages: ChatMessage[];
};

type ConsultationDetail = {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  patientPhone: string | null;
  medicalHistory: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: ConsultStatus;
  meetingUrl: string | null;
  roomPin: string | null;
  fee: number;
  isPaid: boolean;
  notes: string | null;
  chatbotSessions: ChatSession[];
};

type SideTab = "chatbot" | "patient";

const NOTES_MAX = 10000;

const STATUS_CFG: Record<ConsultStatus, { label: string; color: string }> = {
  PENDING_PAYMENT: {
    label: "Chờ thanh toán",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  SCHEDULED: {
    label: "Sắp tới",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  IN_PROGRESS: {
    label: "Đang diễn ra",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  COMPLETED: {
    label: "Hoàn thành",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  CANCELLED: {
    label: "Đã hủy",
    color: "bg-red-100 text-red-600 border-red-200",
  },
  EXPIRED: {
    label: "Đã hết hạn",
    color: "bg-slate-100 text-slate-600 border-slate-200",
  },
  DOCTOR_MISSED: {
    label: "Bác sĩ vắng mặt",
    color: "bg-red-100 text-red-600 border-red-200",
  },
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function elapsedSec(startedAt: number | null) {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}

function elapsedLabel(sec: number) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function apiErrorMessage(err: unknown, fallback: string) {
  if (!axios.isAxiosError(err)) return fallback;
  const raw = err.response?.data?.message;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  if (typeof raw === "string" && raw.trim()) return raw;
  return fallback;
}

export default function ConsultationRoomPage() {
  const { showAlert, showConfirm } = useAppDialog();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [detail, setDetail] = useState<ConsultationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sideTab, setSideTab] = useState<SideTab>("chatbot");
  const [briefExpanded, setBriefExpanded] = useState(true);
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState("");
  const [notesError, setNotesError] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [inCall, setInCall] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [doctorName, setDoctorName] = useState<string | null>(null);

  useEffect(() => {
    const info = getDoctorInfoFromCookie();
    setDoctorName(info.fullName || info.doctorName || "Huỳnh Mai Chi");
  }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ConsultationDetail>(
        `/video-consultations/${id}`,
      );
      setDetail(res.data);
      setNotes(res.data.notes ?? "");
      setSavedNotes(res.data.notes ?? "");
      if (res.data.status === "IN_PROGRESS" && res.data.meetingUrl) {
        setInCall(true);
        setCallStartedAt((prev) => prev ?? Date.now());
      } else {
        setInCall(false);
        setCallStartedAt(null);
      }
    } catch (err) {
      setError(apiErrorMessage(err, "Không thể tải buổi tư vấn."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!inCall) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [inCall]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (notes === savedNotes) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [notes, savedNotes]);

  const handleSendReminder = async () => {
    setSendingReminder(true);
    try {
      await apiClient.post(`/video-consultations/${id}/send-reminder`);
      setToast({
        message: `✓ Đã gửi Link phòng Video Call & Lời nhắc qua Gmail & App cho ${detail?.patientName}!`,
        type: "success",
      });
      setTimeout(() => setToast(null), 4500);
    } catch (err: unknown) {
      const msg = apiErrorMessage(
        err,
        "Không thể gửi email lời nhắc phòng tư vấn.",
      );
      setToast({
        message: Array.isArray(msg) ? msg[0] : msg,
        type: "error",
      });
      setTimeout(() => setToast(null), 4500);
    } finally {
      setSendingReminder(false);
    }
  };

  const handleStart = async () => {
    if (!detail) return;
    setActionLoading(true);
    try {
      const res = await apiClient.patch<
        Pick<ConsultationDetail, "status" | "meetingUrl" | "roomPin">
      >(`/video-consultations/${id}/start`);
      setDetail((prev) =>
        prev
          ? {
              ...prev,
              status: res.data.status,
              meetingUrl: res.data.meetingUrl,
              roomPin: res.data.roomPin,
            }
          : prev,
      );
      setInCall(true);
      setCallStartedAt(Date.now());
    } catch (err) {
      await showAlert({
        title: "Không thể bắt đầu tư vấn",
        description: apiErrorMessage(
          err,
          "Không thể bắt đầu tư vấn. Vui lòng thử lại.",
        ),
        tone: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    const confirmed = await showConfirm({
      title: "Kết thúc buổi tư vấn?",
      description: "Link phòng sẽ hết hạn ngay sau khi kết thúc.",
      confirmLabel: "Kết thúc tư vấn",
      tone: "danger",
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/video-consultations/${id}/complete`);
      setInCall(false);
      setCallStartedAt(null);
      await load();
      setToast({
        message: "Đã hoàn thành buổi tư vấn thành công.",
        type: "success",
      });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      await showAlert({
        title: "Không thể kết thúc tư vấn",
        description: apiErrorMessage(
          err,
          "Không thể kết thúc tư vấn. Vui lòng thử lại.",
        ),
        tone: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = await showConfirm({
      title: "Hủy buổi tư vấn?",
      description:
        "Thao tác này không thể hoàn tác. Tiền phí đã thanh toán sẽ được hoàn lại 100%.",
      confirmLabel: "Hủy buổi tư vấn",
      tone: "danger",
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/video-consultations/${id}/cancel`);
      setInCall(false);
      setCallStartedAt(null);
      await load();
      setToast({
        message: "Đã hủy buổi tư vấn thành công.",
        type: "success",
      });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      await showAlert({
        title: "Không thể hủy buổi tư vấn",
        description: apiErrorMessage(err, "Không thể hủy buổi tư vấn."),
        tone: "danger",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (notes.length > NOTES_MAX) {
      setNotesError(
        `Ghi chú tối đa ${NOTES_MAX.toLocaleString("vi-VN")} ký tự.`,
      );
      return;
    }
    setNotesError(null);
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      await apiClient.patch(`/video-consultations/${id}/notes`, {
        notes: notes.trim() || null,
        previousNotes: savedNotes || null,
      });
      setNotes(notes.trim());
      setSavedNotes(notes.trim());
      setDetail((prev) =>
        prev ? { ...prev, notes: notes.trim() || null } : prev,
      );
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
      setToast({
        message: "Đã lưu ghi chú lâm sàng thành công.",
        type: "success",
      });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      await showAlert({
        title: "Không thể lưu ghi chú",
        description: apiErrorMessage(err, "Lưu ghi chú thất bại."),
        tone: "danger",
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const handleBack = async () => {
    if (notes !== savedNotes) {
      const leave = await showConfirm({
        title: "Rời trang khi chưa lưu?",
        description: "Các thay đổi trong ghi chú sẽ bị mất.",
        confirmLabel: "Rời trang",
        tone: "danger",
      });
      if (!leave) return;
    }
    router.push(ROUTES.DOCTOR.CONSULTATIONS);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <SpinnerGap size={32} className="animate-spin text-brand" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4 p-6 md:p-8">
        <Link
          href={ROUTES.DOCTOR.CONSULTATIONS}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
        >
          <ArrowLeft size={14} />
          Quay lại danh sách
        </Link>
        <div className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          <div className="flex items-center gap-3">
            <Warning size={18} className="shrink-0" />
            <span>{error ?? "Không tìm thấy buổi tư vấn."}</span>
          </div>
          <button
            type="button"
            onClick={load}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CFG[detail.status];
  const canStart = detail.status === "SCHEDULED" && detail.isPaid;
  const canRemind = detail.status === "SCHEDULED" && detail.isPaid;
  const canCancel =
    detail.status === "SCHEDULED" || detail.status === "IN_PROGRESS";
  const notesEditable =
    detail.status === "SCHEDULED" ||
    detail.status === "IN_PROGRESS" ||
    detail.status === "COMPLETED";
  const showCall = inCall && !!detail.meetingUrl;

  return (
    <div className="flex min-h-[calc(100dvh-0px)] flex-col bg-slate-50/50">
      <div className="border-b border-border bg-white px-6 py-4 md:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-brand cursor-pointer"
            >
              <ArrowLeft size={12} />
              Tư vấn trực tuyến
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-brand-dark">
                {detail.patientName}
              </h1>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                {detail.patientCode}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  cfg.color,
                )}
              >
                {cfg.label}
              </span>
              {!detail.isPaid && detail.status !== "CANCELLED" ? (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  Chưa thanh toán
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {formatWhen(detail.scheduledAt)} · {detail.durationMinutes} phút
              {showCall
                ? (() => {
                    const sec = elapsedSec(callStartedAt);
                    const limitSec = detail.durationMinutes * 60;
                    const over = sec > limitSec;
                    const warn = !over && sec >= limitSec - 5 * 60;
                    return (
                      <span
                        className={cn(
                          "ml-1 font-semibold",
                          over
                            ? "text-red-600"
                            : warn
                              ? "text-amber-500"
                              : "text-muted-foreground",
                        )}
                      >
                        · {elapsedLabel(sec)}
                        {over ? " - Quá giờ" : warn ? " - Sắp hết giờ" : ""}
                      </span>
                    );
                  })()
                : null}
              <span className="sr-only">{tick}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canRemind && (
              <button
                type="button"
                onClick={handleSendReminder}
                disabled={sendingReminder || actionLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-60 cursor-pointer"
                title="Gửi link phòng Video Call & Lời nhắc qua Gmail + App cho bệnh nhân"
              >
                <PaperPlaneTilt
                  size={16}
                  weight="bold"
                  className={sendingReminder ? "animate-spin" : ""}
                />
                {sendingReminder ? "Đang gửi..." : "Gửi link phòng (Gmail)"}
              </button>
            )}
            {canStart && (
              <button
                type="button"
                onClick={handleStart}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60 cursor-pointer"
              >
                <VideoCamera size={16} weight="bold" />
                {actionLoading ? "Đang mở..." : "Bắt đầu tư vấn"}
              </button>
            )}
            {showCall && (
              <button
                type="button"
                onClick={handleComplete}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60 cursor-pointer"
              >
                <PhoneDisconnect size={16} weight="bold" />
                Kết thúc
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 cursor-pointer"
              >
                <XCircle size={16} />
                Hủy buổi
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-6 p-4 md:p-6 xl:min-h-0 xl:h-[calc(100dvh-125px)] xl:grid-cols-12 xl:overflow-hidden">
        <section className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm xl:col-span-7 xl:h-full xl:min-h-0">
          <div className="relative flex min-h-[320px] flex-1 flex-col bg-[#0b1a33] sm:min-h-[420px]">
            {showCall ? (
              <iframe
                title="Phòng tư vấn video"
                src={buildDoctorJitsiUrl(detail.meetingUrl!, doctorName)}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <VideoCamera size={28} weight="duotone" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-white">
                    {detail.status === "CANCELLED"
                      ? "Buổi tư vấn đã hủy"
                      : detail.status === "COMPLETED"
                        ? "Buổi tư vấn đã kết thúc"
                        : "Chuẩn bị phòng tư vấn"}
                  </p>
                  <p className="max-w-sm text-sm text-white/65">
                    {detail.status === "COMPLETED"
                      ? "Link phòng đã hết hạn và không thể vào lại."
                      : detail.status === "CANCELLED"
                        ? "Không thể bắt đầu buổi đã hủy."
                        : 'Xem lịch sử Chatbot bên phải trước khi gọi. Khi sẵn sàng, bấm "Bắt đầu tư vấn" để hệ thống tạo phòng bảo mật bằng liên kết riêng.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {showCall && (
            <div className="flex shrink-0 items-center justify-between border-t border-border bg-slate-50/90 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-xs font-semibold text-emerald-800">
                  Đang trong cuộc gọi trực tuyến với bệnh nhân
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Để kết thúc phiên khám, bấm nút <strong>"Kết thúc"</strong> màu đỏ ở thanh tác vụ trên cùng
              </p>
            </div>
          )}
        </section>

        <section className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm xl:col-span-5 xl:h-full xl:min-h-0">
          <div className="flex shrink-0 border-b border-border bg-slate-50/60 p-1.5">
            <button
              type="button"
              onClick={() => setSideTab("chatbot")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer",
                sideTab === "chatbot"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-muted-foreground hover:text-brand-dark",
              )}
            >
              <ChatCircleDots size={16} />
              Chatbot AI
            </button>
            <button
              type="button"
              onClick={() => setSideTab("patient")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors cursor-pointer",
                sideTab === "patient"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-muted-foreground hover:text-brand-dark",
              )}
            >
              <User size={16} />
              Thông tin BN
            </button>
          </div>

          {sideTab === "chatbot" ? (
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
              {/* AI Brief Area with Collapsible Header & Scroll */}
              <div className="shrink-0 border-b border-border bg-white">
                <div className="flex items-center justify-between border-b border-border/60 bg-slate-50/70 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-light text-brand">
                      <Sparkle size={12} weight="fill" />
                    </span>
                    <span className="text-xs font-semibold text-brand-dark">
                      Hồ sơ AI trước ca khám
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBriefExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:text-brand-dark cursor-pointer transition-colors"
                  >
                    {briefExpanded ? (
                      <>
                        <span>Thu gọn</span>
                        <CaretUp size={12} weight="bold" />
                      </>
                    ) : (
                      <>
                        <span>Mở rộng</span>
                        <CaretDown size={12} weight="bold" />
                      </>
                    )}
                  </button>
                </div>
                {briefExpanded && (
                  <div className="max-h-[260px] overflow-y-auto custom-scrollbar">
                    <PatientAiBrief
                      key={id}
                      consultationId={id}
                      patientId={detail.patientId}
                      patientName={detail.patientName}
                      compact
                      className="rounded-none border-none shadow-none"
                    />
                  </div>
                )}
              </div>

              {/* Chatbot Messages Section with dedicated header and scrollbar */}
              <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/60 bg-slate-50/70 px-4 py-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <ChatCircleDots size={14} className="text-brand" weight="bold" />
                    <span className="text-xs font-semibold text-slate-700">
                      Lịch sử trò chuyện Chatbot AI
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
                    {detail.chatbotSessions?.length ?? 0} phiên
                  </span>
                </div>

                <div className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4 custom-scrollbar">
                  {!detail.chatbotSessions ||
                  detail.chatbotSessions.length === 0 ? (
                    <div className="py-12 text-center">
                      <ChatCircleDots
                        size={32}
                        className="mx-auto text-slate-300 mb-2"
                        weight="duotone"
                      />
                      <p className="text-xs text-muted-foreground">
                        Bệnh nhân chưa có phiên chat với AI.
                      </p>
                    </div>
                  ) : (
                    (detail.chatbotSessions ?? []).map((session) => (
                      <div
                        key={session.id}
                        className="rounded-xl border border-border/80 bg-white p-3 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Phiên {formatWhen(session.startedAt)}
                          </p>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                            {session.status}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {session.messages.map((msg, idx) => {
                            const isPatient =
                              msg.role === "patient" || msg.role === "user";
                            return (
                              <div
                                key={`${session.id}-${idx}`}
                                className={cn(
                                  "max-w-[88%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed",
                                  isPatient
                                    ? "ml-auto bg-brand text-white shadow-xs rounded-br-xs"
                                    : "mr-auto bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200/60",
                                )}
                              >
                                <p
                                  className={cn(
                                    "mb-1 text-[9px] font-bold uppercase tracking-wider",
                                    isPatient ? "text-white/80" : "text-slate-500",
                                  )}
                                >
                                  {isPatient ? "Bệnh nhân" : "Chatbot AI"}
                                </p>
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto p-4 custom-scrollbar">
              <div className="space-y-3 rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-border/60">
                <InfoRow label="Họ tên" value={detail.patientName} />
                <InfoRow label="Mã BN" value={detail.patientCode} />
                <InfoRow
                  label="Số điện thoại"
                  value={detail.patientPhone ?? "-"}
                />
                <InfoRow
                  label="Tiền sử"
                  value={detail.medicalHistory?.trim() || "Chưa ghi nhận"}
                />
                <InfoRow
                  label="Phí tư vấn"
                  value={`${detail.fee.toLocaleString("vi-VN")}đ · ${detail.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}`}
                />
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Ghi chú tư vấn
                  </label>
                  <span
                    className={cn(
                      "text-[11px] tabular-nums",
                      notes.length > NOTES_MAX
                        ? "font-semibold text-red-600"
                        : "text-muted-foreground",
                    )}
                  >
                    {notes.length.toLocaleString("vi-VN")}/
                    {NOTES_MAX.toLocaleString("vi-VN")}
                  </span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    if (notesError) setNotesError(null);
                  }}
                  rows={7}
                  maxLength={NOTES_MAX + 200}
                  disabled={!notesEditable}
                  placeholder="Ghi nhận triệu chứng, tư vấn đã đưa, hướng xử trí..."
                  className="w-full flex-1 resize-none rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-brand focus:ring-1 focus:ring-brand disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-muted-foreground"
                />
                {notesError ? (
                  <p className="text-xs font-medium text-red-600">
                    {notesError}
                  </p>
                ) : null}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {notesSaved ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                      <CheckCircle size={14} weight="fill" />
                      Đã lưu
                    </span>
                  ) : (
                    <span />
                  )}
                  {notesEditable ? (
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      disabled={savingNotes || notes.length > NOTES_MAX}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60 cursor-pointer"
                    >
                      <FloppyDisk size={15} />
                      {savingNotes ? "Đang lưu..." : "Lưu ghi chú"}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* FLOATING SUCCESS / ERROR TOAST */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-bold shadow-xl backdrop-blur-xs animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white text-[10px] ${
              toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
            }`}
          >
            {toast.type === "success" ? "✓" : "!"}
          </span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-brand-dark">{value}</p>
    </div>
  );
}
