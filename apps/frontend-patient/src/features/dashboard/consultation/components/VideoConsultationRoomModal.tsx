"use client";

import { useEffect, useState } from "react";
import { joinPatientConsultationRoom } from "../api";
import type { PatientConsultationItem } from "../types";
import { useAppSelector } from "@/providers";
import { useSocketEvent } from "@/service/ws/useSocket";

interface VideoConsultationRoomModalProps {
  consultation: PatientConsultationItem;
  onClose: () => void;
}

function buildPatientJitsiUrl(rawUrl: string, patientName: string) {
  let base = rawUrl.split("#")[0];
  if (base.includes("meet.ffmuc.net") || base.includes("meet.jit.si")) {
    base = base.replace(/meet\.(ffmuc\.net|jit\.si)/, "meet.darmstadt.social");
  }
  const displayName = encodeURIComponent(patientName || "Bệnh nhân");
  const toolbarButtons = encodeURIComponent(
    JSON.stringify(["microphone", "camera", "chat", "tileview", "fullscreen"]),
  );
  const subject = encodeURIComponent("Tư vấn trực tuyến - Smart Dental");
  return `${base}#userInfo.displayName="${displayName}"&config.prejoinConfig.enabled=false&config.prejoinPageEnabled=false&config.toolbarButtons=${toolbarButtons}&config.disableDeepLinking=true&config.hideConferenceSubject=true&config.subject="${subject}"&config.disableModeratorIndicator=true&config.remoteVideoMenu.disabled=true&config.disableRemoteMute=true&config.hideLobbyButton=true&config.securityUi.hideLobbyButton=true&config.readOnlyName=true&config.disableProfile=true`;
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const res = (err as { response?: { data?: { message?: unknown } } }).response;
    const msg = res?.data?.message;
    if (Array.isArray(msg) && typeof msg[0] === "string") return msg[0];
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export function VideoConsultationRoomModal({
  consultation,
  onClose,
}: VideoConsultationRoomModalProps) {
  const { user } = useAppSelector((state) => state.login);
  const patientFullName = user?.fullName || "Bệnh nhân";

  const [meetingUrl, setMeetingUrl] = useState<string | null>(
    consultation.meetingUrl || null,
  );
  const [status, setStatus] = useState<string>(consultation.status);
  const [isDoctorStarted, setIsDoctorStarted] = useState<boolean>(
    consultation.status === "IN_PROGRESS",
  );
  // Hiển thị trạng thái đang kiểm tra phòng để tránh chớp màn hình trước khi xác thực với backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callElapsed, setCallElapsed] = useState(0);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);

  // Tự động đóng modal sau 4 giây khi Bác sĩ kết thúc ca tư vấn
  useEffect(() => {
    if (status === "COMPLETED") {
      setAutoCloseCountdown(4);
      const interval = setInterval(() => {
        setAutoCloseCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status, onClose]);

  // Lắng nghe realtime sự kiện từ Bác sĩ (Bắt đầu cuộc gọi, Kết thúc cuộc gọi)
  useSocketEvent<{
    id: string;
    status: string;
    meetingUrl?: string;
  }>("consultation_updated", (data) => {
    if (data.id === consultation.id) {
      if (data.status) {
        setStatus(data.status);
      }
      if (data.status === "IN_PROGRESS") {
        setIsDoctorStarted(true);
        if (data.meetingUrl) {
          setMeetingUrl(data.meetingUrl);
        }
      }
      if (data.status === "COMPLETED" || data.status === "CANCELLED") {
        setIsDoctorStarted(false);
      }
    }
  });

  const fetchRoomData = async (isInitial = false) => {
    try {
      const res = await joinPatientConsultationRoom(consultation.id);
      if (res.meetingUrl) {
        setMeetingUrl(res.meetingUrl);
      }
      if (res.status) {
        setStatus(res.status);
      }
      if (res.status === "IN_PROGRESS" || res.isDoctorStarted) {
        setIsDoctorStarted(true);
      } else if (res.status === "COMPLETED" || res.status === "CANCELLED") {
        setIsDoctorStarted(false);
      }
      setError(null);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, "Không thể kết nối phòng tư vấn.");
      if (isInitial) {
        setError(msg);
      } else {
        console.warn("Polling consultation room warning:", msg);
      }
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    void fetchRoomData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consultation.id]);

  // Polling liên tục mỗi 2.5 giây (kể cả khi đang gọi) để tự động cập nhật ngay khi Bác sĩ bắt đầu hoặc kết thúc
  useEffect(() => {
    if (
      status === "COMPLETED" ||
      status === "CANCELLED" ||
      status === "EXPIRED" ||
      status === "DOCTOR_MISSED"
    ) {
      return;
    }
    const pollInterval = setInterval(() => {
      void fetchRoomData(false);
    }, 2500);
    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    if (!isDoctorStarted || status !== "IN_PROGRESS") return;
    const interval = setInterval(() => {
      setCallElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isDoctorStarted, status]);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const finalIframeUrl = meetingUrl
    ? buildPatientJitsiUrl(meetingUrl, patientFullName)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-6xl h-[92vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-900/90 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {(consultation.doctorName || "BS")[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  {consultation.doctorName || "Bác sĩ Chuyên khoa"}
                </h3>
                {isDoctorStarted && status === "IN_PROGRESS" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Đang Trong Cuộc Gọi
                  </span>
                ) : status === "COMPLETED" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">
                    Đã Hoàn Thành
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Phòng Chờ Tư Vấn
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Thời lượng: {consultation.durationMinutes} phút
                {isDoctorStarted && status === "IN_PROGRESS" && (
                  <>
                    {" "}· Đã tư vấn:{" "}
                    <span className="font-mono text-emerald-400 font-bold">
                      {formatElapsed(callElapsed)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
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
              {isDoctorStarted && status === "IN_PROGRESS"
                ? "Rời Phòng Gọi"
                : "Rời Phòng Chờ"}
            </button>
          </div>
        </div>

        {/* Nội dung chính: Phòng Chờ / Video Call / Hoàn thành */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium animate-pulse">
                Đang kết nối tới phòng tư vấn...
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
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          ) : status === "COMPLETED" ? (
            /* Trạng thái Bác sĩ đã kết thúc ca khám */
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center max-w-lg animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xl font-bold text-white">
                  Buổi Tư Vấn Đã Hoàn Thành
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Bác sĩ {consultation.doctorName} đã kết thúc buổi tư vấn trực tuyến. Cảm ơn bạn đã tin tưởng dịch vụ chăm sóc nha khoa tại Smart Dental!
                </p>
                {autoCloseCountdown !== null && (
                  <p className="text-xs text-emerald-400 font-semibold pt-1">
                    Cửa sổ sẽ tự động đóng sau <span className="font-mono font-bold text-sm text-white">{autoCloseCountdown}s</span>...
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                Đóng Cửa Sổ Ngay
              </button>
            </div>
          ) : status === "CANCELLED" || status === "EXPIRED" ? (
            /* Trạng thái Buổi tư vấn đã bị hủy hoặc hết hạn */
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center max-w-lg animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-white">
                  Buổi Tư Vấn Đã Bị Hủy
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Lịch tư vấn này đã bị hủy hoặc hết hạn. Vui lòng xem thông tin chi tiết và hoàn tiền trong danh sách lịch hẹn của bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          ) : status === "DOCTOR_MISSED" ? (
            /* Trạng thái Bác sĩ vắng mặt */
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center max-w-lg animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-white">
                  Bác Sĩ Vắng Mặt
                </h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Bác sĩ đã không thể tham gia ca khám đúng giờ. Hệ thống Smart Dental đã kích hoạt thủ tục hoàn tiền 100% cho bạn.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          ) : !isDoctorStarted || status !== "IN_PROGRESS" ? (
            /* Giao diện PHÒNG CHỜ (Waiting Room) chuyên nghiệp khi Bác sĩ chưa bắt đầu */
            <div className="flex flex-col items-center justify-center gap-6 p-6 sm:p-10 text-center max-w-lg animate-in fade-in duration-300">
              {/* Radar pulse animation */}
              <div className="relative flex items-center justify-center">
                <div className="absolute w-28 h-28 rounded-full bg-emerald-500/15 animate-ping" />
                <div className="absolute w-20 h-20 rounded-full bg-emerald-500/25 animate-pulse" />
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold text-2xl shadow-xl">
                  👨‍⚕️
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg sm:text-xl font-extrabold text-white">
                  Phòng Chờ Tư Vấn Trực Tuyến
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Bác sĩ <strong className="text-emerald-400 font-semibold">{consultation.doctorName}</strong> đang chuẩn bị hồ sơ ca khám.
                </p>
                <p className="text-xs text-slate-400">
                  Vui lòng giữ màn hình này, hệ thống sẽ <strong className="text-white">tự động kết nối video call</strong> ngay khi Bác sĩ bắt đầu.
                </p>
              </div>

              {/* Hướng dẫn chuẩn bị cho Bệnh nhân */}
              <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-300">
                <div className="font-bold text-slate-200 flex items-center gap-1.5 pb-1.5 border-b border-slate-800">
                  <span>💡</span> Chuẩn bị trước khi Bác sĩ kết nối:
                </div>
                <div className="flex items-center gap-2">
                  <span>🎧</span>
                  <span>Đeo tai nghe để chất lượng âm thanh tốt nhất.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>💡</span>
                  <span>Ngồi tại không gian yên tĩnh và đủ ánh sáng khuôn mặt.</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📶</span>
                  <span>Đảm bảo kết nối internet (Wifi/4G) ổn định.</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Đang chờ tín hiệu từ Bác sĩ...
              </div>
            </div>
          ) : finalIframeUrl ? (
            /* Video Iframe Jitsi khi Bác sĩ đã bắt đầu - Không có nút hangup trùng lặp! */
            <iframe
              title="Phòng gọi video tư vấn"
              src={finalIframeUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="w-full h-full border-0"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
