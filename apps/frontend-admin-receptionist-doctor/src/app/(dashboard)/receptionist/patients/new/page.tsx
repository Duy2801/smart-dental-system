"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/src/components/layout/header";
import apiClient from "@/src/lib/api/client";
import {
  ArrowLeft,
  Check,
  CalendarPlus,
  SpinnerGap,
  Warning,
} from "@phosphor-icons/react";

type FormState = {
  fullName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "";
  address: string;
  allergies: string;
  medicalHistory: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

const INITIAL: FormState = {
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  allergies: "",
  medicalHistory: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

export default function NewPatientPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (andBook: boolean) => {
    setError(null);
    if (!form.fullName.trim() || !form.phone.trim()) {
      setError("Vui lòng nhập họ tên và số điện thoại.");
      return;
    }

    setSubmitting(true);
    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      dateOfBirth: form.dateOfBirth || undefined,
      gender: form.gender || undefined,
      address: form.address.trim() || undefined,
      allergies: form.allergies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      medicalHistory: form.medicalHistory.trim() || undefined,
      emergencyContactName: form.emergencyContactName.trim() || undefined,
      emergencyContactPhone: form.emergencyContactPhone.trim() || undefined,
    };

    let id = "";
    try {
      const res = await apiClient.post<{ id: string }>("/patients", payload);
      if (!res.data?.id) throw new Error("missing id");
      id = res.data.id;
    } catch {
      setError("Không tạo được bệnh nhân. Kiểm tra SĐT/email đã tồn tại chưa.");
      setSubmitting(false);
      return;
    }

    router.push(
      andBook
        ? `/receptionist/appointments/new?patientId=${id}&patientName=${encodeURIComponent(form.fullName.trim())}&patientPhone=${encodeURIComponent(form.phone.trim())}`
        : `/receptionist/patients/${id}`,
    );
    setSubmitting(false);
  };

  return (
    <>
      <Header
        title="Thêm bệnh nhân"
        description="Đăng ký hồ sơ khách hàng mới cho phòng khám."
      />

      <div className="bg-muted min-h-screen p-6">
        <div className="mx-auto max-w-3xl space-y-5">
          <Link
            href="/receptionist/patients"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-brand-dark"
          >
            <ArrowLeft size={16} /> Quay lại danh sách
          </Link>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <Warning weight="fill" size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save(false);
            }}
            className="space-y-5"
          >
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-brand-dark">Thông tin cơ bản</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="Nguyễn Văn An"
                    className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="0901234567"
                    className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-mono font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="email@example.com"
                    className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => set("dateOfBirth", e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Giới tính
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) =>
                      set("gender", e.target.value as FormState["gender"])
                    }
                    className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 cursor-pointer"
                  >
                    <option value="">-- Chọn --</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Địa chỉ
                  </label>
                  <input
                    value={form.address}
                    onChange={(e) => set("address", e.target.value)}
                    placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                    className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-brand-dark">Thông tin y tế</h2>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Dị ứng (cách nhau bởi dấu phẩy)
                </label>
                <input
                  value={form.allergies}
                  onChange={(e) => set("allergies", e.target.value)}
                  placeholder="Penicillin, Latex..."
                  className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Tiền sử bệnh
                </label>
                <textarea
                  rows={3}
                  value={form.medicalHistory}
                  onChange={(e) => set("medicalHistory", e.target.value)}
                  placeholder="Cao huyết áp, tiểu đường..."
                  className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 resize-y"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-brand-dark">Liên hệ khẩn cấp</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Họ tên người liên hệ
                  </label>
                  <input
                    value={form.emergencyContactName}
                    onChange={(e) => set("emergencyContactName", e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Số điện thoại
                  </label>
                  <input
                    value={form.emergencyContactPhone}
                    onChange={(e) => set("emergencyContactPhone", e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm font-mono font-medium outline-none transition-all focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <Link
                href="/receptionist/patients"
                className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                Hủy
              </Link>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void save(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-brand bg-brand/5 px-5 py-2.5 text-sm font-bold text-brand transition-all hover:bg-brand/10 disabled:opacity-60 active:scale-[0.98]"
              >
                {submitting ? (
                  <SpinnerGap size={16} className="animate-spin" />
                ) : (
                  <CalendarPlus size={16} />
                )}
                Lưu & tạo lịch
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-dark disabled:opacity-60 active:scale-[0.98]"
              >
                {submitting ? (
                  <SpinnerGap size={16} className="animate-spin" />
                ) : (
                  <Check size={16} weight="bold" />
                )}
                Lưu hồ sơ
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
