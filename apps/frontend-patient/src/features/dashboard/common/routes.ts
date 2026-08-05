/**
 * routes.ts – Định nghĩa điều hướng tập trung cho Patient Dashboard
 *
 * Cách dùng:
 *   import { ROUTES, buildRoute } from "@/features/dashboard/common/routes";
 *
 *   // Điều hướng cố định
 *   <Link href={ROUTES.home}>Trang chủ</Link>
 *
 *   // Điều hướng có tham số
 *   <Link href={buildRoute.appointmentBooking(serviceId)}>Đặt lịch</Link>
 */

/** Các route cố định */
export const ROUTES = {
  // ─── Trang chính ─────────────────────────────────────────────────────
  home: "/home",
  appointment: "/appointment",
  service: "/service",
  records: "/records",
  profile: "/profile",
  notification: "/notification",
  payment: "/payment",
  doctor: "/doctor",
  promotions: "/promotions",

  // ─── Auth ─────────────────────────────────────────────────────────────
  login: "/auth/login",
  register: "/auth/register",

  // ─── Trang tĩnh (footer) ──────────────────────────────────────────────
  contact: "/contact",
  privacy: "/privacy",
  terms: "/terms",
} as const;

/** Menu điều hướng chính trên header */
export const MAIN_NAV = [
  { label: "Trang chủ", href: ROUTES.home },
  { label: "Ưu đãi", href: ROUTES.promotions },
  { label: "Lịch hẹn", href: ROUTES.appointment },
  { label: "Dịch vụ", href: ROUTES.service },
  { label: "Hồ sơ", href: ROUTES.records },
] as const;

/** Các link cuối trang (footer quick links) */
export const FOOTER_LINKS = [
  { label: "Hỗ trợ", href: ROUTES.contact },
  { label: "Bảo mật", href: ROUTES.privacy },
  { label: "Điều khoản", href: ROUTES.terms },
] as const;

/**
 * Các route có tham số động – dùng hàm để build URL
 */
export const buildRoute = {
  /** Trang đặt lịch với service & treatmentMethod được chọn sẵn */
  appointmentBooking: (serviceId?: string | number, methodId?: string | number) => {
    const params = new URLSearchParams({ intent: "booking" });
    if (serviceId) params.set("service", String(serviceId));
    if (methodId) params.set("treatmentMethod", String(methodId));
    return `${ROUTES.appointment}?${params.toString()}`;
  },

  /** Trang đặt lịch với từ khoá tìm kiếm */
  appointmentWithKeyword: (keyword: string) =>
    `${ROUTES.appointment}?keyword=${encodeURIComponent(keyword)}`,

  /** Trang dịch vụ có từ khoá tìm kiếm */
  serviceSearch: (keyword: string) =>
    keyword.trim()
      ? `${ROUTES.service}?keyword=${encodeURIComponent(keyword.trim())}`
      : ROUTES.service,

  /** Chi tiết bác sĩ */
  doctorDetail: (doctorId: string | number) => `${ROUTES.doctor}/${doctorId}`,

  /** Chi tiết dịch vụ */
  serviceDetail: (serviceId: string | number) => `${ROUTES.service}/${serviceId}`,

  /** Đặt lịch kết hợp service + method */
  appointmentWithService: (serviceId: string | number, methodId?: string | number) => {
    const params = new URLSearchParams({ intent: "booking" });
    if (serviceId) params.set("service", String(serviceId));
    if (methodId) params.set("treatmentMethod", String(methodId));
    return `${ROUTES.appointment}?${params.toString()}`;
  },

  /** Áp dụng mã ưu đãi khi đặt lịch khám */
  applyPromotion: (code: string, serviceId?: string | number) =>
    serviceId
      ? `${ROUTES.appointment}?service=${serviceId}&promoCode=${encodeURIComponent(code)}&intent=booking`
      : `${ROUTES.appointment}?promoCode=${encodeURIComponent(code)}&intent=booking`,
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
