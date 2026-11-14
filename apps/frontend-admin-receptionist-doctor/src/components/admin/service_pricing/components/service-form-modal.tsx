"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Info,
  Plus,
  Sparkle,
  Trash,
  Tooth,
} from "@phosphor-icons/react";
import {
  AdminAiAssistBar,
  AdminButton,
  AdminFormSection,
  AdminIconButton,
  AdminImagePicker as ImagePicker,
  AdminInput,
  AdminModal,
  AdminTextarea as TextareaField,
  collapseSpaces,
  focusFirstError,
  hasErrors,
  useAdminAiAssist,
  validateText,
  type FieldErrors,
} from "@/src/components/admin/common";
import { getServices } from "../service-pricing-api";
import type { ServiceFormState } from "../types";

function validateServiceForm(form: ServiceFormState): FieldErrors {
  const errors: FieldErrors = {
    category: validateText(form.category, { label: "Danh mục", required: true, min: 2, max: 100 }),
    name: validateText(form.name, { label: "Tên dịch vụ", required: true, min: 2, max: 150 }),
    shortDescription: validateText(form.shortDescription, { label: "Mô tả ngắn", max: 255 }),
    description: validateText(form.description, { label: "Mô tả chi tiết", max: 5000 }),
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

/** "Trồng răng Implant" -> "trong-rang-implant" (dùng cho đường dẫn trang dịch vụ) */
function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

function normalizeServiceForm(form: ServiceFormState): ServiceFormState {
  return {
    ...form,
    category: collapseSpaces(form.category),
    name: collapseSpaces(form.name),
    // Slug không còn nhập tay: giữ slug cũ khi sửa, tạo mới từ tên khi chưa có
    slug: form.slug.trim() || toSlug(form.name),
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
};

type StepItem = ServiceFormState["procedureSteps"][number];
type MediaItem = ServiceFormState["media"][number];
type FaqItem = ServiceFormState["faqs"][number];
type HighlightItem = ServiceFormState["highlights"][number];

const mediaTypes = ["BANNER", "PROCESS", "BEFORE_AFTER", "GALLERY"];

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

/** So khớp danh mục không phân biệt hoa thường và khoảng trắng thừa */
const categoryKey = (value: string) => collapseSpaces(value).normalize("NFC").toLocaleLowerCase("vi");

function findExistingCategory(categories: string[], value: string) {
  const key = categoryKey(value);
  return key ? categories.find((category) => categoryKey(category) === key) : undefined;
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
}: ServiceFormModalProps) {
  const formId = useId();
  const [form, setForm] = useState<ServiceFormState>(initialValue);
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setForm(initialValue);
    setErrors({});
  }, [initialValue]);

  const { data: allServices = [] } = useQuery({
    queryKey: ["admin", "services", "all"],
    queryFn: () => getServices({}),
  });
  const categories = useMemo(
    () =>
      Array.from(
        new Set(allServices.map((service) => collapseSpaces(service.category ?? "")).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, "vi")),
    [allServices],
  );
  // Danh mục nhập trùng với danh mục đã có (khác hoa thường / khoảng trắng hoặc trùng hẳn).
  // Không báo khi giữ nguyên danh mục cũ lúc sửa dịch vụ.
  const existingCategory =
    categoryKey(form.category) !== categoryKey(initialValue.category)
      ? findExistingCategory(categories, form.category)
      : undefined;

  const ai = useAdminAiAssist({
    capture: () => ({
      shortDescription: form.shortDescription,
      description: form.description,
      pricingNote: form.pricingNote,
      highlights: form.highlights,
    }),
    restore: (snapshot) => setForm((current) => ({ ...current, ...snapshot })),
  });
  const aiNameReady = collapseSpaces(form.name).length >= 2;

  const handleAiGenerate = () =>
    ai.generate(
      { kind: "service", name: collapseSpaces(form.name), category: collapseSpaces(form.category) || undefined },
      (suggestion) => {
        setErrors({});
        setForm((current) => ({
          ...current,
          shortDescription: suggestion.shortDescription || current.shortDescription,
          description: suggestion.description || current.description,
          pricingNote: suggestion.pricingNote || current.pricingNote,
          highlights: suggestion.highlights.length ? suggestion.highlights : current.highlights,
        }));
      },
    );

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
          // Gộp vào đúng cách viết của danh mục đã có để không sinh danh mục trùng
          const matchedCategory = findExistingCategory(categories, form.category);
          onSubmit(
            normalizeServiceForm(matchedCategory ? { ...form, category: matchedCategory } : form),
          );
        }}
      >
        <Section title="Thông tin dịch vụ (nhóm chính)" icon={<Info size={15} weight="bold" />}>
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <AdminInput
              label="Danh mục"
              required
              maxLength={100}
              error={errors.category}
              value={form.category}
              onChange={(event) => setField("category", event.target.value)}
              placeholder="VD: Implant, Phục hình, Thẩm mỹ..."
              hint={
                existingCategory ? (
                  <span className="font-semibold text-amber-600">
                    Danh mục &quot;{existingCategory}&quot; đã tồn tại — dịch vụ sẽ được xếp chung vào danh mục này.
                  </span>
                ) : undefined
              }
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

          <ImagePicker
            label="Ảnh đại diện dịch vụ"
            hint={null}
            value={form.icon}
            onChange={(value) => setField("icon", value)}
          />

          <AdminAiAssistBar
            description="Tự soạn mô tả ngắn, mô tả chi tiết, ghi chú giá và điểm nổi bật."
            disabled={!aiNameReady}
            disabledHint="Nhập tên dịch vụ để AI soạn nội dung."
            loading={ai.loading}
            hasResult={ai.hasResult}
            canUndo={ai.canUndo}
            error={ai.error}
            onGenerate={() => void handleAiGenerate()}
            onUndo={ai.undo}
          />

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
                className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-slate-200 bg-white p-3.5"
              >
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
                <div className="self-start pt-7">
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
