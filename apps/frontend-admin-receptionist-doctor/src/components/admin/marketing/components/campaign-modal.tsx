"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { ImagesSquare, Megaphone, PencilSimple, Trash, UploadSimple } from "@phosphor-icons/react";
import {
  AdminButton,
  AdminInput,
  AdminModal,
  AdminTextarea,
  IMAGE_ACCEPT,
  collapseSpaces,
  focusFirstError,
  hasErrors,
  validateImageFile,
  validateText,
  type FieldErrors,
} from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import type { CreateBannerPayload } from "../marketing-api";
import type { Banner } from "../types";

type BannerModalProps = {
  initialData?: Banner | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateBannerPayload) => void;
};

type BannerField = "title" | "description" | "imageUrl";

const BANNER_MAX_MB = 5;

function readFileAsDataUrl(file: File, onLoad: (value: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") onLoad(reader.result);
  };
  reader.readAsDataURL(file);
}

export function CampaignModal({
  initialData,
  loading = false,
  onClose,
  onSubmit,
}: BannerModalProps) {
  const isEditing = Boolean(initialData);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [imageUrl, setImageUrl] = useState<string>(initialData?.imageUrl || "");
  const [isActive, setIsActive] = useState(initialData ? initialData.isActive : true);
  const [errors, setErrors] = useState<FieldErrors<BannerField>>({});

  const clearError = (field: BannerField) =>
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  const handleFileSelect = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const invalid = validateImageFile(file, BANNER_MAX_MB);
    if (invalid) {
      setErrors((current) => ({ ...current, imageUrl: invalid }));
      return;
    }
    clearError("imageUrl");
    readFileAsDataUrl(file, setImageUrl);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: FieldErrors<BannerField> = {
      title: validateText(title, { label: "Tiêu đề banner", required: true, min: 3, max: 120 }),
      description: validateText(description, { label: "Mô tả", max: 300 }),
      imageUrl: imageUrl ? undefined : "Vui lòng chọn hình ảnh cho banner.",
    };
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      focusFirstError(formRef.current);
      return;
    }

    onSubmit({
      title: collapseSpaces(title),
      description: description.trim() || undefined,
      imageUrl: imageUrl.trim(),
      isActive,
    });
  };

  return (
    <AdminModal
      title={isEditing ? "Chỉnh sửa banner" : "Thêm banner mới"}
      description={
        isEditing
          ? "Cập nhật thông tin và hình ảnh banner quảng cáo."
          : "Tải ảnh banner và nhập thông tin để hiển thị trên ứng dụng."
      }
      icon={isEditing ? <PencilSimple size={20} weight="duotone" /> : <Megaphone size={20} weight="duotone" />}
      size="md"
      variant="drawer"
      onClose={onClose}
      footer={
        <>
          <AdminButton type="submit" form={formId} loading={loading}>
            {loading ? "Đang xử lý..." : isEditing ? "Lưu cập nhật" : "Tạo banner"}
          </AdminButton>
          <AdminButton variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </AdminButton>
        </>
      }
    >
      <form id={formId} ref={formRef} noValidate className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
        <AdminInput
          label="Tiêu đề banner"
          required
          maxLength={120}
          value={title}
          error={errors.title}
          onChange={(event) => {
            clearError("title");
            setTitle(event.target.value);
          }}
          placeholder="VD: Ưu đãi niềng răng thẩm mỹ 30%"
        />

        <AdminTextarea
          label="Mô tả chi tiết"
          rows={2}
          maxLength={300}
          value={description}
          error={errors.description}
          onChange={(value) => {
            clearError("description");
            setDescription(value);
          }}
          placeholder="Nhập thông điệp quảng cáo ngắn gọn..."
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-slate-700">
            Hình ảnh banner <span className="text-rose-500">*</span>
          </span>

          <input
            type="file"
            ref={fileInputRef}
            accept={IMAGE_ACCEPT}
            className="hidden"
            onChange={(e) => {
              handleFileSelect(e.target.files);
              e.target.value = "";
            }}
          />

          {imageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
              <div className="relative h-40 w-full overflow-hidden rounded-xl bg-slate-900/5">
                <img src={imageUrl} alt="Xem trước banner" className="h-full w-full object-cover" />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 px-1">
                <span className="text-xs font-medium text-slate-500">Đã chọn hình ảnh</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    <UploadSimple size={13} weight="bold" />
                    Đổi ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash size={13} />
                    Gỡ ảnh
                  </button>
                </div>
              </div>
              {errors.imageUrl ? (
                <p className="mt-1.5 px-1 text-xs font-medium text-rose-600">{errors.imageUrl}</p>
              ) : null}
            </div>
          ) : (
            <button
              type="button"
              data-invalid={errors.imageUrl ? "true" : undefined}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/25",
                errors.imageUrl
                  ? "border-red-300 bg-red-50/50"
                  : "border-slate-300 bg-slate-50/50 hover:border-brand hover:bg-brand-light/40",
              )}
            >
              <span className="mb-2 grid h-12 w-12 place-items-center rounded-2xl bg-brand-light text-brand">
                <ImagesSquare size={24} weight="duotone" />
              </span>
              <span className="text-sm font-semibold text-slate-800">Kéo thả hoặc bấm để tải ảnh banner</span>
              <span className="mt-1 text-xs text-slate-400">PNG, JPG, WEBP · tối đa {BANNER_MAX_MB}MB · nên dùng ảnh ngang</span>
              {errors.imageUrl ? (
                <span className="mt-2 text-xs font-semibold text-red-500">{errors.imageUrl}</span>
              ) : null}
            </button>
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 transition-colors hover:bg-slate-50">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 accent-brand"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800">Hiển thị ngay trên trang chủ</span>
            <span className="block text-xs text-slate-500">Trang chủ chỉ hiển thị 1 banner — bật banner này sẽ tự động ẩn banner đang hiển thị khác.</span>
          </span>
        </label>
      </form>
    </AdminModal>
  );
}
