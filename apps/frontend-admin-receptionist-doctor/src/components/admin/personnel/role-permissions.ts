import type { Role } from "./types";

export type ActionKind = "view" | "create" | "update" | "delete" | "special";

export type PermissionAction = { label: string; kind: ActionKind };

export type PermissionRow = {
  feature: string;
  description: string;
  access: Partial<Record<Role, PermissionAction[]>>;
};

export type PermissionGroup = {
  group: string;
  rows: PermissionRow[];
};

export const ROLE_ORDER: Role[] = ["ADMIN", "RECEPTIONIST", "DOCTOR"];

const view = (label = "Xem"): PermissionAction => ({ label, kind: "view" });
const create = (label = "Thêm"): PermissionAction => ({ label, kind: "create" });
const update = (label = "Sửa"): PermissionAction => ({ label, kind: "update" });
const remove = (label = "Xóa"): PermissionAction => ({ label, kind: "delete" });
const special = (label: string): PermissionAction => ({ label, kind: "special" });

const crud = [view(), create(), update(), remove()];

// Đồng bộ với @Roles(...) trên các controller ở apps/backend/src/modules.
// Khi thay đổi phân quyền ở backend, cập nhật lại bảng này.
export const permissionGroups: PermissionGroup[] = [
  {
    group: "Quản trị hệ thống",
    rows: [
      {
        feature: "Nhân sự",
        description: "Tài khoản quản trị viên, lễ tân, bác sĩ",
        access: { ADMIN: [view(), create(), update(), special("Khóa / mở khóa"), remove("Vô hiệu hóa")] },
      },
      {
        feature: "Cài đặt phòng khám",
        description: "Thông tin, giờ làm việc, cấu hình chung",
        access: { ADMIN: [view(), update()] },
      },
      {
        feature: "Báo cáo & thống kê",
        description: "Tổng quan, doanh thu, lượt khám",
        access: { ADMIN: [view()], RECEPTIONIST: [view()] },
      },
    ],
  },
  {
    group: "Dịch vụ & kinh doanh",
    rows: [
      {
        feature: "Dịch vụ & giá",
        description: "Danh mục dịch vụ, phương pháp điều trị",
        access: { ADMIN: [...crud, special("Bật / tắt")], RECEPTIONIST: [...crud, special("Bật / tắt")] },
      },
      {
        feature: "Khuyến mãi",
        description: "Voucher, mã giảm giá",
        access: {
          ADMIN: [...crud, special("Bật / tắt"), special("Gửi thông báo")],
          RECEPTIONIST: [...crud, special("Bật / tắt"), special("Gửi thông báo")],
        },
      },
      {
        feature: "Chiến dịch marketing",
        description: "Gửi thông báo hàng loạt",
        access: { ADMIN: [view(), create(), remove()], RECEPTIONIST: [view(), create(), remove()] },
      },
      {
        feature: "Banner",
        description: "Banner quảng cáo trên ứng dụng",
        access: { ADMIN: crud },
      },
      {
        feature: "Đánh giá",
        description: "Đánh giá của bệnh nhân",
        access: {
          ADMIN: [view(), special("Ẩn / hiện"), remove()],
          RECEPTIONIST: [view(), special("Ẩn / hiện"), remove()],
        },
      },
    ],
  },
  {
    group: "Tiếp đón & thu ngân",
    rows: [
      {
        feature: "Lịch hẹn",
        description: "Đặt lịch và điều phối tại quầy",
        access: {
          ADMIN: [view(), create("Đặt lịch"), update("Đổi lịch"), remove("Hủy"), special("Xác nhận"), special("Check-in"), special("Bắt đầu khám"), special("Hoàn tất")],
          RECEPTIONIST: [view(), create("Đặt lịch"), update("Đổi lịch"), remove("Hủy"), special("Xác nhận"), special("Check-in"), special("Hoàn tất")],
          DOCTOR: [view(), special("Xác nhận"), special("Check-in"), special("Bắt đầu khám"), special("Hoàn tất")],
        },
      },
      {
        feature: "Lịch làm việc bác sĩ",
        description: "Ca làm việc, đăng ký lịch trực",
        access: {
          ADMIN: [...crud, special("Duyệt lịch")],
          RECEPTIONIST: [...crud, special("Duyệt lịch")],
          DOCTOR: [view(), create("Đăng ký"), update(), remove()],
        },
      },
      {
        feature: "Bệnh nhân",
        description: "Hồ sơ hành chính của bệnh nhân",
        access: {
          ADMIN: [view(), create(), update(), special("Gửi nhắc lịch")],
          RECEPTIONIST: [view(), create(), update(), special("Gửi nhắc lịch")],
          DOCTOR: [view()],
        },
      },
      {
        feature: "Hóa đơn & thanh toán",
        description: "Thu tiền, xác nhận chuyển khoản",
        access: {
          ADMIN: [view(), create("Tạo thanh toán"), special("Xác nhận"), special("Nhắc thanh toán")],
          RECEPTIONIST: [view(), create("Tạo thanh toán"), special("Xác nhận"), special("Nhắc thanh toán")],
        },
      },
      {
        feature: "Hoàn tiền",
        description: "Yêu cầu hoàn tiền của bệnh nhân",
        access: {
          ADMIN: [view(), create(), special("Xử lý yêu cầu")],
          RECEPTIONIST: [view(), special("Xử lý yêu cầu")],
        },
      },
      {
        feature: "Hỗ trợ khách hàng",
        description: "Hộp thư chat với bệnh nhân",
        access: {
          ADMIN: [view(), special("Nhận hội thoại"), special("Trả lời"), special("Đóng hội thoại")],
          RECEPTIONIST: [view(), special("Nhận hội thoại"), special("Trả lời"), special("Đóng hội thoại")],
        },
      },
      {
        feature: "Trợ lý AI lễ tân",
        description: "Đặt lịch, tra cứu bằng AI",
        access: { RECEPTIONIST: [special("Sử dụng")] },
      },
    ],
  },
  {
    group: "Chuyên môn",
    rows: [
      {
        feature: "Hồ sơ bệnh án",
        description: "Chẩn đoán, ghi chú, hình ảnh",
        access: {
          ADMIN: [view(), update(), create("Tải ảnh")],
          DOCTOR: [view(), update(), create("Tải ảnh")],
        },
      },
      {
        feature: "Đơn thuốc",
        description: "Kê đơn và gửi cho bệnh nhân",
        access: { ADMIN: [...crud, special("Gửi email")], DOCTOR: [...crud, special("Gửi email")] },
      },
      {
        feature: "Kế hoạch điều trị",
        description: "Các bước điều trị dài hạn",
        access: {
          ADMIN: [...crud, special("Cập nhật bước"), special("Gửi email")],
          DOCTOR: [...crud, special("Cập nhật bước"), special("Gửi email")],
        },
      },
      {
        feature: "Tư vấn trực tuyến",
        description: "Cuộc gọi video với bệnh nhân",
        access: {
          ADMIN: [view(), special("Bắt đầu"), special("Hoàn tất"), remove("Hủy"), update("Ghi chú"), special("Gửi nhắc")],
          DOCTOR: [view(), special("Bắt đầu"), special("Hoàn tất"), remove("Hủy"), update("Ghi chú"), special("Gửi nhắc")],
        },
      },
      {
        feature: "AI hỗ trợ bác sĩ",
        description: "Tóm tắt bệnh nhân, nháp bệnh án, phân tích X-quang",
        access: {
          ADMIN: [special("Sử dụng")],
          DOCTOR: [special("Sử dụng"), special("Duyệt kết quả AI")],
        },
      },
    ],
  },
];

/** Một quyền đã gộp: "Nhân sự: Xem, Thêm, Sửa" */
export type RolePermissionSummary = {
  feature: string;
  group: string;
  actions: PermissionAction[];
  text: string;
};

export function getRolePermissions(role: Role): RolePermissionSummary[] {
  return permissionGroups.flatMap(({ group, rows }) =>
    rows.flatMap((row) => {
      const actions = row.access[role];
      if (!actions?.length) return [];
      return [
        {
          feature: row.feature,
          group,
          actions,
          text: `${row.feature}: ${actions.map((a) => a.label).join(", ")}`,
        },
      ];
    }),
  );
}
