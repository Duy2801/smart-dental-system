"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { login, useAppDispatch, useAppSelector } from "@/providers";
import { apiUpdatePatientProfile } from "../api";
import { PatientProfileForm } from "./PatientProfileForm";
import type { PatientProfileUser, ProfileFormState } from "../types";

type PatientProfileEditorModalProps = {
  open: boolean;
  profile?: PatientProfileUser | null;
  onClose: () => void;
  onSaved?: (profile: PatientProfileUser) => void;
};

const initialMessage = null;

function splitAllergies(value?: string | null) {
  return value
    ?.replace(/^Di ung:\s*/i, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
}

export function PatientProfileEditorModal({
  open,
  profile,
  onClose,
  onSaved,
}: PatientProfileEditorModalProps) {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.login.accessToken);
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(initialMessage);

  const defaults = useMemo(
    (): ProfileFormState => ({
      fullName: profile?.fullName ?? "",
      phone: profile?.phone ?? "",
      email: profile?.email ?? "",
      dateOfBirth: profile?.patientProfile?.dateOfBirth?.slice(0, 10) ?? "",
      gender: profile?.patientProfile?.gender ?? "UNKNOWN",
      address: profile?.patientProfile?.address ?? "",
      medicalHistory: profile?.patientProfile?.medicalHistory ?? "",
      allergies: splitAllergies(
        profile?.patientProfile?.medicalHistory,
      ).join(", "),
    }),
    [profile],
  );

  const [form, setForm] = useState<ProfileFormState>(defaults);

  useEffect(() => {
    if (!open) return;
    setForm(defaults);
    setMessage(initialMessage);
  }, [defaults, open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setMessage(initialMessage);

    try {
      const response = await apiUpdatePatientProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender,
        address: form.address.trim() || null,
        medicalHistory: form.medicalHistory.trim() || null,
        allergies: form.allergies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      dispatch(
        login({
          user: response.data,
          accessToken,
        }),
      );
      queryClient.setQueryData(["patient", "profile"], response.data);
      queryClient.invalidateQueries({ queryKey: ["patient", "profile"] });
      onSaved?.(response.data);
      setMessage("Đã cập nhật hồ sơ.");
      onClose();
    } catch {
      setMessage("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return message ? (
      <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
        {message}
      </div>
    ) : null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
    >
      <form
        onSubmit={submit}
        className="w-full max-w-2xl overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200/70"
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#0058bc] to-cyan-500 px-6 py-5 text-white sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">
                Thông tin bệnh nhân
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.03em]">
                Cập nhật hồ sơ
              </h2>
              <p className="mt-2 max-w-lg text-xs leading-5 text-blue-50/90">
                Điều chỉnh nhanh thông tin cơ bản, liên hệ và tiền sử y khoa.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/25"
            >
              ×
            </button>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-y-auto px-6 py-6 sm:px-8">
          <PatientProfileForm form={form} setForm={setForm} />

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-[10px] font-medium text-slate-500">
              Dữ liệu sẽ được cập nhật ngay khi bấm lưu.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                disabled={saving}
                className="rounded-full bg-[#0058bc] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#0450a7] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
