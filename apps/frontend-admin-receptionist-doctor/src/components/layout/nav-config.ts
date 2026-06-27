import { ROUTES } from "@/src/constants/routes";

export const adminNavItems = [
  { label: "Tổng quan", href: ROUTES.ADMIN.ROOT },
  { label: "Người dùng", href: ROUTES.ADMIN.USERS },
  { label: "Bác sĩ", href: ROUTES.ADMIN.DOCTORS },
  { label: "Dịch vụ", href: ROUTES.ADMIN.SERVICES },
  { label: "Báo cáo", href: ROUTES.ADMIN.REPORTS },
  { label: "Cài đặt", href: ROUTES.ADMIN.SETTINGS },
];

export const receptionistNavItems = [
  { label: "Tổng quan", href: ROUTES.RECEPTIONIST.ROOT },
  { label: "Lịch hẹn", href: ROUTES.RECEPTIONIST.APPOINTMENTS },
  { label: "Bệnh nhân", href: ROUTES.RECEPTIONIST.PATIENTS },
  { label: "Tiếp nhận", href: ROUTES.RECEPTIONIST.CHECK_IN },
  { label: "Thanh toán", href: ROUTES.RECEPTIONIST.BILLING },
];

export const doctorNavItems = [
  { label: "Tổng quan", href: ROUTES.DOCTOR.ROOT },
  { label: "Lịch khám", href: ROUTES.DOCTOR.SCHEDULE },
  { label: "Đơn thuốc", href: ROUTES.DOCTOR.PRESCRIPTIONS },
  { label: "Kế hoạch điều trị", href: ROUTES.DOCTOR.TREATMENT_PLANS },
];
