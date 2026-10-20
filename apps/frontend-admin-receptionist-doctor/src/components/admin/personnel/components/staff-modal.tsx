"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowsClockwise,
  Camera,
  Eye,
  EyeSlash,
  IdentificationBadge,
  Key,
  ShieldCheck,
  Stethoscope,
  Trash,
  User,
  UserGear,
  UserPlus,
  type Icon,
} from "@phosphor-icons/react";
import {
  AdminButton,
  AdminFormSection,
  AdminInput,
  AdminModal,
  IMAGE_ACCEPT,
  collapseSpaces,
  focusFirstError,
  hasErrors,
  normalizePhoneNumber,
  validateCode,
  validateEmail,
  validateImageFile,
  validateMobilePhone,
  validatePassword,
  validatePersonName,
  validateText,
  type FieldErrors,
} from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import type { Role, StaffFormState, StaffUser } from "../types";

type StaffModalProps = {
  editingUser: StaffUser | null;
  initialValue: StaffFormState;
  onClose: () => void;
  onSubmit: (form: StaffFormState) => void;
  submitting: boolean;
  title: string;
};

const roleOptions: { value: Role; label: string; description: string; icon: Icon }[] = [
  { value: "RECEPTIONIST", label: "Lễ tân", description: "Tiếp nhận, lịch hẹn, thanh toán", icon: IdentificationBadge },
  { value: "DOCTOR", label: "Bác sĩ", description: "Khám, hồ sơ & phác đồ điều trị", icon: Stethoscope },
  { value: "ADMIN", label: "Quản trị viên", description: "Toàn quyền quản lý hệ thống", icon: ShieldCheck },
];

function generateDoctorCode(): string {
  return `DOC-${Math.floor(1000 + Math.random() * 9000)}`;
}

type StaffField = "fullName" | "phone" | "email" | "specialization" | "licenseNumber" | "password";

function validateStaffForm(form: StaffFormState, isEdit: boolean): FieldErrors<StaffField> {
  const isDoctor = form.role === "DOCTOR";
  return {
    fullName: validatePersonName(form.fullName),
    phone: validateMobilePhone(form.phone),
    email: validateEmail(form.email),
    specialization: isDoctor
      ? validateText(form.specialization, { label: "Chuyên khoa", required: true, min: 2, max: 100 })
      : undefined,
    licenseNumber: isDoctor ? validateCode(form.licenseNumber, { label: "Số giấy phép" }) : undefined,
    password: validatePassword(form.password, { required: !isEdit }),
  };
}

/** Chuẩn hóa dữ liệu trước khi gửi: bỏ khoảng trắng thừa, chuẩn số điện thoại */
function normalizeStaffForm(form: StaffFormState): StaffFormState {
  return {
    ...form,
    fullName: collapseSpaces(form.fullName),
    phone: normalizePhoneNumber(form.phone),
    email: form.email.trim().toLowerCase(),
    specialization: collapseSpaces(form.specialization),
    licenseNumber: form.licenseNumber.trim().toUpperCase(),
  };
}

function DoctorAvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const invalid = validateImageFile(file, 2);
    setFileError(invalid ?? null);
    if (invalid) return;

    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {value ? (
        <img
          src={value}
          alt="Ảnh bác sĩ"
          className="h-20 w-20 rounded-2xl object-cover ring-1 ring-slate-200"
        />
      ) : (
        <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-400">
          <Camera size={24} weight="duotone" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold text-slate-700">Ảnh đại diện bác sĩ</p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-3.5 text-xs font-bold text-white shadow-sm shadow-brand/25 transition-colors hover:bg-[#0084e0] focus-within:ring-3 focus-within:ring-brand/25">
            <Camera size={14} weight="bold" />
            {value ? "Đổi ảnh" : "Chọn ảnh"}
            <input type="file" accept={IMAGE_ACCEPT} className="sr-only" onChange={handleFileChange} />
          </label>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash size={14} />
              Xóa ảnh
            </button>
          ) : null}
        </div>
        {fileError ? (
          <p className="text-xs font-medium text-rose-600">{fileError}</p>
        ) : (
          <p className="text-xs text-slate-500">Ảnh vuông, rõ mặt; PNG, JPG hoặc WEBP, tối đa 2MB.</p>
        )}
      </div>
    </div>
  );
}

export function StaffModal({
  editingUser,
  initialValue,
  onClose,
  onSubmit,
  submitting,
  title,
}: StaffModalProps) {
  const formId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<StaffFormState>(() => ({
    ...initialValue,
    doctorCode:
      initialValue.doctorCode ||
      (initialValue.role === "DOCTOR" ? generateDoctorCode() : ""),
  }));
  const [errors, setErrors] = useState<FieldErrors<StaffField>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const isEdit = Boolean(editingUser);
  const isDoctor = form.role === "DOCTOR";
  const roleLocked = isEdit && editingUser?.role === "DOCTOR";

  const setField = (name: keyof StaffFormState, value: string) => {
    if (name in errors) {
      setErrors((current) => ({ ...current, [name]: undefined }));
    }
    setForm((current) => {
      const updated = { ...current, [name]: value };
      if (name === "role" && value === "DOCTOR" && !updated.doctorCode) {
        updated.doctorCode = generateDoctorCode();
      }
      return updated;
    });
  };

  return (
    <AdminModal
      title={title}
      description="Nhập thông tin tài khoản nhân viên nội bộ phòng khám."
      icon={isEdit ? <UserGear size={20} weight="duotone" /> : <UserPlus size={20} weight="duotone" />}
      size="md"
      variant="drawer"
      onClose={onClose}
      footer={
        <>
          <AdminButton type="submit" form={formId} loading={submitting}>
            {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo nhân viên"}
          </AdminButton>
          <AdminButton variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </AdminButton>
        </>
      }
    >
      <form
        id={formId}
        ref={formRef}
        noValidate
        className="mt-4 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const nextErrors = validateStaffForm(form, isEdit);
          setErrors(nextErrors);
          if (hasErrors(nextErrors)) {
            focusFirstError(formRef.current);
            return;
          }
          onSubmit(normalizeStaffForm(form));
        }}
      >
        <AdminFormSection title="Thông tin cá nhân" icon={<User size={15} weight="bold" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminInput
              label="Họ và tên"
              required
              maxLength={100}
              value={form.fullName}
              error={errors.fullName}
              onChange={(event) => setField("fullName", event.target.value)}
              placeholder="Nguyễn Văn A"
              autoComplete="off"
            />
            <AdminInput
              label="Số điện thoại"
              type="tel"
              inputMode="numeric"
              maxLength={15}
              value={form.phone}
              error={errors.phone}
              onChange={(event) => setField("phone", event.target.value.replace(/[^\d\s.+-]/g, ""))}
              placeholder="0901234567"
              hint="Không bắt buộc. Di động 10 số."
            />
          </div>
          <AdminInput
            label="Email đăng nhập"
            type="email"
            required
            maxLength={254}
            value={form.email}
            error={errors.email}
            onChange={(event) => setField("email", event.target.value)}
            placeholder="staff@smartdental.vn"
            autoComplete="off"
          />
        </AdminFormSection>

        <AdminFormSection
          title="Vai trò hệ thống"
          description={roleLocked ? "Không thể đổi vai trò của tài khoản bác sĩ đã tạo." : "Vai trò quyết định các chức năng nhân viên được truy cập."}
          icon={<ShieldCheck size={15} weight="bold" />}
        >
          <div role="radiogroup" aria-label="Vai trò hệ thống" className="grid gap-2.5 sm:grid-cols-3">
            {roleOptions.map((option) => {
              const selected = form.role === option.value;
              const RoleIcon = option.icon;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "relative flex cursor-pointer flex-col gap-1.5 rounded-xl border bg-white p-3.5 transition-all has-focus-visible:ring-3 has-focus-visible:ring-brand/25",
                    selected
                      ? "border-brand ring-1 ring-brand shadow-sm shadow-brand/10"
                      : "border-slate-200 hover:border-slate-300",
                    roleLocked && !selected && "cursor-not-allowed opacity-50",
                  )}
                >
                  <input
                    type="radio"
                    name="staff-role"
                    value={option.value}
                    checked={selected}
                    disabled={roleLocked}
                    onChange={() => setField("role", option.value)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg",
                      selected ? "bg-brand text-white" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    <RoleIcon size={17} weight={selected ? "fill" : "regular"} />
                  </span>
                  <span className={cn("text-sm font-bold", selected ? "text-brand" : "text-slate-800")}>
                    {option.label}
                  </span>
                  <span className="text-[11px] leading-snug text-slate-500">{option.description}</span>
                </label>
              );
            })}
          </div>
        </AdminFormSection>

        {isDoctor ? (
          <AdminFormSection title="Hồ sơ bác sĩ" icon={<Stethoscope size={15} weight="bold" />}>
            <DoctorAvatarPicker
              value={form.avatarUrl}
              onChange={(value) => setField("avatarUrl", value)}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] font-semibold text-slate-700">
                  Mã bác sĩ <span className="font-normal text-slate-400">(tự động)</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    required
                    readOnly
                    aria-label="Mã bác sĩ"
                    value={form.doctorCode}
                    className="h-11 w-full min-w-0 cursor-default select-all rounded-xl border border-slate-200 bg-slate-100 px-3 font-mono text-sm font-bold text-slate-800 outline-none"
                  />
                  {!isEdit ? (
                    <button
                      type="button"
                      onClick={() => setField("doctorCode", generateDoctorCode())}
                      title="Sinh mã khác"
                      aria-label="Sinh mã bác sĩ khác"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-brand/30 hover:bg-brand-light hover:text-brand"
                    >
                      <ArrowsClockwise size={16} weight="bold" />
                    </button>
                  ) : null}
                </div>
              </div>
              <AdminInput
                label="Chuyên khoa"
                required
                maxLength={100}
                value={form.specialization}
                error={errors.specialization}
                onChange={(event) => setField("specialization", event.target.value)}
                placeholder="Chỉnh nha"
              />
              <AdminInput
                label="Số giấy phép"
                required
                maxLength={50}
                value={form.licenseNumber}
                error={errors.licenseNumber}
                onChange={(event) => setField("licenseNumber", event.target.value)}
                placeholder="VN-DENT-0001"
              />
            </div>
          </AdminFormSection>
        ) : null}

        <AdminFormSection title="Bảo mật" icon={<Key size={15} weight="bold" />}>
          <div className="relative">
            <AdminInput
              label={isEdit ? "Mật khẩu mới" : "Mật khẩu khởi tạo"}
              type={showPassword ? "text" : "password"}
              required={!isEdit}
              maxLength={72}
              value={form.password}
              error={errors.password}
              onChange={(event) => setField("password", event.target.value)}
              placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
              autoComplete="new-password"
              className="pr-11"
              hint={isEdit ? "Bỏ trống nếu không muốn đổi mật khẩu." : "Nhân viên nên đổi mật khẩu sau lần đăng nhập đầu tiên."}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-1.5 top-8 grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </AdminFormSection>
      </form>
    </AdminModal>
  );
}
