import { useEffect, useState } from "react";
import {
  AdminButton,
  AdminInput,
  AdminModal,
  AdminSelect,
} from "@/src/components/admin/common";
import type { DentalService, TreatmentMethod, TreatmentMethodFormItem } from "../types";

type TreatmentMethodFormModalProps = {
  service: DentalService;
  method?: TreatmentMethod;
  onClose: () => void;
  onSubmit: (data: TreatmentMethodFormItem) => void;
  submitting: boolean;
};

function TextareaField({
  label,
  onChange,
  placeholder,
  rows = 3,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-brand-dark">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
      />
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

function ImagePicker({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-brand-dark">{label}</label>
      <div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-white p-3">
        <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100 border border-slate-200">
          {value ? (
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-xs text-muted-foreground">
              Chưa chọn
            </span>
          )}
        </div>
        <label className="inline-flex min-w-24 shrink-0 cursor-pointer items-center justify-center rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark">
          Chọn ảnh
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
      </div>
    </div>
  );
}

export function TreatmentMethodFormModal({
  service,
  method,
  onClose,
  onSubmit,
  submitting,
}: TreatmentMethodFormModalProps) {
  const isEditing = Boolean(method);

  const [form, setForm] = useState<TreatmentMethodFormItem>({
    id: method?.id,
    name: method?.name ?? "",
    slug: method?.slug ?? "",
    description: method?.description ?? "",
    imageUrl: method?.imageUrl ?? "",
    basePrice: Number(method?.basePrice ?? service.basePrice ?? 0),
    durationMinutes: method?.durationMinutes ?? service.durationMinutes ?? 30,
    displayOrder: method?.displayOrder ?? (service.treatmentMethods?.length ?? 0) + 1,
    isActive: method?.isActive ?? true,
    media: (method?.media ?? []).map((m, idx) => ({
      url: m.url,
      alt: m.alt ?? "",
      type: m.type ?? "BANNER",
      sortOrder: m.sortOrder ?? idx + 1,
    })),
    procedureSteps: (method?.procedureSteps ?? []).map((s, idx) => ({
      stepOrder: s.stepOrder ?? idx + 1,
      title: s.title,
      description: s.description,
      durationMinutes: s.durationMinutes ?? "",
    })),
    faqs: (method?.faqs ?? []).map((f, idx) => ({
      question: f.question,
      answer: f.answer,
      sortOrder: f.sortOrder ?? idx + 1,
    })),
  });

  const setField = <Key extends keyof TreatmentMethodFormItem>(
    key: Key,
    value: TreatmentMethodFormItem[Key]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <AdminModal
      title={
        isEditing
          ? `Sửa phương pháp: ${method?.name}`
          : `Thêm phương pháp điều trị mới`
      }
      description={`Thuộc nhóm dịch vụ "${service.name}" (${service.category})`}
      onClose={onClose}
    >
      <form
        className="mt-4 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminInput
            label="Tên phương pháp điều trị"
            required
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="VD: Cấy ghép Implant Straumann Thụy Sĩ"
          />
          <AdminInput
            label="Slug (tùy chọn)"
            value={form.slug}
            onChange={(e) => setField("slug", e.target.value)}
            placeholder="implant-straumann"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <AdminInput
            label="Giá cơ bản (VND)"
            type="number"
            required
            min={0}
            step={50000}
            value={form.basePrice}
            onChange={(e) => setField("basePrice", Number(e.target.value))}
            className="text-right font-mono"
          />
          <AdminInput
            label="Thời lượng (Phút)"
            type="number"
            required
            min={1}
            value={form.durationMinutes}
            onChange={(e) => setField("durationMinutes", Number(e.target.value))}
            className="font-mono"
          />
          <AdminSelect
            label="Trạng thái"
            value={form.isActive ? "active" : "inactive"}
            onChange={(e) => setField("isActive", e.target.value === "active")}
          >
            <option value="active">Đang cung cấp</option>
            <option value="inactive">Ngừng cung cấp</option>
          </AdminSelect>
        </div>

        <ImagePicker
          label="Ảnh đại diện phương pháp"
          value={form.imageUrl}
          onChange={(val) => setField("imageUrl", val)}
        />

        <TextareaField
          label="Mô tả riêng của phương pháp"
          rows={3}
          value={form.description}
          onChange={(val) => setField("description", val)}
          placeholder="Mô tả ngắn gọn về đặc điểm, chất liệu, ưu điểm của phương pháp điều trị này."
        />

        <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
          <AdminButton
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </AdminButton>
          <AdminButton type="submit" disabled={submitting}>
            {submitting ? "Đang lưu..." : "Lưu phương pháp"}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  );
}
