import { ROUTES } from "@/src/constants/routes";

export const adminNavItems = [
  { label: "Tổng quan", href: ROUTES.ADMIN.ROOT },
  { label: "Nhân sự", href: ROUTES.ADMIN.USERS },
  { label: "Lịch làm việc", href: ROUTES.ADMIN.SCHEDULES },
  { label: "Dịch vụ & Giá", href: ROUTES.ADMIN.SERVICES },
  { label: "Khuyến mãi", href: ROUTES.ADMIN.PROMOTIONS },
  { label: "Tài chính", href: ROUTES.ADMIN.FINANCE },
  { label: "Báo cáo", href: ROUTES.ADMIN.REPORTS },
  { label: "Đánh giá", href: ROUTES.ADMIN.REVIEWS },
  { label: "Marketing", href: ROUTES.ADMIN.MARKETING },
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
  { label: "Bệnh nhân", href: ROUTES.DOCTOR.PATIENTS },
  { label: "Hồ sơ bệnh án", href: ROUTES.DOCTOR.MEDICAL_RECORDS },
  { label: "Đơn thuốc", href: ROUTES.DOCTOR.PRESCRIPTIONS },
  { label: "Kế hoạch điều trị", href: ROUTES.DOCTOR.TREATMENT_PLANS },
];
