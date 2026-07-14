import { useState } from "react";
import {
  AdminButton,
  AdminInput,
  AdminModal,
} from "@/src/components/admin/common";
import type { ServiceFormState } from "../types";

type ServiceFormModalProps = {
  initialValue: ServiceFormState;
  onClose: () => void;
  onSubmit: (form: ServiceFormState) => void;
  submitting: boolean;
  title: string;
};

export function ServiceFormModal({
  initialValue,
  onClose,
  onSubmit,
  submitting,
  title,
}: ServiceFormModalProps) {
  const [form, setForm] = useState<ServiceFormState>(initialValue);

  const setField = <Key extends keyof ServiceFormState>(
    key: Key,
    value: ServiceFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <AdminModal
      title={title}
      description="Thêm thông tin dịch vụ và bảng giá vào hệ thống phòng khám."
      onClose={onClose}
    >
      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(form);
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminInput
            label="Danh mục"
            required
            value={form.category}
            onChange={(event) => setField("category", event.target.value)}
            placeholder="VD: Nhổ răng, Thẩm mỹ..."
          />
          <AdminInput
            label="Tên dịch vụ"
            required
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
            placeholder="Nhổ răng khôn..."
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-brand-dark">
            Mô tả chi tiết
          </label>
          <textarea
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            rows={2}
            placeholder="Ghi chú thêm về quy trình hoặc thông tin dịch vụ..."
            className="resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminInput
            label="Thời lượng (phút)"
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
            label="Giá cơ bản (VND)"
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
        </div>

        <label className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm font-semibold text-brand-dark">
          Đang cung cấp
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setField("isActive", event.target.checked)}
            className="h-5 w-5 accent-brand"
          />
        </label>

        <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
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
