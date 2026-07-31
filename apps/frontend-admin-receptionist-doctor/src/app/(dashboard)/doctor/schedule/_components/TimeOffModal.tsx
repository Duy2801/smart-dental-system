"use client";

import { useState } from "react";
import { X, SpinnerGap } from "@phosphor-icons/react";
import axios from "axios";
import apiClient from "@/src/lib/api/client";
import { localDateStr } from "@/src/lib/receptionist/mappers";

type Props = {
  doctorId: string;
  onClose: () => void;
  onSuccess: () => void;
};

const ERROR_MAP: Record<string, string> = {
  "availability.shift_overlap": "Khung giờ trùng với ca/nghỉ đã đăng ký.",
  "availability.invalid_time_range": "Giờ bắt đầu phải trước giờ kết thúc.",
  "availability.specific_date_required": "Vui lòng chọn ngày nghỉ.",
  "availability.day_or_specific_date_required": "Vui lòng chọn ngày nghỉ.",
};

function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  const cur = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cur <= end) {
    dates.push(localDateStr(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function normalizeTime(t: string) {
  return t.slice(0, 5);
}

function apiErrorMessage(err: unknown): string {
  if (!axios.isAxiosError(err)) return "Không thể gửi yêu cầu. Vui lòng thử lại.";
  const raw = err.response?.data?.message;
  const key = Array.isArray(raw) ? raw[0] : raw;
  if (typeof key === "string" && ERROR_MAP[key]) return ERROR_MAP[key];
  if (typeof key === "string" && key.startsWith("availability.")) {
    return "Dữ liệu nghỉ không hợp lệ. Vui lòng kiểm tra lại.";
  }
  return "Không thể gửi yêu cầu. Vui lòng thử lại.";
}

export function TimeOffModal({ doctorId, onClose, onSuccess }: Props) {
  const today = localDateStr();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fromDate: today,
    toDate: today,
    startTime: "08:00",
    endTime: "17:00",
    reason: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const startTime = normalizeTime(form.startTime);
    const endTime = normalizeTime(form.endTime);

    if (!form.fromDate || !form.toDate) {
      setError("Vui lòng chọn ngày bắt đầu và ngày kết thúc.");
      return;
    }
    if (form.fromDate < today) {
      setError("Không thể đăng ký nghỉ cho ngày đã qua.");
      return;
    }
    if (form.toDate < form.fromDate) {
      setError("Ngày kết thúc phải từ ngày bắt đầu trở đi.");
      return;
    }
    if (startTime >= endTime) {
      setError("Giờ bắt đầu phải trước giờ kết thúc.");
      return;
    }
    if (!form.reason.trim()) {
      setError("Vui lòng nhập lý do nghỉ.");
      return;
    }

    const dates = eachDate(form.fromDate, form.toDate);
    if (dates.length > 31) {
      setError("Khoảng nghỉ tối đa 31 ngày mỗi lần đăng ký.");
      return;
    }

    setLoading(true);
    try {
      for (const date of dates) {
        await apiClient.post("/doctor-availability", {
          doctorId,
          recordType: "TIME_OFF",
          specificDate: date,
          startTime,
          endTime,
          reason: form.reason.trim(),
          isActive: true,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-brand-dark">
            Đăng ký ngày nghỉ
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-brand-dark"
          >
            <X size={18} />
          </button>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">
                Từ ngày
              </label>
              <input
                type="date"
                required
                min={today}
                value={form.fromDate}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    fromDate: e.target.value,
                    toDate: f.toDate < e.target.value ? e.target.value : f.toDate,
                  }))
                }
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">
                Đến ngày
              </label>
              <input
                type="date"
                required
                min={form.fromDate || today}
                value={form.toDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, toDate: e.target.value }))
                }
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">
                Từ giờ
              </label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    startTime: normalizeTime(e.target.value),
                  }))
                }
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">
                Đến giờ
              </label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    endTime: normalizeTime(e.target.value),
                  }))
                }
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-dark">
              Lý do nghỉ
            </label>
            <textarea
              rows={3}
              required
              placeholder="Ví dụ: Bận việc gia đình, đi hội thảo chuyên môn..."
              value={form.reason}
              onChange={(e) =>
                setForm((f) => ({ ...f, reason: e.target.value }))
              }
              className="resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-inset ring-red-200">
              {error}
            </p>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
            >
              {loading && <SpinnerGap size={14} className="animate-spin" />}
              {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
