import { useRef, useState, type FormEvent } from "react";
import type { CreateBannerPayload } from "../marketing-api";
import type { Banner } from "../types";

type BannerModalProps = {
  initialData?: Banner | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateBannerPayload) => void;
};

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string>(
    initialData?.imageUrl || "",
  );
  const [imageError, setImageError] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      alert("Vui lòng chọn một tệp hình ảnh (.png, .jpg, .jpeg, .webp)");
      return;
    }
    setImageError(false);
    readFileAsDataUrl(file, (dataUrl) => {
      setImageUrl(dataUrl);
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (!imageUrl) {
      setImageError(true);
      return;
    }

    const payload: CreateBannerPayload = {
      title: String(formData.get("title")).trim(),
      description: String(formData.get("description") || "").trim() || undefined,
      imageUrl: imageUrl.trim(),
      isActive: formData.get("isActive") === "on",
    };

    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative flex w-full max-w-xl flex-col rounded-3xl border border-border bg-white p-6 shadow-2xl sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-bold text-brand-dark">
              {isEditing ? "Chỉnh Sửa Banner" : "Thêm Banner Mới"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {isEditing
                ? "Cập nhật thông tin và hình ảnh banner quảng cáo"
                : "Tải ảnh banner và nhập thông tin để hiển thị trên ứng dụng"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form id="banner-form" className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Tiêu đề Banner */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brand-dark">
              Tiêu đề Banner <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={initialData?.title || ""}
              placeholder="Nhập tiêu đề banner (ví dụ: Ưu Đãi Niềng Răng Thẩm Mỹ 30%)"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Mô tả Banner */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brand-dark">
              Mô tả chi tiết
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={initialData?.description || ""}
              placeholder="Nhập thông điệp quảng cáo ngắn gọn..."
              className="resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Tải ảnh Banner File Input Dropzone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-brand-dark">
              Hình ảnh Banner <span className="text-red-500">*</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {imageUrl ? (
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                <div className="relative h-36 w-full overflow-hidden rounded-xl bg-slate-900/5">
                  <img
                    src={imageUrl}
                    alt="Banner Preview"
                    className="h-full w-full object-cover"
                    onError={() => {
                      // fallback
                    }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between px-1">
                  <span className="text-xs text-slate-500">Đã chọn hình ảnh</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                    >
                      Đổi ảnh khác
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileSelect(e.dataTransfer.files);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                  imageError
                    ? "border-red-300 bg-red-50/50"
                    : "border-slate-300 bg-slate-50/50 hover:border-brand hover:bg-brand-light/30"
                }`}
              >
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-brand-dark">
                  Kéo thả hoặc bấm để tải ảnh banner lên
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Hỗ trợ định dạng PNG, JPG, JPEG, WEBP
                </p>
                {imageError ? (
                  <p className="mt-2 text-xs font-semibold text-red-500">
                    Vui lòng chọn hình ảnh cho banner!
                  </p>
                ) : null}
              </div>
            )}
          </div>

          {/* Trạng thái Kích hoạt */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={initialData ? initialData.isActive : true}
              className="h-4.5 w-4.5 rounded-md border-slate-300 text-brand focus:ring-brand"
            />
            <label
              htmlFor="isActive"
              className="cursor-pointer select-none text-sm font-medium text-brand-dark"
            >
              Hiển thị banner ngay trên trang chủ
            </label>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="mt-6 flex shrink-0 justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="banner-form"
            disabled={loading}
            className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:bg-brand-dark active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : isEditing ? "Lưu Cập Nhật" : "Tạo Banner"}
          </button>
        </div>
      </div>
    </div>
  );
}
