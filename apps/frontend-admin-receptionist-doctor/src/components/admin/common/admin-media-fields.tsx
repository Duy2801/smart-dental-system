"use client";

import { useId, type ReactNode } from "react";
import { ImageSquare, Trash, UploadSimple } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";
import { adminControlClass, adminControlTone } from "./admin-field";

type AdminTextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: ReactNode;
};

/** Ô nhập nhiều dòng dùng chung cho các form quản trị */
export function AdminTextarea({ label, value, onChange, placeholder, rows = 3, hint }: AdminTextareaProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={cn(adminControlClass, adminControlTone(), "w-full resize-none py-2.5 leading-relaxed")}
      />
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function readFileAsDataUrl(file: File, onLoad: (value: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") onLoad(reader.result);
  };
  reader.readAsDataURL(file);
}

type AdminImagePickerProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  hint?: ReactNode;
  /** compact: ô nhỏ trong lưới; wide: khung ảnh lớn kèm gợi ý */
  layout?: "compact" | "wide";
};

/** Chọn ảnh từ máy, xem trước và gỡ ảnh */
export function AdminImagePicker({ label, value, onChange, hint, layout = "compact" }: AdminImagePickerProps) {
  const isWide = layout === "wide";

  return (
    <div className="flex flex-col gap-1.5">
      {label ? <span className="text-[13px] font-semibold text-slate-700">{label}</span> : null}
      <div
        className={cn(
          "flex min-w-0 gap-3",
          isWide ? "flex-col sm:flex-row sm:items-center sm:gap-4" : "items-center rounded-xl border border-slate-200 bg-white p-2.5",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50",
            isWide ? "h-28 w-full rounded-xl sm:w-48" : "h-16 w-24 rounded-lg border",
          )}
        >
          {value ? (
            <img src={value} alt={label ?? "Ảnh đã chọn"} className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-slate-300">
              <ImageSquare size={isWide ? 28 : 22} weight="duotone" />
              {isWide ? <span className="text-xs font-medium text-slate-400">Chưa chọn ảnh</span> : null}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-brand px-3 text-xs font-bold text-white shadow-sm shadow-brand/25 transition-colors hover:bg-[#0084e0] focus-within:ring-3 focus-within:ring-brand/25">
              <UploadSimple size={14} weight="bold" />
              {value ? "Đổi ảnh" : "Chọn ảnh"}
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) readFileAsDataUrl(file, onChange);
                  event.target.value = "";
                }}
                className="sr-only"
              />
            </label>
            {value ? (
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Gỡ ảnh"
                title="Gỡ ảnh"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash size={14} />
                {isWide ? "Gỡ ảnh" : null}
              </button>
            ) : null}
          </div>
          {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}
