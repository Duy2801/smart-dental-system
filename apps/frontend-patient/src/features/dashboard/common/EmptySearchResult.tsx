"use client";

import Link from "next/link";
import { ROUTES } from "./routes";

type EmptySearchResultProps = {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onReset?: () => void;
};

export function EmptySearchResult({
  title = "Không tìm thấy dịch vụ hoặc bác sĩ",
  description = "Hãy thử tìm kiếm từ khóa dịch vụ, phương pháp điều trị hoặc tên bác sĩ khác",
  actionText = "Xem tất cả dịch vụ",
  actionHref = ROUTES.service,
  onReset,
}: EmptySearchResultProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[380px] w-full px-4 py-16 text-center bg-white rounded-3xl my-4">
      {/* Magnifying glass + document illustration */}
      <div className="relative mb-5 flex items-center justify-center w-28 h-28">
        <svg
          className="w-20 h-20 text-slate-200"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="18" y="10" width="34" height="46" rx="4" fill="#E2E8F0" />
          <path d="M38 10V22H52L38 10Z" fill="#CBD5E1" />
          <rect x="25" y="32" width="18" height="3" rx="1.5" fill="#94A3B8" />
          <rect x="25" y="39" width="12" height="3" rx="1.5" fill="#94A3B8" />
          <circle cx="34" cy="46" r="2" fill="#94A3B8" />
        </svg>
        <svg
          className="absolute -top-1 -left-1 w-20 h-20 text-slate-400 transform -rotate-12 drop-shadow-md"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>

      <h3 className="text-xl font-black text-slate-900 sm:text-2xl">
        {title}
      </h3>
      <p className="mt-2 text-sm text-slate-500 max-w-md leading-relaxed">
        {description}
      </p>

      {onReset ? (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 rounded-full bg-[#0058bc] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#004699]"
        >
          Xem tất cả dịch vụ
        </button>
      ) : actionHref && actionText ? (
        <Link
          href={actionHref}
          className="mt-6 rounded-full bg-[#0058bc] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#004699]"
        >
          {actionText}
        </Link>
      ) : null}
    </div>
  );
}
