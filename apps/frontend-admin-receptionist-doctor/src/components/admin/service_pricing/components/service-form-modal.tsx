"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  CurrencyCircleDollar,
  Info,
  ListChecks,
  PencilSimple,
  Plus,
  Sparkle,
  Trash,
  Tooth,
} from "@phosphor-icons/react";
import {
  AdminButton,
  AdminFormSection,
  AdminIconButton,
  AdminImagePicker as ImagePicker,
  AdminInput,
  AdminModal,
  AdminSelect,
  AdminTextarea as TextareaField,
  collapseSpaces,
  focusFirstError,
  hasErrors,
  validateNumber,
  validateSlug,
  validateText,
  type FieldErrors,
} from "@/src/components/admin/common";
import { formatVND } from "../service-pricing-utils";
import type { ServiceFormState, TreatmentMethod } from "../types";
import { MAX_SERVICE_PRICE } from "./treatment-method-form-modal";

function validateServiceForm(form: ServiceFormState): FieldErrors {
  const errors: FieldErrors = {
    category: validateText(form.category, { label: "Danh mục", required: true, min: 2, max: 100 }),
    name: validateText(form.name, { label: "Tên dịch vụ", required: true, min: 2, max: 150 }),
    slug: validateSlug(form.slug),
    shortDescription: validateText(form.shortDescription, { label: "Mô tả ngắn", max: 255 }),
    description: validateText(form.description, { label: "Mô tả chi tiết", max: 5000 }),
    durationMinutes: validateNumber(form.durationMinutes, { label: "Thời lượng", min: 5, max: 600, unit: "phút" }),
    basePrice: validateNumber(form.basePrice, { label: "Giá khởi điểm", min: 0, max: MAX_SERVICE_PRICE, unit: "đ" }),
    displayOrder: validateNumber(form.displayOrder, { label: "Thứ tự hiển thị", min: 0, max: 9999, required: false }),
    pricingNote: validateText(form.pricingNote, { label: "Ghi chú giá", max: 500 }),
  };
  form.highlights.forEach((item, index) => {
    errors[`highlight-${index}-title`] = validateText(item.title, {
      label: "Tiêu đề điểm nổi bật",
      required: true,
      max: 100,
    });
    errors[`highlight-${index}-description`] = validateText(item.description, {
      label: "Mô tả điểm nổi bật",
      max: 300,
    });
  });
  return errors;
}

function normalizeServiceForm(form: ServiceFormState): ServiceFormState {
  return {
    ...form,
    category: collapseSpaces(form.category),
    name: collapseSpaces(form.name),
    slug: form.slug.trim(),
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    pricingNote: form.pricingNote.trim(),
    highlights: form.highlights.map((item) => ({
      ...item,
      title: collapseSpaces(item.title),
      description: item.description.trim(),
    })),
  };
}

type ServiceFormModalProps = {
  initialValue: ServiceFormState;
  onClose: () => void;
  onSubmit: (form: ServiceFormState) => void;
  submitting: boolean;
  title: string;
  onEditTreatmentMethod?: (method: TreatmentMethod, index: number) => void;
  onCreateTreatmentMethod?: () => void;
};

type StepItem = ServiceFormState["procedureSteps"][number];
type MediaItem = ServiceFormState["media"][number];
type FaqItem = ServiceFormState["faqs"][number];
type HighlightItem = ServiceFormState["highlights"][number];

const mediaTypes = ["BANNER", "PROCESS", "BEFORE_AFTER", "GALLERY"];
const highlightIcons = ["shield", "sparkles", "checkup", "clock"];
const highlightIconLabels: Record<string, string> = {
  shield: "Khiên bảo vệ",
  sparkles: "Lấp lánh",
  checkup: "Thăm khám",
  clock: "Đồng hồ",
};

function Section({
  children,
  title,
  icon,
}: {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <AdminFormSection title={title} icon={icon}>
      {children}
    </AdminFormSection>
  );
}

function ContentListSection({
  addLabel,
  items,
  onAdd,
  onChange,
  onRemove,
  title,
}: {
  addLabel: string;
  items: string[];
  onAdd: () => void;
  onChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
  title: string;
}) {
  return (
    <div className="space-y-3">
      <h5 className="text-[13px] font-semibold text-slate-700">{title}</h5>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <AdminInput
            label={`Dòng ${index + 1}`}
            value={item}
            onChange={(event) => onChange(index, event.target.value)}
          />
          <div className="self-end pb-1.5">
            <AdminIconButton label="Xóa dòng" tone="red" onClick={() => onRemove(index)}>
              <Trash size={16} />
            </AdminIconButton>
          </div>
        </div>
      ))}
      <AdminButton variant="secondary" size="sm" onClick={onAdd}>
        <Plus size={14} weight="bold" />
        {addLabel}
      </AdminButton>
    </div>
  );
}

export function ServiceFormModal({
  initialValue,
  onClose,
  onSubmit,
  submitting,
  title,
  onEditTreatmentMethod,
  onCreateTreatmentMethod,
}: ServiceFormModalProps) {
  const formId = useId();
  const [form, setForm] = useState<ServiceFormState>(initialValue);
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setForm(initialValue);
    setErrors({});
  }, [initialValue]);

  const clearError = (key: string) =>
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));

  const setField = <Key extends keyof ServiceFormState>(
    key: Key,
    value: ServiceFormState[Key]
  ) => {
    clearError(key);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateMedia = <Key extends keyof MediaItem>(
    index: number,
    key: Key,
    value: MediaItem[Key]
  ) => {
    setForm((current) => ({
      ...current,
      media: current.media.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const updateStep = <Key extends keyof StepItem>(
    index: number,
    key: Key,
    value: StepItem[Key]
  ) => {
    setForm((current) => ({
      ...current,
      procedureSteps: current.procedureSteps.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const updateFaq = <Key extends keyof FaqItem>(
    index: number,
    key: Key,
    value: FaqItem[Key]
  ) => {
    setForm((current) => ({
      ...current,
      faqs: current.faqs.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const updateHighlight = <Key extends keyof HighlightItem>(
    index: number,
    key: Key,
    value: HighlightItem[Key]
  ) => {
    clearError(`highlight-${index}-${key}`);
    setForm((current) => ({
      ...current,
      highlights: current.highlights.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const updateTextList = (
    key: Extract<
      keyof ServiceFormState,
      | "suitableFor"
      | "includedItems"
      | "preparationNotes"
      | "aftercareNotes"
      | "importantNotes"
    >,
    index: number,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) =>
        itemIndex === index ? value : item
      ),
    }));
  };

  const addMedia = () => {
    setField("media", [
      ...form.media,
      { url: "", alt: "", type: "BANNER", sortOrder: form.media.length + 1 },
    ]);
  };

  const addStep = () => {
    setField("procedureSteps", [
      ...form.procedureSteps,
      {
        stepOrder: form.procedureSteps.length + 1,
        title: "",
        description: "",
        durationMinutes: "",
      },
    ]);
  };

  const addFaq = () => {
    setField("faqs", [
      ...form.faqs,
      { question: "", answer: "", sortOrder: form.faqs.length + 1 },
    ]);
  };

  const addHighlight = () => {
    setField("highlights", [
      ...form.highlights,
      { title: "", description: "", icon: "shield" },
    ]);
  };

  const addTextListItem = (
    key: Extract<
      keyof ServiceFormState,
      | "suitableFor"
      | "includedItems"
      | "preparationNotes"
      | "aftercareNotes"
      | "importantNotes"
    >
  ) => {
    setField(key, [...form[key], ""]);
  };

  const removeTextListItem = (
    key: Extract<
      keyof ServiceFormState,
      | "suitableFor"
      | "includedItems"
      | "preparationNotes"
      | "aftercareNotes"
      | "importantNotes"
    >,
    index: number
  ) => {
    setField(
      key,
      form[key].filter((_, itemIndex) => itemIndex !== index)
    );
  };

  return (
    <AdminModal
      title={title}
      description="Quản lý thông tin chung nhóm dịch vụ, hình ảnh, quy trình và FAQ."
      icon={<Tooth size={20} weight="duotone" />}
      size="md"
      variant="drawer"
      onClose={onClose}
      footer={
        <>
          <AdminButton type="submit" form={formId} loading={submitting}>
            {submitting ? "Đang lưu..." : "Lưu dịch vụ"}
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
          const nextErrors = validateServiceForm(form);
          setErrors(nextErrors);
          if (hasErrors(nextErrors)) {
            focusFirstError(formRef.current);
            return;
          }
          onSubmit(normalizeServiceForm(form));
        }}
      >
        <Section title="Thông tin dịch vụ (nhóm chính)" icon={<Info size={15} weight="bold" />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminInput
              label="Danh mục"
              required
              maxLength={100}
              error={errors.category}
              value={form.category}
              onChange={(event) => setField("category", event.target.value)}
              placeholder="VD: Implant, Phục hình, Thẩm mỹ..."
            />
            <AdminInput
              label="Tên dịch vụ"
              required
              maxLength={150}
              error={errors.name}
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="VD: Trồng răng Implant"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminInput
              label="Slug"
              maxLength={150}
              error={errors.slug}
              hint="Không bắt buộc. Chữ thường không dấu, nối bằng dấu gạch ngang."
              value={form.slug}
              onChange={(event) => setField("slug", event.target.value)}
              placeholder="trong-rang-implant"
            />
            <ImagePicker
              label="Ảnh đại diện nhóm dịch vụ"
              value={form.thumbnailUrl}
              onChange={(value) => setField("thumbnailUrl", value)}
            />
          </div>

          <TextareaField
            label="Mô tả ngắn"
            rows={2}
            maxLength={255}
            error={errors.shortDescription}
            value={form.shortDescription}
            onChange={(value) => setField("shortDescription", value)}
            placeholder="Một câu ngắn để hiển thị ở card dịch vụ."
          />

          <TextareaField
            label="Mô tả chi tiết"
            maxLength={5000}
            error={errors.description}
            value={form.description}
            onChange={(value) => setField("description", value)}
            placeholder="Thông tin chuyên môn, lợi ích và lưu ý của dịch vụ."
          />
        </Section>

        {/* Section: Treatment Methods Overview */}
        <Section title="Các phương pháp điều trị đi kèm" icon={<ListChecks size={15} weight="bold" />}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-500">
              <strong className="font-bold text-slate-800">{form.treatmentMethods.length} phương pháp</strong> · bấm Sửa để chỉnh giá & thông tin riêng.
            </span>

            {onCreateTreatmentMethod ? (
              <AdminButton variant="secondary" size="sm" onClick={onCreateTreatmentMethod}>
                <Plus size={14} weight="bold" />
                Thêm phương pháp
              </AdminButton>
            ) : null}
          </div>

          {form.treatmentMethods.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 bg-white py-4 text-center text-xs text-slate-500">
              Chưa có phương pháp điều trị nào. Bấm &quot;Thêm phương pháp&quot; để bổ sung.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {form.treatmentMethods.map((method, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-brand/40 hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {method.name || `Phương pháp #${index + 1}`}
                    </span>
                    <span className="mt-0.5 block text-xs font-bold text-brand-dark">
                      {formatVND(method.basePrice)}
                      <span className="font-medium text-slate-400"> · {method.durationMinutes} phút</span>
                    </span>
                  </div>

                  {onEditTreatmentMethod && (
                    <button
                      type="button"
                      onClick={() =>
                        onEditTreatmentMethod(
                          {
                            id: method.id,
                            name: method.name,
                            slug: method.slug ?? "",
                            description: method.description ?? "",
                            imageUrl: method.imageUrl ?? "",
                            basePrice: method.basePrice,
                            durationMinutes: method.durationMinutes,
                            displayOrder: method.displayOrder,
                            isActive: method.isActive,
                          },
                          index
                        )
                      }
                      className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-brand-light px-2.5 text-xs font-bold text-brand transition-colors hover:bg-brand hover:text-white"
                    >
                      <PencilSimple size={13} weight="bold" />
                      Sửa
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Giá mặc định & sắp xếp" icon={<CurrencyCircleDollar size={15} weight="bold" />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <AdminInput
              label="Thời lượng mặc định (Phút)"
              type="number"
              required
              min={5}
              max={600}
              inputMode="numeric"
              error={errors.durationMinutes}
              value={form.durationMinutes}
              onChange={(event) =>
                setField("durationMinutes", Number(event.target.value))
              }
              className="font-mono"
            />
            <AdminInput
              label="Giá khởi điểm mặc định (VND)"
              type="number"
              required
              min={0}
              max={MAX_SERVICE_PRICE}
              inputMode="numeric"
              error={errors.basePrice}
              hint={`≈ ${Number(form.basePrice || 0).toLocaleString("vi-VN")}đ`}
              value={form.basePrice}
              onChange={(event) =>
                setField("basePrice", Number(event.target.value))
              }
              className="text-right font-mono"
            />
            <AdminInput
              label="Thứ tự hiển thị"
              type="number"
              min={0}
              max={9999}
              inputMode="numeric"
              error={errors.displayOrder}
              value={form.displayOrder}
              onChange={(event) =>
                setField("displayOrder", Number(event.target.value))
              }
              className="font-mono"
            />
          </div>
        </Section>

        <Section title="Nội dung chi tiết & điểm nổi bật" icon={<Sparkle size={15} weight="bold" />}>
          <TextareaField
            label="Ghi chú giá"
            rows={2}
            maxLength={500}
            error={errors.pricingNote}
            value={form.pricingNote}
            onChange={(value) => setField("pricingNote", value)}
            placeholder="VD: Giá hiển thị là mức khởi điểm, chi phí cuối cùng xác nhận sau thăm khám."
          />

          <div className="space-y-3">
            <h5 className="text-[13px] font-semibold text-slate-700">
              Điểm nổi bật
            </h5>
            {form.highlights.map((highlight, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-3.5 lg:grid-cols-[170px_1fr_auto]"
              >
                <AdminSelect
                  label="Icon"
                  value={highlight.icon}
                  onChange={(event) =>
                    updateHighlight(index, "icon", event.target.value)
                  }
                >
                  {highlightIcons.map((icon) => (
                    <option key={icon} value={icon}>
                      {highlightIconLabels[icon] ?? icon}
                    </option>
                  ))}
                </AdminSelect>
                <div className="space-y-3">
                  <AdminInput
                    label="Tiêu đề"
                    required
                    maxLength={100}
                    error={errors[`highlight-${index}-title`]}
                    value={highlight.title}
                    onChange={(event) =>
                      updateHighlight(index, "title", event.target.value)
                    }
                  />
                  <TextareaField
                    label="Mô tả"
                    rows={2}
                    maxLength={300}
                    error={errors[`highlight-${index}-description`]}
                    value={highlight.description}
                    onChange={(value) =>
                      updateHighlight(index, "description", value)
                    }
                  />
                </div>
                <div className="self-start lg:pt-7">
                  <AdminIconButton
                    label="Xóa điểm nổi bật"
                    tone="red"
                    onClick={() =>
                      setField(
                        "highlights",
                        form.highlights.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                  >
                    <Trash size={16} />
                  </AdminIconButton>
                </div>
              </div>
            ))}
            <AdminButton variant="secondary" size="sm" onClick={addHighlight}>
              <Plus size={14} weight="bold" />
              Thêm điểm nổi bật
            </AdminButton>
          </div>
        </Section>

      </form>
    </AdminModal>
  );
}
