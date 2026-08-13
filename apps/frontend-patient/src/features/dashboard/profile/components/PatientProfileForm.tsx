"use client";

import {
  cloneElement,
  isValidElement,
  type Dispatch,
  type ReactElement,
  type SetStateAction,
} from "react";
import type { ProfileFormState } from "../types";

const genderOptions = [
  { value: "UNKNOWN", label: "Chưa cập nhật" },
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
] as const;

type PatientProfileFormProps = {
  form: ProfileFormState;
  setForm: Dispatch<SetStateAction<ProfileFormState>>;
};

export function PatientProfileForm({ form, setForm }: PatientProfileFormProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#0863c5]">
          Thông tin cá nhân
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Họ và tên">
            <input
              value={form.fullName}
              onChange={(event) =>
                setForm((current) => ({ ...current, fullName: event.target.value }))
              }
            />
          </Field>
          <Field label="Số điện thoại">
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({ ...current, phone: event.target.value }))
              }
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
          </Field>
          <Field label="Ngày sinh">
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dateOfBirth: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Giới tính">
            <select
              value={form.gender}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  gender: event.target.value as ProfileFormState["gender"],
                }))
              }
            >
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Địa chỉ">
            <input
              value={form.address}
              onChange={(event) =>
                setForm((current) => ({ ...current, address: event.target.value }))
              }
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <p className="mb-4 text-[11px] font-black uppercase tracking-[0.14em] text-[#0863c5]">
          Thông tin y tế
        </p>
        <div className="space-y-4">
          <Field label="Tiền sử y khoa">
            <textarea
              value={form.medicalHistory}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  medicalHistory: event.target.value,
                }))
              }
              rows={4}
            />
          </Field>
          <Field label="Dị ứng">
            <input
              value={form.allergies}
              placeholder="Ví dụ: kháng sinh, hải sản..."
              onChange={(event) =>
                setForm((current) => ({ ...current, allergies: event.target.value }))
              }
            />
          </Field>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactElement<any> }) {
  if (!isValidElement(children)) return null;
  const childProps = children.props as { className?: string };

  const control = cloneElement(children as ReactElement<any>, {
    className: [
      "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0863c5] focus:bg-white focus:ring-2 focus:ring-blue-100",
      childProps.className ?? "",
    ]
      .filter(Boolean)
      .join(" "),
  });

  return (
    <label className="block text-xs font-semibold text-slate-600">
      <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      {control}
    </label>
  );
}
