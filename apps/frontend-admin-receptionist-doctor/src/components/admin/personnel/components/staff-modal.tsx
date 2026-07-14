import { useState } from "react";
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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-brand-dark">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhap thong tin tai khoan noi bo phong kham.
        </p>

        <form
          className="mt-6 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <StaffFormField label="Ho va ten">
              <input
                required
                value={form.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                placeholder="Nguyen Van A"
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </StaffFormField>
            <StaffFormField label="So dien thoai">
              <input
                value={form.phone}
                onChange={(event) => setField("phone", event.target.value)}
                placeholder="0901234567"
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </StaffFormField>
          </div>

          <StaffFormField label="Email dang nhap">
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
              placeholder="staff@smartdental.vn"
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </StaffFormField>

          <StaffFormField label="Vai tro he thong">
            <select
              value={form.role}
              disabled={roleLocked}
              onChange={(event) => setField("role", event.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:bg-muted"
            >
              <option value="RECEPTIONIST">Le tan</option>
              <option value="DOCTOR">Bac si</option>
              <option value="ADMIN">Quan tri vien</option>
            </select>
          </StaffFormField>

          {isDoctor ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <StaffFormField label="Ma bac si">
                <input
                  required
                  value={form.doctorCode}
                  onChange={(event) =>
                    setField("doctorCode", event.target.value)
                  }
                  placeholder="DOC-001"
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </StaffFormField>
              <StaffFormField label="Chuyen khoa">
                <input
                  required
                  value={form.specialization}
                  onChange={(event) =>
                    setField("specialization", event.target.value)
                  }
                  placeholder="Chinh nha"
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </StaffFormField>
              <StaffFormField label="So giay phep">
                <input
                  required
                  value={form.licenseNumber}
                  onChange={(event) =>
                    setField("licenseNumber", event.target.value)
                  }
                  placeholder="VN-DENT-0001"
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                />
              </StaffFormField>
            </div>
          ) : null}

          <StaffFormField
            label={
              isEdit
                ? "Mat khau moi (bo trong neu khong doi)"
                : "Mat khau khoi tao"
            }
          >
            <input
              type="password"
              required={!isEdit}
              minLength={8}
              value={form.password}
              onChange={(event) => setField("password", event.target.value)}
              placeholder="Toi thieu 8 ky tu"
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </StaffFormField>

          <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98] disabled:opacity-60"
            >
              Huy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? "Dang luu..." : "Luu nhan vien"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
