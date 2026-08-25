"use client";

import { useEffect, useState } from "react";
import { joinPatientConsultationRoom } from "../api";
import type { PatientConsultationItem } from "../types";

interface VideoConsultationRoomModalProps {
  consultation: PatientConsultationItem;
  onClose: () => void;
}

export function VideoConsultationRoomModal({
  consultation,
  onClose,
}: VideoConsultationRoomModalProps) {
  const [meetingUrl, setMeetingUrl] = useState<string | null>(
    consultation.meetingUrl || null,
  );
  const [roomPin, setRoomPin] = useState<string | null>(
    consultation.roomPin || null,
  );
  const [loading, setLoading] = useState(!consultation.meetingUrl);
  const [error, setError] = useState<string | null>(null);
  const [pinCopied, setPinCopied] = useState(false);
  const [callElapsed, setCallElapsed] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function initRoom() {
      if (consultation.meetingUrl) {
        setMeetingUrl(consultation.meetingUrl);
        setRoomPin(consultation.roomPin || null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await joinPatientConsultationRoom(consultation.id);
        if (isMounted) {
          setMeetingUrl(res.meetingUrl);
          setRoomPin(res.roomPin);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const msg =
            err instanceof Error
              ? err.message
              : "Không thể tham gia phòng tư vấn trực tuyến.";
          setError(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void initRoom();

    return () => {
      isMounted = false;
    };
  }, [consultation]);

  useEffect(() => {
    if (!meetingUrl) return;
    const interval = setInterval(() => {
      setCallElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [meetingUrl]);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleCopyPin = async () => {
    if (!roomPin) return;
    try {
      await navigator.clipboard.writeText(roomPin);
      setPinCopied(true);
      setTimeout(() => setPinCopied(false), 2000);
    } catch {
      alert(`Mã PIN phòng: ${roomPin}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-6xl h-[92vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {(consultation.doctorName || "BS")[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  {consultation.doctorName || "Bác sĩ Chuyên khoa"}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Đang Tư Vấn Trực Tuyến
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Thời lượng: {consultation.durationMinutes} phút · Đã tư vấn:{" "}
                <span className="font-mono text-emerald-400 font-bold">
                  {formatElapsed(callElapsed)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {roomPin && (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                <span>
                  Mã PIN:{" "}
                  <strong className="font-mono text-amber-400 text-sm tracking-wider">
                    {roomPin}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopyPin}
                  className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md font-medium text-[11px] transition-colors"
                >
                  {pinCopied ? "Đã copy" : "Copy"}
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Rời Phòng Gọi
            </button>
          </div>
        </div>

        {/* Video Frame Area */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium animate-pulse">
                Đang khởi tạo phòng gọi video với Bác sĩ...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center max-w-md">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-rose-400 text-sm font-medium">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700"
              >
                Đóng
              </button>
            </div>
          ) : meetingUrl ? (
            <iframe
              title="Phòng gọi video tư vấn"
              src={meetingUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
