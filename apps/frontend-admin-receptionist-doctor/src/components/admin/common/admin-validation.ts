/**
 * Bộ quy tắc kiểm tra dữ liệu dùng chung cho các form quản trị.
 * Mỗi hàm trả về câu thông báo lỗi (tiếng Việt) hoặc `undefined` nếu hợp lệ.
 */

export type FieldErrors<Key extends string = string> = Partial<Record<Key, string>>;

const NAME_PATTERN = /^[\p{L}\s.'-]+$/u;
const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const VN_MOBILE_PATTERN = /^0(3|5|7|8|9)\d{8}$/;
const CLINIC_PHONE_PATTERN = /^(0\d{9,10}|1[89]00\d{4,6})$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CODE_PATTERN = /^[A-Za-z0-9./-]+$/;

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");

/** Gộp khoảng trắng thừa: "  Nguyễn   Văn  A " -> "Nguyễn Văn A" */
export function collapseSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

/** Bỏ khoảng trắng, dấu chấm, gạch ngang; đổi +84 thành 0 */
export function normalizePhoneNumber(value: string) {
  return value.replace(/[\s.-]/g, "").replace(/^\+84/, "0");
}

export function hasErrors(errors: FieldErrors) {
  return Object.values(errors).some(Boolean);
}

/** Cuộn tới và focus ô lỗi đầu tiên trong form */
export function focusFirstError(container?: HTMLElement | null) {
  window.requestAnimationFrame(() => {
    const target = (container ?? document).querySelector<HTMLElement>(
      '[aria-invalid="true"], [data-invalid="true"]',
    );
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.focus?.({ preventScroll: true });
  });
}

type TextRule = {
  label: string;
  required?: boolean;
  min?: number;
  max?: number;
};

export function validateText(value: string, { label, required = false, min, max }: TextRule) {
  const text = collapseSpaces(value);
  if (!text) return required ? `Vui lòng nhập ${label.toLowerCase()}.` : undefined;
  if (min && text.length < min) return `${label} phải có ít nhất ${min} ký tự.`;
  if (max && text.length > max) return `${label} không được vượt quá ${max} ký tự.`;
  return undefined;
}

export function validatePersonName(value: string, label = "Họ và tên") {
  const error = validateText(value, { label, required: true, min: 2, max: 100 });
  if (error) return error;
  if (!NAME_PATTERN.test(collapseSpaces(value))) {
    return `${label} chỉ được chứa chữ cái và khoảng trắng.`;
  }
  return undefined;
}

export function validateEmail(value: string, { required = true } = {}) {
  const email = value.trim();
  if (!email) return required ? "Vui lòng nhập email." : undefined;
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return "Email không đúng định dạng (VD: ten@smartdental.vn).";
  }
  return undefined;
}

/** Số di động Việt Nam 10 số (03x, 05x, 07x, 08x, 09x) */
export function validateMobilePhone(value: string, { required = false } = {}) {
  const phone = normalizePhoneNumber(value);
  if (!phone) return required ? "Vui lòng nhập số điện thoại." : undefined;
  if (!/^\d+$/.test(phone)) return "Số điện thoại chỉ được chứa chữ số.";
  if (!VN_MOBILE_PATTERN.test(phone)) {
    return "Số điện thoại phải gồm 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.";
  }
  return undefined;
}

/** Hotline phòng khám: số di động, số bàn hoặc tổng đài 1800/1900 */
export function validateClinicPhone(value: string) {
  const phone = normalizePhoneNumber(value);
  if (!phone) return "Vui lòng nhập hotline / số điện thoại.";
  if (!/^\d+$/.test(phone)) return "Số điện thoại chỉ được chứa chữ số.";
  if (!CLINIC_PHONE_PATTERN.test(phone)) {
    return "Số điện thoại không hợp lệ (VD: 0901234567, 02812345678 hoặc 19001234).";
  }
  return undefined;
}

export function validatePassword(value: string, { required = true } = {}) {
  if (!value) return required ? "Vui lòng nhập mật khẩu." : undefined;
  if (/\s/.test(value)) return "Mật khẩu không được chứa khoảng trắng.";
  if (value.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
  if (value.length > 72) return "Mật khẩu không được vượt quá 72 ký tự.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Mật khẩu phải có cả chữ và số.";
  }
  return undefined;
}

export function validateSlug(value: string) {
  const slug = value.trim();
  if (!slug) return undefined;
  if (slug.length > 150) return "Slug không được vượt quá 150 ký tự.";
  if (!SLUG_PATTERN.test(slug)) {
    return "Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang (VD: trong-rang-implant).";
  }
  return undefined;
}

export function validateCode(value: string, { label, min = 3, max = 50 }: { label: string; min?: number; max?: number }) {
  const error = validateText(value, { label, required: true, min, max });
  if (error) return error;
  if (!CODE_PATTERN.test(value.trim())) {
    return `${label} chỉ gồm chữ không dấu, số và các ký tự . / -`;
  }
  return undefined;
}

type NumberRule = {
  label: string;
  min?: number;
  max?: number;
  integer?: boolean;
  required?: boolean;
  unit?: string;
};

export function validateNumber(
  value: number | string | null | undefined,
  { label, min, max, integer = true, required = true, unit = "" }: NumberRule,
) {
  if (value === "" || value === null || value === undefined) {
    return required ? `Vui lòng nhập ${label.toLowerCase()}.` : undefined;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) return `${label} phải là số.`;
  if (integer && !Number.isInteger(number)) return `${label} phải là số nguyên.`;
  const suffix = unit ? ` ${unit}` : "";
  if (min !== undefined && number < min) {
    return `${label} phải từ ${min.toLocaleString("vi-VN")}${suffix} trở lên.`;
  }
  if (max !== undefined && number > max) {
    return `${label} không được vượt quá ${max.toLocaleString("vi-VN")}${suffix}.`;
  }
  return undefined;
}

/** Chuỗi ngày YYYY-MM-DD theo giờ máy */
export function todayISODate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function validateImageFile(file: File, maxMB = 5) {
  if (!IMAGE_TYPES.includes(file.type)) {
    return "Chỉ hỗ trợ ảnh PNG, JPG hoặc WEBP.";
  }
  if (file.size > maxMB * 1024 * 1024) {
    return `Dung lượng ảnh tối đa ${maxMB}MB.`;
  }
  return undefined;
}
