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
  { value: "UNKNOWN", label: "Chua cap nhat" },
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nu" },
  { value: "OTHER", label: "Khac" },
] as const;

type PatientProfileFormProps = {
  form: ProfileFormState;
  setForm: Dispatch<SetStateAction<ProfileFormState>>;
};

export function PatientProfileForm({
  form,
  setForm,
}: PatientProfileFormProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Ho va ten">
        <input
          value={form.fullName}
          onChange={(event) =>
            setForm((current) => ({ ...current, fullName: event.target.value }))
          }
        />
      </Field>
      <Field label="So dien thoai">
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
      <Field label="Ngay sinh">
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
      <Field label="Gioi tinh">
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
      <Field label="Dia chi">
        <input
          value={form.address}
          onChange={(event) =>
            setForm((current) => ({ ...current, address: event.target.value }))
          }
        />
      </Field>
      <div className="sm:col-span-2">
        <Field label="Tien su y khoa">
          <textarea
            value={form.medicalHistory}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                medicalHistory: event.target.value,
              }))
            }
            rows={3}
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Field label="Di ung (cach nhau boi dau phay)">
          <input
            value={form.allergies}
            onChange={(event) =>
              setForm((current) => ({ ...current, allergies: event.target.value }))
            }
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactElement<any>;
}) {
  if (!isValidElement(children)) return null;
  const childProps = children.props as { className?: string };

  const control = cloneElement(children as ReactElement<any>, {
    className: [
      "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0058bc] focus:bg-white focus:ring-4 focus:ring-blue-100",
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
