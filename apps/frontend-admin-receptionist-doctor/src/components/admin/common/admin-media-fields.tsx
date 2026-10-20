"use client";

import { useId, useState, type ReactNode } from "react";
import { ImageSquare, Trash, UploadSimple } from "@phosphor-icons/react";
import { cn } from "@/src/lib/utils/cn";
import { adminControlClass, adminControlTone } from "./admin-field";
import { IMAGE_ACCEPT, validateImageFile } from "./admin-validation";

type AdminTextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  /** Hiện bộ đếm ký tự và chặn nhập quá giới hạn */
  maxLength?: number;
};

/** Ô nhập nhiều dòng dùng chung cho các form quản trị */
export function AdminTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  hint,
  error,
  required = false,
  maxLength,
}: AdminTextareaProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-semibold text-slate-700">
          {label}
          {required && (
            <span className="ml-1 text-rose-500" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {maxLength ? (
          <span className={cn("text-[11px] tabular-nums", value.length >= maxLength ? "text-rose-500" : "text-slate-400")}>
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        className={cn(adminControlClass, adminControlTone(Boolean(error)), "w-full resize-none py-2.5 leading-relaxed")}
      />
      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-500">{hint}</p>
      ) : null}
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
  error?: ReactNode;
  required?: boolean;
  /** Dung lượng ảnh tối đa (MB) */
  maxMB?: number;
};

/** Chọn ảnh từ máy, xem trước và gỡ ảnh */
export function AdminImagePicker({
  label,
  value,
  onChange,
  hint,
  layout = "compact",
  error,
  required = false,
  maxMB = 5,
}: AdminImagePickerProps) {
  const isWide = layout === "wide";
  const [fileError, setFileError] = useState<string | null>(null);
  const shownError = fileError ?? error;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <span className="text-[13px] font-semibold text-slate-700">
          {label}
          {required && (
            <span className="ml-1 text-rose-500" aria-hidden="true">
              *
            </span>
          )}
        </span>
      ) : null}
      <div
        data-invalid={shownError ? "true" : undefined}
        tabIndex={shownError ? -1 : undefined}
        className={cn(
          "flex min-w-0 gap-3 outline-none",
          isWide
            ? "flex-col sm:flex-row sm:items-center sm:gap-4"
            : cn("items-center rounded-xl border bg-white p-2.5", shownError ? "border-rose-300" : "border-slate-200"),
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
                accept={IMAGE_ACCEPT}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  const invalid = validateImageFile(file, maxMB);
                  setFileError(invalid ?? null);
                  if (!invalid) readFileAsDataUrl(file, onChange);
                }}
                className="sr-only"
              />
            </label>
            {value ? (
              <button
                type="button"
                onClick={() => {
                  setFileError(null);
                  onChange("");
                }}
                aria-label="Gỡ ảnh"
                title="Gỡ ảnh"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash size={14} />
                {isWide ? "Gỡ ảnh" : null}
              </button>
            ) : null}
          </div>
          {shownError ? (
            <p className="text-xs font-medium text-rose-600">{shownError}</p>
          ) : (
            <p className="text-xs text-slate-500">{hint ?? `PNG, JPG hoặc WEBP, tối đa ${maxMB}MB.`}</p>
          )}
        </div>
      </div>
    </div>
  );
}
