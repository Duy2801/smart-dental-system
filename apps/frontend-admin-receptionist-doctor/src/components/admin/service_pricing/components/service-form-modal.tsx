import { useEffect, useState } from "react";
import {
  AdminButton,
  AdminInput,
  AdminModal,
  AdminSelect,
} from "@/src/components/admin/common";
import type { ServiceFormState } from "../types";

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
}: ServiceFormModalProps) {
  const [form, setForm] = useState<ServiceFormState>(initialValue);

  useEffect(() => {
    setForm(initialValue);
  }, [initialValue]);

  const setField = <Key extends keyof ServiceFormState>(
    key: Key,
    value: ServiceFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateMedia = <Key extends keyof MediaItem>(
    index: number,
    key: Key,
    value: MediaItem[Key],
  ) => {
    setForm((current) => ({
      ...current,
      media: current.media.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateStep = <Key extends keyof StepItem>(
    index: number,
    key: Key,
    value: StepItem[Key],
  ) => {
    setForm((current) => ({
      ...current,
      procedureSteps: current.procedureSteps.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateFaq = <Key extends keyof FaqItem>(
    index: number,
    key: Key,
    value: FaqItem[Key],
  ) => {
    setForm((current) => ({
      ...current,
      faqs: current.faqs.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  };

  const updateHighlight = <Key extends keyof HighlightItem>(
    index: number,
    key: Key,
    value: HighlightItem[Key],
  ) => {
    setForm((current) => ({
      ...current,
      highlights: current.highlights.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
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
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) =>
        itemIndex === index ? value : item,
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
    >,
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
    index: number,
  ) => {
    setField(
      key,
      form[key].filter((_, itemIndex) => itemIndex !== index),
    );
  };

  return (
    <AdminModal
      title={title}
      description="Quản lý thông tin, giá, hình ảnh, quy trình và câu hỏi thường gặp của dịch vụ."
      onClose={onClose}
    >
      <form
        className="mt-6 flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <Section title="Thông tin chính">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminInput
              label="Danh mục"
              required
              value={form.category}
              onChange={(event) => setField("category", event.target.value)}
              placeholder="VD: Tổng quát, Thẩm mỹ..."
            />
            <AdminInput
              label="Tên dịch vụ"
              required
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="VD: Tẩy trắng răng"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminInput
              label="Slug"
              value={form.slug}
              onChange={(event) => setField("slug", event.target.value)}
              placeholder="tay-trang-rang"
            />
            <ImagePicker
              label="Ảnh đại diện"
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

        <TextareaField
          label="Tóm tắt chuyên sâu trên trang chi tiết"
          rows={4}
          value={form.detailSummary}
          onChange={(value) => setField("detailSummary", value)}
          placeholder="Đoạn giải thích nổi bật ở đầu trang chi tiết dịch vụ."
        />
      </Section>

      <Section title="Nội dung trang chi tiết">
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
                      (_, itemIndex) => itemIndex !== index,
                    ),
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ContentListSection
            title="Phù hợp với ai?"
            addLabel="Thêm đối tượng"
            items={form.suitableFor}
            onAdd={() => addTextListItem("suitableFor")}
            onChange={(index, value) =>
              updateTextList("suitableFor", index, value)
            }
            onRemove={(index) => removeTextListItem("suitableFor", index)}
          />
          <ContentListSection
            title="Bao gồm trong buổi hẹn"
            addLabel="Thêm quyền lợi"
            items={form.includedItems}
            onAdd={() => addTextListItem("includedItems")}
            onChange={(index, value) =>
              updateTextList("includedItems", index, value)
            }
            onRemove={(index) => removeTextListItem("includedItems", index)}
          />
          <ContentListSection
            title="Chuẩn bị trước buổi hẹn"
            addLabel="Thêm lưu ý chuẩn bị"
            items={form.preparationNotes}
            onAdd={() => addTextListItem("preparationNotes")}
            onChange={(index, value) =>
              updateTextList("preparationNotes", index, value)
            }
            onRemove={(index) =>
              removeTextListItem("preparationNotes", index)
            }
          />
          <ContentListSection
            title="Chăm sóc sau điều trị"
            addLabel="Thêm hướng dẫn"
            items={form.aftercareNotes}
            onAdd={() => addTextListItem("aftercareNotes")}
            onChange={(index, value) =>
              updateTextList("aftercareNotes", index, value)
            }
            onRemove={(index) => removeTextListItem("aftercareNotes", index)}
          />
        </div>

        <ContentListSection
          title="Lưu ý quan trọng"
          addLabel="Thêm lưu ý"
          items={form.importantNotes}
          onAdd={() => addTextListItem("importantNotes")}
          onChange={(index, value) =>
            updateTextList("importantNotes", index, value)
          }
          onRemove={(index) => removeTextListItem("importantNotes", index)}
        />
      </Section>

      <Section title="Giá và sắp xếp">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <AdminInput
              label="Thời lượng"
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
              label="Giá cơ bản"
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
              label="Thứ tự"
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

        <Section title="Hình ảnh">
          <div className="space-y-3">
            {form.media.map((media, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-white p-3 lg:grid-cols-[1.2fr_1fr_150px_80px_auto]"
              >
                <ImagePicker
                  label="Chọn ảnh"
                  value={media.url}
                  onChange={(value) => updateMedia(index, "url", value)}
                />
                <AdminInput
                  label="Mô tả ảnh"
                  value={media.alt}
                  onChange={(event) =>
                    updateMedia(index, "alt", event.target.value)
                  }
                />
                <AdminSelect
                  label="Loại"
                  value={media.type}
                  onChange={(event) =>
                    updateMedia(index, "type", event.target.value)
                  }
                >
                  {mediaTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </AdminSelect>
                <AdminInput
                  label="Thứ tự"
                  type="number"
                  min={0}
                  value={media.sortOrder}
                  onChange={(event) =>
                    updateMedia(index, "sortOrder", Number(event.target.value))
                  }
                />
                <AdminButton
                  variant="danger"
                  className="self-end"
                  onClick={() =>
                    setField(
                      "media",
                      form.media.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  Xóa
                </AdminButton>
              </div>
            ))}
          </div>
          <AdminButton variant="secondary" onClick={addMedia}>
            Thêm ảnh
          </AdminButton>
        </Section>

        <Section title="Quy trình thực hiện">
          <div className="space-y-3">
            {form.procedureSteps.map((step, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-white p-3 lg:grid-cols-[90px_1fr_120px_auto]"
              >
                <AdminInput
                  label="Bước"
                  type="number"
                  min={1}
                  value={step.stepOrder}
                  onChange={(event) =>
                    updateStep(index, "stepOrder", Number(event.target.value))
                  }
                />
                <div className="space-y-3">
                  <AdminInput
                    label="Tiêu đề"
                    value={step.title}
                    onChange={(event) =>
                      updateStep(index, "title", event.target.value)
                    }
                  />
                  <TextareaField
                    label="Mô tả"
                    rows={2}
                    value={step.description}
                    onChange={(value) =>
                      updateStep(index, "description", value)
                    }
                  />
                </div>
                <AdminInput
                  label="Phút"
                  type="number"
                  min={1}
                  value={step.durationMinutes}
                  onChange={(event) =>
                    updateStep(
                      index,
                      "durationMinutes",
                      event.target.value ? Number(event.target.value) : "",
                    )
                  }
                />
                <AdminButton
                  variant="danger"
                  className="self-end"
                  onClick={() =>
                    setField(
                      "procedureSteps",
                      form.procedureSteps.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    )
                  }
                >
                  Xóa
                </AdminButton>
              </div>
            ))}
          </div>
          <AdminButton variant="secondary" onClick={addStep}>
            Thêm bước
          </AdminButton>
        </Section>

        <Section title="Câu hỏi thường gặp">
          <div className="space-y-3">
            {form.faqs.map((faq, index) => (
              <div
                key={index}
                className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-white p-3 lg:grid-cols-[1fr_1fr_90px_auto]"
              >
                <AdminInput
                  label="Câu hỏi"
                  value={faq.question}
                  onChange={(event) =>
                    updateFaq(index, "question", event.target.value)
                  }
                />
                <TextareaField
                  label="Trả lời"
                  rows={2}
                  value={faq.answer}
                  onChange={(value) => updateFaq(index, "answer", value)}
                />
                <AdminInput
                  label="Thứ tự"
                  type="number"
                  min={0}
                  value={faq.sortOrder}
                  onChange={(event) =>
                    updateFaq(index, "sortOrder", Number(event.target.value))
                  }
                />
                <AdminButton
                  variant="danger"
                  className="self-end"
                  onClick={() =>
                    setField(
                      "faqs",
                      form.faqs.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                >
                  Xóa
                </AdminButton>
              </div>
            ))}
          </div>
          <AdminButton variant="secondary" onClick={addFaq}>
            Thêm FAQ
          </AdminButton>
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
