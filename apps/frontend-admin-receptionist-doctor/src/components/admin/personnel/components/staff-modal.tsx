import { useState, type ChangeEvent } from "react";
import type { StaffFormState, StaffUser } from "../types";
import { StaffFormField } from "./staff-form-field";

type StaffModalProps = {
  editingUser: StaffUser | null;
  initialValue: StaffFormState;
  onClose: () => void;
  onSubmit: (form: StaffFormState) => void;
  submitting: boolean;
  title: string;
};

function DoctorAvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  };

  return (
    <StaffFormField label="Ảnh bác sĩ">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3">
        {value ? (
          <img
            src={value}
            alt="Ảnh bác sĩ"
            className="h-20 w-20 rounded-xl object-cover"
          />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-xl bg-slate-100 text-xs font-medium text-slate-400">
            Chưa có ảnh
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-brand px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-dark shadow-xs">
            Chọn ảnh
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />
          </label>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-left text-xs font-semibold text-red-600 hover:underline"
            >
              Xóa ảnh
            </button>
          ) : null}
        </div>
      </div>
    </StaffFormField>
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
  const [form, setForm] = useState<StaffFormState>(initialValue);
  const isEdit = Boolean(editingUser);
  const isDoctor = form.role === "DOCTOR";
  const roleLocked = isEdit && editingUser?.role === "DOCTOR";

  const setField = (name: keyof StaffFormState, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-brand-dark">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Nhập thông tin tài khoản nhân viên nội bộ phòng khám.
        </p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <StaffFormField label="Họ và tên">
              <input
                required
                value={form.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                placeholder="Nguyễn Văn A"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium"
              />
            </StaffFormField>
            <StaffFormField label="Số điện thoại">
              <input
                value={form.phone}
                onChange={(event) => setField("phone", event.target.value)}
                placeholder="0901234567"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium"
              />
            </StaffFormField>
          </div>

          <StaffFormField label="Email đăng nhập">
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
              placeholder="staff@smartdental.vn"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium"
            />
          </StaffFormField>

          <StaffFormField label="Vai trò hệ thống">
            <select
              value={form.role}
              disabled={roleLocked}
              onChange={(event) => setField("role", event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium disabled:bg-slate-100"
            >
              <option value="RECEPTIONIST">Lễ tân</option>
              <option value="DOCTOR">Bác sĩ</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
          </StaffFormField>

          {isDoctor ? (
            <div className="grid gap-4">
              <DoctorAvatarPicker
                value={form.avatarUrl}
                onChange={(value) => setField("avatarUrl", value)}
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <StaffFormField label="Mã bác sĩ">
                  <input
                    required
                    value={form.doctorCode}
                    onChange={(event) =>
                      setField("doctorCode", event.target.value)
                    }
                    placeholder="DOC-001"
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium"
                  />
                </StaffFormField>
                <StaffFormField label="Chuyên khoa">
                  <input
                    required
                    value={form.specialization}
                    onChange={(event) =>
                      setField("specialization", event.target.value)
                    }
                    placeholder="Chỉnh nha"
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium"
                  />
                </StaffFormField>
                <StaffFormField label="Số giấy phép">
                  <input
                    required
                    value={form.licenseNumber}
                    onChange={(event) =>
                      setField("licenseNumber", event.target.value)
                    }
                    placeholder="VN-DENT-0001"
                    className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium"
                  />
                </StaffFormField>
              </div>
            </div>
          ) : null}

          <StaffFormField
            label={
              isEdit
                ? "Mật khẩu mới (bỏ trống nếu không đổi)"
                : "Mật khẩu khởi tạo"
            }
          >
            <input
              type="password"
              required={!isEdit}
              minLength={8}
              value={form.password}
              onChange={(event) => setField("password", event.target.value)}
              placeholder="Tối thiểu 8 ký tự"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium"
            />
          </StaffFormField>

          <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 active:scale-[0.98] disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? "Đang lưu..." : "Lưu nhân viên"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
