"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Plus, Trash, SpinnerGap } from "@phosphor-icons/react";
import axios from "axios";
import apiClient from "@/src/lib/api/client";

export type RecordImage = {
  url: string;
  caption?: string | null;
  type?: "xray" | "intraoral" | "other";
};

const TYPE_LABEL = {
  xray: "X-quang",
  intraoral: "Nội khoa",
  other: "Khác",
} as const;

type Props = {
  recordId: string;
  value: RecordImage[];
  onChange: (next: RecordImage[]) => void;
  onUploaded?: (detailImages: RecordImage[]) => void;
};

export function MedicalRecordImages({
  recordId,
  value,
  onChange,
  onUploaded,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [caption, setCaption] = useState("");
  const [type, setType] = useState<"xray" | "intraoral" | "other">("xray");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) {
      setErr("Nhập URL ảnh.");
      return;
    }
    if (value.length >= 20) {
      setErr("Tối đa 20 ảnh.");
      return;
    }
    onChange([...value, { url, caption: caption.trim() || null, type }]);
    setUrlInput("");
    setCaption("");
    setErr(null);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Chỉ chọn file ảnh.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErr("Ảnh tối đa 3MB.");
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
        setErr(typeof msg === "string" ? msg : "Upload ảnh thất bại.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Dán URL ảnh (Cloudinary…)"
          className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
        />
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as "xray" | "intraoral" | "other")
          }
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="xray">X-quang</option>
          <option value="intraoral">Nội khoa</option>
          <option value="other">Khác</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Chú thích (tuỳ chọn)"
          className="min-w-[160px] flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={addUrl}
          className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
        >
          <Plus size={12} weight="bold" /> Thêm URL
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-brand-dark hover:bg-slate-50 disabled:opacity-60"
        >
          {busy ? (
            <SpinnerGap size={12} className="animate-spin" />
          ) : (
            <ImageIcon size={12} />
          )}
          {busy ? "Đang tải..." : "Chọn file"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
      </div>
      {err ? <p className="text-xs font-medium text-red-600">{err}</p> : null}
      <p className="text-[11px] text-muted-foreground">
        Chọn file sẽ upload ngay lên server. URL cần bấm &quot;Lưu ảnh&quot;.
      </p>

      {value.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Chưa có ảnh X-quang / nội khoa.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {value.map((img, i) => (
            <li
              key={`${img.url.slice(0, 48)}-${i}`}
              className="overflow-hidden rounded-xl border border-border bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.caption || `Ảnh ${i + 1}`}
                className="h-36 w-full object-cover bg-slate-100"
              />
              <div className="flex items-start justify-between gap-2 p-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">
                    {TYPE_LABEL[img.type ?? "other"]}
                  </p>
                  <p className="truncate text-xs font-medium text-slate-800">
                    {img.caption || "Không chú thích"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, j) => j !== i))}
                  className="rounded-md p-1.5 text-red-500 hover:bg-red-50"
                  aria-label="Xóa ảnh"
                >
                  <Trash size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
