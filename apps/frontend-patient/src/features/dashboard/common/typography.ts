/**
 * typography.ts – Kiểu chữ chuẩn cho Patient Dashboard
 *
 * Cách dùng:
 *   import { T } from "@/features/dashboard/common/typography";
 *   <h1 className={T.pageTitle}>Trang chủ</h1>
 */

export const T = {
  // ─── Tiêu đề trang (h1) ────────────────────────────────────────────────
  /** Dùng cho h1 – hero banner, trang chính */
  pageTitle: "text-4xl font-bold leading-[1.08] tracking-[-0.045em] sm:text-5xl",

  // ─── Tiêu đề section (h2) ──────────────────────────────────────────────
  /** Tiêu đề section trong trang (ví dụ: "Lịch hẹn sắp tới") */
  sectionTitle: "text-xl font-bold tracking-[-0.02em] text-slate-900",
  /** Tiêu đề section lớn, dùng ở vùng marketing (FAQ, hero landing) */
  sectionTitleLg: "text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl",

  // ─── Tiêu đề card (h3) ─────────────────────────────────────────────────
  /** Card title – bên trong card/panel */
  cardTitle: "text-lg font-bold text-slate-900",
  /** Card title lớn hơn, dùng cho card nổi bật */
  cardTitleLg: "text-lg font-extrabold leading-snug text-slate-950",

  // ─── Nhãn trên (overline / eyebrow) ────────────────────────────────────
  /** Dòng chữ nhỏ, in hoa, trước tiêu đề section */
  overline: "text-[14px] font-bold uppercase tracking-[0.32em] text-[#0058bc]",
  /** Phiên bản nhỏ hơn dùng trong badge/chip */

  // ─── Body text ─────────────────────────────────────────────────────────
  /** Body chính, dùng cho đoạn mô tả */
  body: "text-sm leading-6 text-slate-600",
  /** Body nhỏ hơn */
  bodySm: "text-xs leading-5 text-slate-500",
  /** Caption – ghi chú rất nhỏ */
  caption: "text-[11px] leading-relaxed text-slate-500",
  /** Caption dùng trong footer */
  footerCaption: "text-[11px] text-slate-500",

  // ─── Label / metadata ──────────────────────────────────────────────────
  /** Label trường thông tin (nhỏ, uppercase, muted) */
  fieldLabel: "text-[10px] font-semibold uppercase tracking-wide text-slate-400",
  /** Giá trị trường thông tin */
  fieldValue: "mt-0.5 text-xs font-bold text-slate-700",

  // ─── Liên kết (link) ───────────────────────────────────────────────────
  /** Link thường trong section */
  link: "text-sm font-semibold text-[#0863c5] hover:underline",
  /** Link uppercase dạng CTA nhỏ */
  linkCta: "text-xs font-extrabold uppercase tracking-[0.16em] text-[#0058bc]",

  // ─── Số / metric lớn ───────────────────────────────────────────────────
  /** Số lớn trong gauge / stat card */
  statNumber: "text-2xl leading-none text-slate-900",
  /** Đơn vị / suffix bên cạnh số lớn */
  statUnit: "text-[10px] font-semibold text-slate-400",

  // ─── Tên thương hiệu ───────────────────────────────────────────────────
  /** Tên "Smart Dental System" trên header */
  brandName: "truncate text-[17px] font-extrabold leading-none",
  /** Tên thương hiệu trong footer */
  brandNameFooter: "font-extrabold text-[#0058bc] text-sm",
} as const;
