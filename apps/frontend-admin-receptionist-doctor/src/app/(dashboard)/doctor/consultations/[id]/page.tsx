"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  ChatCircleDots,
  Copy,
  FloppyDisk,
  PhoneDisconnect,
  SpinnerGap,
  User,
  VideoCamera,
  Warning,
  CheckCircle,
  XCircle,
  Sparkle,
} from "@phosphor-icons/react";
import { ROUTES } from "@/src/constants/routes";
import apiClient from "@/src/lib/api/client";
import { cn } from "@/src/lib/utils/cn";

type ConsultStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

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

function buildSummary(sessions: ChatSession[]): string[] {
  const patientLines = sessions
    .flatMap((s) => s.messages)
    .filter((m) => m.role === "patient" || m.role === "user")
    .map((m) => m.content.trim())
    .filter(Boolean);

  const unique = [...new Set(patientLines)].slice(0, 5);
  if (unique.length === 0) {
    return ["Chưa có câu hỏi nào từ bệnh nhân với Chatbot AI."];
  }
  return unique;
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
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [detail, setDetail] = useState<ConsultationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sideTab, setSideTab] = useState<SideTab>("chatbot");
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [pinCopied, setPinCopied] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<{
    bulletPoints: string[];
    questionsToAsk: string[];
    riskFlags: string[];
    disclaimer: string;
  } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ConsultationDetail>(
        `/video-consultations/${id}`,
      );
      setDetail(res.data);
      setNotes(res.data.notes ?? "");
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
      setAiSummary(null);
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!inCall) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [inCall]);

  const localSummary = useMemo(
    () => buildSummary(detail?.chatbotSessions ?? []),
    [detail],
  );

  const handleAiSummarize = async () => {
    setAiLoading(true);
    try {
      const res = await apiClient.post<{
        bulletPoints: string[];
        questionsToAsk: string[];
        riskFlags: string[];
        disclaimer: string;
      }>("/ai/doctor/summarize-patient", { consultationId: id });
      setAiSummary({
        bulletPoints: res.data.bulletPoints ?? [],
        questionsToAsk: res.data.questionsToAsk ?? [],
        riskFlags: res.data.riskFlags ?? [],
        disclaimer: res.data.disclaimer,
      });
    } catch (err) {
      alert(apiErrorMessage(err, "Không tạo được tóm tắt AI."));
    } finally {
      setAiLoading(false);
    }
  };

  const handleStart = async () => {
    if (!detail) return;
    if (!detail.isPaid) {
      const ok = confirm(
        "Buổi tư vấn chưa thanh toán. Bạn vẫn muốn bắt đầu?",
      );
      if (!ok) return;
    }
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
      alert(apiErrorMessage(err, "Không thể bắt đầu tư vấn. Vui lòng thử lại."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("Kết thúc buổi tư vấn? Link phòng sẽ hết hạn ngay.")) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/video-consultations/${id}/complete`);
      setInCall(false);
      setCallStartedAt(null);
      await load();
    } catch (err) {
      alert(apiErrorMessage(err, "Không thể kết thúc tư vấn. Vui lòng thử lại."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Hủy buổi tư vấn này? Thao tác không hoàn tác được.")) return;
    setActionLoading(true);
    try {
      await apiClient.patch(`/video-consultations/${id}/cancel`);
      setInCall(false);
      setCallStartedAt(null);
      await load();
    } catch (err) {
      alert(apiErrorMessage(err, "Không thể hủy buổi tư vấn."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (notes.length > NOTES_MAX) {
      setNotesError(`Ghi chú tối đa ${NOTES_MAX.toLocaleString("vi-VN")} ký tự.`);
      return;
    }
    setNotesError(null);
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      await apiClient.patch(`/video-consultations/${id}/notes`, {
        notes: notes.trim() || null,
      });
      setNotes(notes.trim());
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
    } catch (err) {
      alert(apiErrorMessage(err, "Lưu ghi chú thất bại."));
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCopyPin = async () => {
    if (!detail?.roomPin) return;
    try {
      await navigator.clipboard.writeText(detail.roomPin);
      setPinCopied(true);
      setTimeout(() => setPinCopied(false), 2000);
    } catch {
      alert(`Mã PIN: ${detail.roomPin}`);
    }
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
        <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          <Warning size={18} />
          {error ?? "Không tìm thấy buổi tư vấn."}
        </div>
      </div>
    );
  }

  const cfg = STATUS_CFG[detail.status];
  const canStart =
    detail.status === "SCHEDULED" ||
    (detail.status === "IN_PROGRESS" && !detail.meetingUrl);
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
              onClick={() => router.push(ROUTES.DOCTOR.CONSULTATIONS)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-brand"
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
              {showCall ? (() => {
                const sec = elapsedSec(callStartedAt);
                const limitSec = detail.durationMinutes * 60;
                const over = sec > limitSec;
                const warn = !over && sec >= limitSec - 5 * 60;
                return (
                  <span className={cn(
                    "ml-1 font-semibold",
                    over ? "text-red-600" : warn ? "text-amber-500" : "text-muted-foreground",
                  )}>
                    · {elapsedLabel(sec)}{over ? " — Quá giờ" : warn ? " — Sắp hết giờ" : ""}
                  </span>
                );
              })() : null}
              <span className="sr-only">{tick}</span>
            </p>
            {showCall && detail.roomPin ? (
              <p className="flex flex-wrap items-center gap-2 text-sm text-brand-dark">
                <span>
                  Mã PIN phòng:{" "}
                  <span className="font-mono text-base font-bold tracking-widest">
                    {detail.roomPin}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="inline-flex items-center gap-1 rounded-md bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand hover:bg-brand/15"
                >
                  <Copy size={12} />
                  {pinCopied ? "Đã copy" : "Copy PIN"}
                </button>
                <span className="text-xs font-normal text-muted-foreground">
                  (gửi cho bệnh nhân)
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {canStart && (
              <button
                type="button"
                onClick={handleStart}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
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
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60"
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
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
              >
                <XCircle size={16} />
                Hủy buổi
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] flex-1 grid-cols-1 gap-6 p-4 md:p-6 xl:grid-cols-12">
        <section className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm xl:col-span-7">
          <div className="relative flex min-h-[320px] flex-1 flex-col bg-[#0b1a33] sm:min-h-[420px]">
            {showCall ? (
              <iframe
                title="Phòng tư vấn video"
                src={detail.meetingUrl!}
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
                        : 'Xem lịch sử Chatbot bên phải trước khi gọi. Khi sẵn sàng, bấm "Bắt đầu tư vấn" — hệ thống tạo phòng ngẫu nhiên + mã PIN.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {showCall && (
            <div className="flex items-center justify-center gap-3 border-t border-border bg-slate-50/80 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Mic/camera điều khiển trong cửa sổ Jitsi
              </p>
              <button
                type="button"
                onClick={handleComplete}
                disabled={actionLoading}
                className="flex h-11 items-center gap-2 rounded-full bg-red-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
              >
                <PhoneDisconnect size={18} weight="bold" />
                Kết thúc
              </button>
            </div>
          )}
        </section>

        <section className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm xl:col-span-5">
          <div className="flex border-b border-border bg-slate-50/60 p-1.5">
            <button
              type="button"
              onClick={() => setSideTab("chatbot")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
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
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
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
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="border-b border-border bg-brand-light/40 px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-dark/70">
                    Tóm tắt trước khi gọi
                  </p>
                  <button
                    type="button"
                    onClick={handleAiSummarize}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
                  >
                    <Sparkle size={12} weight="fill" />
                    {aiLoading ? "Đang tạo…" : "Tóm tắt AI"}
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {(aiSummary?.bulletPoints?.length
                    ? aiSummary.bulletPoints
                    : localSummary
                  ).map((line, i) => (
                    <li
                      key={i}
                      className="flex gap-2 text-sm leading-snug text-brand-dark"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      {line}
                    </li>
                  ))}
                </ul>
                {aiSummary?.questionsToAsk?.length ? (
                  <div className="mt-3 space-y-1.5 border-t border-brand/20 pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-dark/70">
                      Câu hỏi nên hỏi thêm
                    </p>
                    {aiSummary.questionsToAsk.map((q, i) => (
                      <p key={i} className="text-sm text-brand-dark">
                        · {q}
                      </p>
                    ))}
                  </div>
                ) : null}
                {aiSummary?.riskFlags?.length ? (
                  <div className="mt-3 space-y-1.5 border-t border-amber-200/80 pt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800/80">
                      Cờ lưu ý
                    </p>
                    {aiSummary.riskFlags.map((f, i) => (
                      <p key={i} className="text-sm text-amber-900">
                        · {f}
                      </p>
                    ))}
                  </div>
                ) : null}
                {aiSummary?.disclaimer ? (
                  <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                    {aiSummary.disclaimer}
                  </p>
                ) : null}
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto p-4">
                {detail.chatbotSessions.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Bệnh nhân chưa có phiên chat với AI.
                  </p>
                ) : (
                  detail.chatbotSessions.map((session) => (
                    <div key={session.id} className="space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Phiên {formatWhen(session.startedAt)} · {session.status}
                      </p>
                      <div className="space-y-2.5">
                        {session.messages.map((msg, idx) => {
                          const isPatient =
                            msg.role === "patient" || msg.role === "user";
                          return (
                            <div
                              key={`${session.id}-${idx}`}
                              className={cn(
                                "max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                                isPatient
                                  ? "ml-auto bg-brand text-white"
                                  : "mr-auto bg-slate-100 text-slate-800",
                              )}
                            >
                              <p className="mb-0.5 text-[10px] font-semibold uppercase opacity-70">
                                {isPatient ? "Bệnh nhân" : "Chatbot AI"}
                              </p>
                              {msg.content}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              <div className="space-y-3 rounded-xl bg-slate-50 p-4 ring-1 ring-inset ring-border/60">
                <InfoRow label="Họ tên" value={detail.patientName} />
                <InfoRow label="Mã BN" value={detail.patientCode} />
                <InfoRow label="Số điện thoại" value={detail.patientPhone ?? "—"} />
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
                  <p className="text-xs font-medium text-red-600">{notesError}</p>
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
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
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
