"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Trash, SpinnerGap, Sparkle, UploadSimple } from "@phosphor-icons/react";
import axios from "axios";
import apiClient from "@/src/lib/api/client";
import { DoctorXrayAnalysisModal } from "./DoctorXrayAnalysisModal";

export type RecordImage = {
  url: string;
  caption?: string | null;
  type?: "xray" | "intraoral" | "other";
};

const TYPE_LABEL = {
  xray: "Phim X-quang",
  intraoral: "Trong miệng (Lâm sàng)",
  other: "Ngoài mặt / Khác",
} as const;

type Props = {
  recordId: string;
  patientId?: string;
  patientName?: string;
  value: RecordImage[];
  onChange: (next: RecordImage[]) => void;
  onUploaded?: (detailImages: RecordImage[]) => void;
  onApplyAiDiagnosis?: (diagnosis: string, treatmentNotes: string) => void;
};

export function MedicalRecordImages({
  recordId,
  patientId,
  patientName,
  value,
  onChange,
  onUploaded,
  onApplyAiDiagnosis,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [type, setType] = useState<"xray" | "intraoral" | "other">("xray");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState<RecordImage | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Chỉ chọn file ảnh (JPG, PNG, DICOM, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Dung lượng ảnh tối đa 5MB.");
      return;
    }
    if (value.length >= 20) {
      setErr("Mỗi hồ sơ lưu tối đa 20 ảnh.");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      const form = new FormData();
      form.append("file", file);
      if (caption.trim()) form.append("caption", caption.trim());
      form.append("type", type);
      const res = await apiClient.post<{ images: RecordImage[] }>(
        `/medical-records/${recordId}/images`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60_000,
          transformRequest: [
            (data, headers) => {
              // Axios tự gắn boundary khi data là FormData
              if (typeof FormData !== "undefined" && data instanceof FormData) {
                if (headers && typeof headers === "object") {
                  delete (headers as Record<string, unknown>)["Content-Type"];
                }
              }
              return data;
            },
          ],
        },
      );
      const images = res.data.images ?? [];
      onChange(images);
      onUploaded?.(images);
      setCaption("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      const status = axios.isAxiosError(e) ? e.response?.status : null;
      const msg = axios.isAxiosError(e)
        ? (Array.isArray(e.response?.data?.message)
            ? e.response?.data?.message[0]
            : e.response?.data?.message)
        : null;
      if (status === 404) {
        setErr("Không tìm thấy hồ sơ. F5 tải lại danh sách rồi thử lại.");
      } else {
        setErr(typeof msg === "string" ? msg : "Tải ảnh lên thất bại.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. UPLOAD CONTROLS BAR (CHỈ CHỌN FILE) */}
      <div className="rounded-2xl border border-border bg-slate-50/70 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Select Type */}
          <div className="w-full sm:w-auto">
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as "xray" | "intraoral" | "other")
              }
              className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-2xs outline-none focus:border-brand cursor-pointer"
            >
              <option value="xray">🩻 Phim X-quang (Panorama / Cận chóp)</option>
              <option value="intraoral">📸 Trong miệng (Lâm sàng)</option>
              <option value="other">📁 Ngoài mặt / Xét nghiệm khác</option>
            </select>
          </div>

          {/* Caption Input */}
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Nhập chú thích ảnh (VD: Răng 46 trước khi trám, Panorama ngày 24/08)..."
            className="flex-1 min-w-[200px] rounded-xl border border-border bg-white px-3.5 py-2.5 text-xs outline-none focus:border-brand focus:ring-1 focus:ring-brand shadow-2xs"
          />

          {/* Upload Button */}
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60 cursor-pointer shrink-0"
          >
            {busy ? (
              <SpinnerGap size={15} className="animate-spin" />
            ) : (
              <UploadSimple size={15} weight="bold" />
            )}
            {busy ? "Đang tải ảnh lên..." : "Chọn file ảnh từ máy tính"}
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </div>

        {err && <p className="text-xs font-medium text-red-600">{err}</p>}
        <p className="text-[11px] text-muted-foreground">
          Định dạng hỗ trợ: JPG, PNG, WEBP (Tối đa 5MB/ảnh). Ảnh sẽ được tải lên Cloudinary và lưu tự động vào bệnh án.
        </p>
      </div>

      {/* 2. GALLERY LIST */}
      {value.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-14 text-center">
          <ImageIcon size={40} className="mb-2 text-slate-300" weight="duotone" />
          <p className="text-sm font-semibold text-slate-800">
            Chưa có ảnh nào được lưu cho bệnh án này
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Chọn loại ảnh ở trên và bấm "Chọn file ảnh từ máy tính" để đính kèm phim X-quang hoặc ảnh chụp trong miệng.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3.5 sm:grid-cols-2">
          {value.map((img, i) => (
            <li
              key={`${img.url.slice(0, 48)}-${i}`}
              className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs transition hover:shadow-sm"
            >
              <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.caption || `Ảnh ${i + 1}`}
                  className="h-full w-full object-contain"
                />
                <span className="absolute top-2.5 left-2.5 rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs border border-white/10">
                  {TYPE_LABEL[img.type ?? "other"]}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-slate-900">
                    {img.caption || "Không có chú thích"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAnalyzingImage(img)}
                    className="inline-flex items-center gap-1 rounded-lg border border-brand/20 bg-brand/5 px-2.5 py-1.5 text-xs font-bold text-brand hover:bg-brand/10 transition cursor-pointer"
                    title="Phân tích X-quang bằng AI"
                  >
                    <Sparkle size={13} weight="fill" /> Phân tích AI
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, j) => j !== i))}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                    aria-label="Xóa ảnh"
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 3. MODAL KÍNH SOI AI */}
      {analyzingImage && (
        <DoctorXrayAnalysisModal
          imageUrl={analyzingImage.url}
          imageCaption={analyzingImage.caption}
          patientId={patientId}
          patientName={patientName}
          onClose={() => setAnalyzingImage(null)}
          onApplyToRecord={onApplyAiDiagnosis}
        />
      )}
    </div>
  );
}
