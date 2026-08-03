/**
 * colors.ts – Bảng màu tập trung cho Patient Dashboard
 *
 * Cách dùng:
 *   import { C } from "@/features/dashboard/common/colors";
 *   <p className={C.textPrimary}>Xin chào</p>
 */

export const C = {
  // ─── Màu thương hiệu chính ─────────────────────────────────────────────
  /** #0863c5 – xanh chính (nút, link hoạt động, icon nổi bật) */
  primary: "#0863c5",
  /** #064e9b – xanh đậm hơn (hover của nút primary) */
  primaryDark: "#064e9b",
  /** #0058bc – xanh đậm dùng cho tiêu đề, badge uppercase */
  primaryDeep: "#0058bc",
  /** #0768cf – xanh header hero */
  primaryHero: "#0768cf",
  /** #0873dc – xanh gauge/ring */
  primaryGauge: "#0873dc",

  // ─── Nền & surface ─────────────────────────────────────────────────────
  /** #f6f8fc – nền trang dashboard */
  pageBg: "#f6f8fc",
  /** white – card, footer, header */
  surface: "#ffffff",

  // ─── Slate (text, border) ──────────────────────────────────────────────
  textHeading: "text-slate-900",
  textBody: "text-slate-600",
  textMuted: "text-slate-500",
  textLabel: "text-slate-400",
  border: "border-slate-200",
  borderSoft: "border-slate-100",
  bgPage: "bg-[#f6f8fc]",
  bgSurface: "bg-white",
  bgSubtle: "bg-slate-50",

  // ─── Màu primary (Tailwind class) ──────────────────────────────────────
  textPrimary: "text-[#0863c5]",
  textPrimaryDeep: "text-[#0058bc]",
  bgPrimary: "bg-[#0863c5]",
  bgPrimaryDeep: "bg-[#0058bc]",
  hoverBgPrimary: "hover:bg-[#064e9b]",
  ringPrimary: "ring-[#0863c5]",
  borderPrimary: "border-[#0863c5]",

  // ─── Màu trạng thái ────────────────────────────────────────────────────
  success: "text-emerald-600",
  successBg: "bg-emerald-50",
  danger: "text-rose-600",
  dangerBg: "bg-rose-50",
  warning: "text-amber-600",
  warningBg: "bg-amber-50",
  info: "text-blue-800",
  infoBg: "bg-blue-50",
} as const;

/** Màu nền của các tone badge / icon nhanh */
export const TONE_CLASSES = {
  blue: "bg-blue-50 text-blue-600",
  cyan: "bg-cyan-50 text-cyan-600",
  violet: "bg-violet-50 text-violet-600",
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
} as const;

export type Tone = keyof typeof TONE_CLASSES;
