import { useEffect, useState } from "react";
import {
  AdminButton,
  AdminInput,
  AdminModal,
  AdminSelect,
} from "@/src/components/admin/common";
import { formatVND } from "../service-pricing-utils";
import type { ServiceFormState, TreatmentMethod } from "../types";

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

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-slate-50/60 p-4">
      <h4 className="text-sm font-bold text-brand-dark">{title}</h4>
      {children}
    </section>
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
        <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
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
          Chọn tệp
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
      <h5 className="text-sm font-semibold text-brand-dark">{title}</h5>
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <AdminInput
            label={`Dòng ${index + 1}`}
            value={item}
            onChange={(event) => onChange(index, event.target.value)}
          />
          <AdminButton
            variant="danger"
            className="self-end"
            onClick={() => onRemove(index)}
          >
            Xóa
          </AdminButton>
        </div>
      ))}
      <AdminButton variant="secondary" onClick={onAdd}>
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
  const [form, setForm] = useState<ServiceFormState>(initialValue);

  useEffect(() => {
    setForm(initialValue);
  }, [initialValue]);

  const setField = <Key extends keyof ServiceFormState>(
    key: Key,
    value: ServiceFormState[Key]
  ) => {
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
      onClose={onClose}
    >
      <form
        className="mt-4 flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <Section title="Thông tin dịch vụ (Nhóm chính)">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminInput
              label="Danh mục"
              required
              value={form.category}
              onChange={(event) => setField("category", event.target.value)}
              placeholder="VD: Implant, Phục hình, Thẩm mỹ..."
            />
            <AdminInput
              label="Tên dịch vụ"
              required
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="VD: Trồng răng Implant"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminInput
              label="Slug"
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
            value={form.shortDescription}
            onChange={(value) => setField("shortDescription", value)}
            placeholder="Một câu ngắn để hiển thị ở card dịch vụ."
          />

          <TextareaField
            label="Mô tả chi tiết"
            value={form.description}
            onChange={(value) => setField("description", value)}
            placeholder="Thông tin chuyên môn, lợi ích và lưu ý của dịch vụ."
          />
        </Section>

        {/* Section: Treatment Methods Overview */}
        <Section title="Các phương pháp điều trị đi kèm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <span className="text-xs font-medium text-muted-foreground">
              Số lượng: <strong>{form.treatmentMethods.length} phương pháp</strong>. Nhấp vào phương pháp để chỉnh sửa giá & thông tin chi tiết riêng.
            </span>

            {onCreateTreatmentMethod && (
              <AdminButton
                type="button"
                variant="secondary"
                onClick={onCreateTreatmentMethod}
              >
                + Thêm phương pháp mới
              </AdminButton>
            )}
          </div>

          {form.treatmentMethods.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-2">
              Chưa có phương pháp điều trị nào. Hãy bấm "Thêm phương pháp mới".
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {form.treatmentMethods.map((method, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white p-3 shadow-2xs transition-all hover:border-brand/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 text-sm truncate">
                        {method.name || `Phương pháp #${index + 1}`}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-xs font-bold text-brand-dark">
                      {formatVND(method.basePrice)} • {method.durationMinutes} phút
                    </div>
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
                      className="shrink-0 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                    >
                      Sửa
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Giá mặc định & Sắp xếp">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <AdminInput
              label="Thời lượng mặc định (Phút)"
              type="number"
              required
              min={1}
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
              step={50000}
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
              value={form.displayOrder}
              onChange={(event) =>
                setField("displayOrder", Number(event.target.value))
              }
              className="font-mono"
            />
          </div>
        </Section>

        <Section title="Nội dung chi tiết & Điểm nổi bật">
          <TextareaField
            label="Ghi chú giá"
            rows={2}
            value={form.pricingNote}
            onChange={(value) => setField("pricingNote", value)}
            placeholder="VD: Giá hiển thị là mức khởi điểm, chi phí cuối cùng xác nhận sau thăm khám."
          />

          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-brand-dark">
              Điểm nổi bật
            </h5>
            {form.highlights.map((highlight, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-white p-3 lg:grid-cols-[160px_1fr_auto]"
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
                      {icon}
                    </option>
                  ))}
                </AdminSelect>
                <div className="space-y-3">
                  <AdminInput
                    label="Tiêu đề"
                    value={highlight.title}
                    onChange={(event) =>
                      updateHighlight(index, "title", event.target.value)
                    }
                  />
                  <TextareaField
                    label="Mô tả"
                    rows={2}
                    value={highlight.description}
                    onChange={(value) =>
                      updateHighlight(index, "description", value)
                    }
                  />
                </div>
                <AdminButton
                  variant="danger"
                  className="self-end"
                  onClick={() =>
                    setField(
                      "highlights",
                      form.highlights.filter(
                        (_, itemIndex) => itemIndex !== index
                      )
                    )
                  }
                >
                  Xóa
                </AdminButton>
              </div>
            ))}
            <AdminButton variant="secondary" onClick={addHighlight}>
              Thêm điểm nổi bật
            </AdminButton>
          </div>
        </Section>

        <div className="mt-2 flex justify-end gap-3 border-t border-border bg-white pt-4">
          <AdminButton
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </AdminButton>
          <AdminButton type="submit" disabled={submitting}>
            {submitting ? "Đang lưu..." : "Lưu dịch vụ"}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  );
}
