"use client";

import { X } from "@phosphor-icons/react";

type Props = {
  onClose: () => void;
};

export function TimeOffModal({ onClose }: Props) {
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
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-brand-dark"
          >
            <X size={18} />
          </button>
        </div>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            onClose();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-brand-dark">
              Ngày xin nghỉ
            </label>
            <input
              type="date"
              required
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">
                Từ giờ
              </label>
              <input
                type="time"
                required
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
              className="resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
            />
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
            >
              Gửi yêu cầu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
