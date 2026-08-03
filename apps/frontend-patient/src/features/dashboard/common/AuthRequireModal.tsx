"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardIcon } from "./DashboardIcon";
import { ROUTES } from "./routes";

type AuthRequireModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  returnUrl?: string;
};

export function AuthRequireModal({
  isOpen,
  onClose,
  title = "Yêu cầu đăng nhập tài khoản",
  description = "Vui lòng đăng nhập tài khoản bệnh nhân để có thể áp dụng mã ưu đãi và đặt lịch hẹn khám tại Smart Dental.",
  returnUrl = "/promotions",
}: AuthRequireModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.setProperty("overflow", "hidden", "important");
      return () => {
        document.body.style.removeProperty("overflow");
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmLogin = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("redirect_after_login", returnUrl);
    }
    onClose();
    router.push(ROUTES.login);
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
        >
          <DashboardIcon name="close" className="h-4 w-4" />
        </button>

        {/* Lock / User Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0058bc]">
          <DashboardIcon name="sparkles" className="h-8 w-8 text-[#0058bc]" />
        </div>

        {/* Content */}
        <div className="mt-4 text-center space-y-2">
          <h3 className="text-lg font-black text-slate-900">{title}</h3>
          <p className="text-xs leading-relaxed text-slate-600 px-2">
            {description}
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={handleConfirmLogin}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0058bc] py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-[#004698] hover:shadow-xl active:scale-98"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    </div>
  );
}
