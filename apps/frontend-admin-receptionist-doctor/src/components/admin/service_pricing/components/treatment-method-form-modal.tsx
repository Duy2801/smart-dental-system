"use client";

import { useId, useRef, useState } from "react";
import { CurrencyCircleDollar, Info, Stethoscope } from "@phosphor-icons/react";
import {
  AdminButton,
  AdminFormSection,
  AdminImagePicker,
  AdminInput,
  AdminModal,
  AdminSelect,
  AdminTextarea,
  collapseSpaces,
  focusFirstError,
  hasErrors,
  validateNumber,
  validateSlug,
  validateText,
  type FieldErrors,
} from "@/src/components/admin/common";
import type { DentalService, TreatmentMethod, TreatmentMethodFormItem } from "../types";

type MethodField = "name" | "slug" | "description" | "basePrice" | "durationMinutes";

export const MAX_SERVICE_PRICE = 1_000_000_000;

function validateMethodForm(form: TreatmentMethodFormItem): FieldErrors<MethodField> {
  return {
    name: validateText(form.name, { label: "Tên phương pháp", required: true, min: 2, max: 150 }),
    slug: validateSlug(form.slug ?? ""),
    description: validateText(form.description ?? "", { label: "Mô tả", max: 2000 }),
    basePrice: validateNumber(form.basePrice, { label: "Giá cơ bản", min: 0, max: MAX_SERVICE_PRICE, unit: "đ" }),
    durationMinutes: validateNumber(form.durationMinutes, { label: "Thời lượng", min: 5, max: 600, unit: "phút" }),
  };
}

type TreatmentMethodFormModalProps = {
  service: DentalService;
  method?: TreatmentMethod;
  onClose: () => void;
  onSubmit: (data: TreatmentMethodFormItem) => void;
  submitting: boolean;
};

export function TreatmentMethodFormModal({
  service,
  method,
  onClose,
  onSubmit,
  submitting,
}: TreatmentMethodFormModalProps) {
  const isEditing = Boolean(method);
  const formId = useId();

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

  const [errors, setErrors] = useState<FieldErrors<MethodField>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const setField = <Key extends keyof TreatmentMethodFormItem>(
    key: Key,
    value: TreatmentMethodFormItem[Key]
  ) => {
    setErrors((current) => (key in current ? { ...current, [key]: undefined } : current));
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <AdminModal
      title={isEditing ? `Sửa phương pháp: ${method?.name}` : "Thêm phương pháp điều trị mới"}
      description={`Thuộc nhóm dịch vụ "${service.name}" (${service.category})`}
      icon={<Stethoscope size={20} weight="duotone" />}
      size="md"
      variant="drawer"
      onClose={onClose}
      footer={
        <>
          <AdminButton type="submit" form={formId} loading={submitting}>
            {submitting ? "Đang lưu..." : "Lưu phương pháp"}
          </AdminButton>
          <AdminButton variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </AdminButton>
        </>
      }
    >
      <form
        id={formId}
        ref={formRef}
        noValidate
        className="mt-4 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const nextErrors = validateMethodForm(form);
          setErrors(nextErrors);
          if (hasErrors(nextErrors)) {
            focusFirstError(formRef.current);
            return;
          }
          onSubmit({
            ...form,
            name: collapseSpaces(form.name),
            slug: (form.slug ?? "").trim(),
            description: (form.description ?? "").trim(),
          });
        }}
      >
        <AdminFormSection title="Thông tin phương pháp" icon={<Info size={15} weight="bold" />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminInput
              label="Tên phương pháp điều trị"
              required
              maxLength={150}
              value={form.name}
              error={errors.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="VD: Cấy ghép Implant Straumann Thụy Sĩ"
            />
            <AdminInput
              label="Slug (tùy chọn)"
              maxLength={150}
              error={errors.slug}
              value={form.slug}
              onChange={(e) => setField("slug", e.target.value)}
              placeholder="implant-straumann"
            />
          </div>

          <AdminImagePicker
            label="Ảnh đại diện phương pháp"
            value={form.imageUrl}
            onChange={(val) => setField("imageUrl", val)}
          />

          <AdminTextarea
            label="Mô tả riêng của phương pháp"
            rows={3}
            maxLength={2000}
            error={errors.description}
            value={form.description}
            onChange={(val) => setField("description", val)}
            placeholder="Mô tả ngắn gọn về đặc điểm, chất liệu, ưu điểm của phương pháp điều trị này."
          />
        </AdminFormSection>

        <AdminFormSection title="Giá & trạng thái" icon={<CurrencyCircleDollar size={15} weight="bold" />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <AdminInput
              label="Giá cơ bản (VND)"
              type="number"
              required
              min={0}
              max={MAX_SERVICE_PRICE}
              inputMode="numeric"
              value={form.basePrice}
              error={errors.basePrice}
              onChange={(e) => setField("basePrice", Number(e.target.value))}
              className="font-mono"
              hint={`≈ ${Number(form.basePrice || 0).toLocaleString("vi-VN")}đ`}
            />
            <AdminInput
              label="Thời lượng (phút)"
              type="number"
              required
              min={5}
              max={600}
              inputMode="numeric"
              error={errors.durationMinutes}
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
        </AdminFormSection>
      </form>
    </AdminModal>
  );
}
