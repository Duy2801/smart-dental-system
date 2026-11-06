"use client";

import type { FormEvent } from "react";
import { useState } from "react";

export type PatientFormDefaults = {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  relationship?: string;
  gender?: string;
};

export type PatientFormValues = {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  relationship: string;
  gender: string;
};

export const RELATIONSHIP_OPTIONS = [
  { value: "CHILD", label: "Con" },
  { value: "FATHER", label: "Cha" },
  { value: "MOTHER", label: "Mẹ" },
  { value: "OTHER", label: "Người thân khác" },
] as const;

export const GENDER_OPTIONS = [
  { value: "", label: "Chưa rõ giới tính" },
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
] as const;

const PHONE_PATTERN = /^0\d{9}$/;

const todayKey = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

const toDateInput = (value?: string) =>
  value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : "";

const fieldClass =
  "h-9 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-[11px] sm:text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#0863c5] focus:ring-2 focus:ring-blue-100 disabled:opacity-60";

type PatientInfoFormProps = {
  defaults?: PatientFormDefaults;
  disabled?: boolean;
  onSubmit: (values: PatientFormValues) => void;
};

/**
 * Form "Thông tin người khám" hiển thị ngay trong tin nhắn của trợ lý AI khi
 * khách đặt lịch cho người thân, để điền một lần thay vì gõ tự do.
 */
export function PatientInfoForm({ defaults, disabled, onSubmit }: PatientInfoFormProps) {
  const [values, setValues] = useState<PatientFormValues>({
    fullName: defaults?.fullName ?? "",
    phone: defaults?.phone ?? "",
    dateOfBirth: toDateInput(defaults?.dateOfBirth),
    relationship: defaults?.relationship || "CHILD",
    gender: defaults?.gender ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof PatientFormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setError(null);
  };

  const canSubmit = values.fullName.trim().length >= 2 && !disabled;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullName = values.fullName.trim().replace(/\s+/g, " ");
    const phone = values.phone.trim();

    if (fullName.length < 2) {
      setError("Vui lòng nhập họ tên người khám.");
      return;
    }
    if (phone && !PHONE_PATTERN.test(phone)) {
      setError("Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.");
      return;
    }
    if (values.dateOfBirth && values.dateOfBirth > todayKey()) {
      setError("Ngày sinh không được lớn hơn hôm nay.");
      return;
    }

    onSubmit({ ...values, fullName, phone });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-1.5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2.5"
    >
      <input
        value={values.fullName}
        onChange={(event) => update("fullName", event.target.value)}
        placeholder="Họ tên người khám"
        aria-label="Họ tên người khám"
        maxLength={100}
        disabled={disabled}
        className={`${fieldClass} col-span-2`}
      />
      <input
        value={values.phone}
        onChange={(event) => update("phone", event.target.value.replace(/[^\d]/g, ""))}
        placeholder="Số điện thoại nếu có"
        aria-label="Số điện thoại"
        inputMode="tel"
        maxLength={10}
        disabled={disabled}
        className={`${fieldClass} col-span-2`}
      />
      <input
        type="date"
        value={values.dateOfBirth}
        max={todayKey()}
        onChange={(event) => update("dateOfBirth", event.target.value)}
        aria-label="Ngày sinh"
        disabled={disabled}
        className={fieldClass}
      />
      <select
        value={values.relationship}
        onChange={(event) => update("relationship", event.target.value)}
        aria-label="Quan hệ với người đặt"
        disabled={disabled}
        className={fieldClass}
      >
        {RELATIONSHIP_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        value={values.gender}
        onChange={(event) => update("gender", event.target.value)}
        aria-label="Giới tính"
        disabled={disabled}
        className={fieldClass}
      >
        {GENDER_OPTIONS.map((option) => (
          <option key={option.value || "unknown"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={!canSubmit}
        className="h-9 rounded-xl bg-[#0863c5] text-[11px] sm:text-xs font-bold text-white transition hover:bg-[#0756aa] active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        Lưu hồ sơ
      </button>
      {error && (
        <p role="alert" className="col-span-2 text-[10px] sm:text-[11px] font-medium text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
