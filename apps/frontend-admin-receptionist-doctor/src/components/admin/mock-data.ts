import type { Role } from "@/src/constants/roles";

export const adminStats = [
  { label: "Tổng bệnh nhân", value: "2.847", change: 12.4, icon: "patients" as const },
  { label: "Lịch hẹn hôm nay", value: "48", change: 8.2, icon: "calendar" as const },
  { label: "Bác sĩ hoạt động", value: "12", change: 0, icon: "doctors" as const },
  { label: "Doanh thu tháng này", value: "186.5M", change: 15.3, icon: "revenue" as const, isCurrency: true },
];

export const appointmentsLast7Days = [
  { day: "T2", count: 32 }, { day: "T3", count: 41 }, { day: "T4", count: 38 },
  { day: "T5", count: 45 }, { day: "T6", count: 52 }, { day: "T7", count: 28 }, { day: "CN", count: 18 },
];

export const recentActivities = [
  { id: "1", type: "appointment" as const, title: "Đặt lịch mới", description: "Nguyễn Văn A - Khám tổng quát", time: "5 phút trước" },
  { id: "2", type: "patient" as const, title: "Bệnh nhân mới", description: "Trần Thị B đã đăng ký hồ sơ", time: "18 phút trước" },
  { id: "3", type: "payment" as const, title: "Thanh toán", description: "Hóa đơn #1042 - 2.500.000đ", time: "32 phút trước" },
  { id: "4", type: "appointment" as const, title: "Đặt lịch mới", description: "Lê Văn C - Cạo vôi răng", time: "1 giờ trước" },
  { id: "5", type: "patient" as const, title: "Bệnh nhân mới", description: "Phạm Thị D đã đăng ký hồ sơ", time: "2 giờ trước" },
];

export const popularServices = [
  { name: "Cạo vôi răng", count: 342, percent: 28 },
  { name: "Khám tổng quát", count: 256, percent: 21 },
  { name: "Trám răng", count: 198, percent: 16 },
];

export const reexamRate = { rate: 68, change: 4.2 };

export type StaffUser = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: "active" | "locked";
  createdAt: string;
};

export const staffUsers: StaffUser[] = [
  { id: "1", fullName: "Nguyễn Admin", email: "admin@phongkham.vn", role: "ADMIN", status: "active", createdAt: "2024-01-15" },
  { id: "2", fullName: "BS. Trần Minh", email: "tran.minh@phongkham.vn", role: "DOCTOR", status: "active", createdAt: "2024-02-20" },
  { id: "3", fullName: "Lê Thị Hoa", email: "le.hoa@phongkham.vn", role: "RECEPTIONIST", status: "active", createdAt: "2024-03-10" },
  { id: "4", fullName: "BS. Phạm Quang", email: "pham.quang@phongkham.vn", role: "DOCTOR", status: "locked", createdAt: "2024-04-05" },
  { id: "5", fullName: "Hoàng Lễ tân", email: "hoang.lt@phongkham.vn", role: "RECEPTIONIST", status: "active", createdAt: "2024-05-12" },
];

export const doctors = [
  { id: "d1", name: "BS. Trần Minh" },
  { id: "d2", name: "BS. Phạm Quang" },
  { id: "d3", name: "BS. Nguyễn Lan" },
];

export const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export type ShiftType = "morning" | "afternoon" | "evening" | "off";

export const dentalServices = [
  { id: "s1", name: "Khám tổng quát", description: "Kiểm tra sức khỏe răng miệng", duration: 30, status: "active" },
  { id: "s2", name: "Cạo vôi răng", description: "Lấy cao răng và đánh bóng", duration: 45, status: "active" },
  { id: "s3", name: "Trám răng", description: "Trám composite", duration: 60, status: "active" },
  { id: "s4", name: "Nhổ răng", description: "Nhổ răng đơn giản", duration: 30, status: "inactive" },
];

export const servicePrices = [
  { id: "p1", serviceName: "Khám tổng quát", price: 200000, effectiveDate: "2025-01-01" },
  { id: "p2", serviceName: "Cạo vôi răng", price: 500000, effectiveDate: "2025-01-01" },
  { id: "p3", serviceName: "Trám răng", price: 350000, effectiveDate: "2025-06-01" },
  { id: "p4", serviceName: "Nhổ răng", price: 300000, effectiveDate: "2025-01-01" },
];

export type PromotionStatus = "active" | "expired";

export type Promotion = {
  id: string;
  code: string;
  name: string;
  type: "percent" | "fixed";
  value: number;
  expiry: string;
  used: number;
  limit: number;
  status: PromotionStatus;
};

export const promotions: Promotion[] = [
  { id: "pr1", code: "WELCOME20", name: "Giảm 20% lần đầu", type: "percent", value: 20, expiry: "2026-12-31", used: 45, limit: 100, status: "active" },
  { id: "pr2", code: "CLEAN50K", name: "Giảm 50K cạo vôi", type: "fixed", value: 50000, expiry: "2026-06-30", used: 120, limit: 200, status: "active" },
  { id: "pr3", code: "SUMMER15", name: "Khuyến mãi hè", type: "percent", value: 15, expiry: "2025-08-31", used: 80, limit: 80, status: "expired" },
];

export const financeStats = [
  { label: "Doanh thu tháng", value: "186.5M", suffix: "đ" },
  { label: "Doanh thu tuần", value: "42.3M", suffix: "đ" },
  { label: "Hóa đơn đã thu", value: "312", suffix: "" },
];

export const revenueByService = [
  { name: "Cạo vôi", revenue: 85 },
  { name: "Trám răng", revenue: 62 },
  { name: "Khám TQ", revenue: 48 },
  { name: "Nhổ răng", revenue: 35 },
  { name: "Tẩy trắng", revenue: 28 },
];

export const topServicesFinance = [
  { name: "Cạo vôi răng", count: 342, revenue: "85.5M", percent: 28 },
  { name: "Trám răng", count: 198, revenue: "62.1M", percent: 21 },
  { name: "Khám tổng quát", count: 256, revenue: "48.2M", percent: 16 },
  { name: "Tẩy trắng răng", count: 89, revenue: "28.4M", percent: 9 },
];

export const reportHistory = [
  { id: "r1", name: "Báo cáo tài chính T5/2026", type: "Tài chính", date: "2026-05-31", format: "PDF" },
  { id: "r2", name: "Lịch hẹn tuần 22", type: "Lịch hẹn", date: "2026-06-01", format: "Excel" },
  { id: "r3", name: "Báo cáo tổng hợp Q2", type: "Tổng hợp", date: "2026-06-15", format: "PDF" },
];

export const reportPreview = [
  { col1: "Cạo vôi răng", col2: "342", col3: "85.500.000đ" },
  { col1: "Trám răng", col2: "198", col3: "62.100.000đ" },
  { col1: "Khám tổng quát", col2: "256", col3: "48.200.000đ" },
];

export type ReviewStatus = "pending" | "approved" | "hidden";

export const reviews = [
  { id: "rv1", patientName: "Nguyễn Văn A", rating: 5, content: "Bác sĩ rất tận tâm, phòng khám sạch sẽ.", date: "2026-06-25", status: "pending" as const, isSpam: false },
  { id: "rv2", patientName: "Trần Thị B", rating: 4, content: "Dịch vụ tốt, chờ hơi lâu.", date: "2026-06-24", status: "pending" as const, isSpam: false },
  { id: "rv3", patientName: "Spam User", rating: 1, content: "CLICK HERE FREE MONEY!!!", date: "2026-06-23", status: "pending" as const, isSpam: true },
  { id: "rv4", patientName: "Lê Văn C", rating: 5, content: "Rất hài lòng với kết quả điều trị.", date: "2026-06-20", status: "approved" as const, isSpam: false },
  { id: "rv5", patientName: "Phạm Thị D", rating: 2, content: "Không quay lại nữa.", date: "2026-06-18", status: "hidden" as const, isSpam: false },
];

export const emailCampaigns = [
  { id: "c1", name: "Khuyến mãi hè 2026", sentDate: "2026-06-01", recipients: 1250, status: "sent" as const },
  { id: "c2", name: "Nhắc tái khám 6 tháng", sentDate: "2026-05-15", recipients: 890, status: "sent" as const },
  { id: "c3", name: "Voucher WELCOME20", sentDate: "2026-06-20", recipients: 450, status: "draft" as const },
];

export const voucherOptions = promotions.filter((p) => p.status === "active").map((p) => ({ value: p.code, label: `${p.code} - ${p.name}` }));

export const workingHours = [
  { day: "Thứ 2", open: "07:30", close: "18:00" },
  { day: "Thứ 3", open: "07:30", close: "18:00" },
  { day: "Thứ 4", open: "07:30", close: "18:00" },
  { day: "Thứ 5", open: "07:30", close: "18:00" },
  { day: "Thứ 6", open: "07:30", close: "18:00" },
  { day: "Thứ 7", open: "08:00", close: "12:00" },
  { day: "Chủ nhật", open: "", close: "", closed: true },
];

export const holidays = [
  { id: "h1", name: "Tết Nguyên đán", date: "2026-01-29" },
  { id: "h2", name: "Giỗ Tổ Hùng Vương", date: "2026-04-18" },
  { id: "h3", name: "Quốc khánh", date: "2026-09-02" },
];

export const notificationTemplates = [
  { id: "t1", name: "Xác nhận đặt lịch", content: "Kính gửi {ten_bn}, lịch hẹn của bạn vào {ngay_gio} đã được xác nhận." },
  { id: "t2", name: "Nhắc hẹn", content: "Nhắc bạn có lịch khám vào ngày mai lúc {gio}. Vui lòng đến đúng giờ." },
  { id: "t3", name: "Khuyến mãi", content: "Ưu đãi đặc biệt! Dùng mã {ma_voucher} để được giảm {giam_gia}." },
];
