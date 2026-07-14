import type { FormEvent } from "react";
import { useState } from "react";
import { cn } from "@/src/lib/utils/cn";
import type { CreatePromotionPayload } from "../promotion-api";
import type { DiscountType } from "../types";

type AddPromoModalProps = {
  onAdd: (promotion: CreatePromotionPayload) => void;
  onClose: () => void;
};

export function AddPromoModal({ onAdd, onClose }: AddPromoModalProps) {
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENTAGE");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onAdd({
      code: String(formData.get("code")).toUpperCase(),
      name: String(formData.get("name")),
      description: String(formData.get("description")),
      discount_type: discountType,
      discount_value: Number(formData.get("discount_value")),
      max_uses: Number(formData.get("max_uses")),
      start_date: String(formData.get("start_date")),
      end_date: String(formData.get("end_date")),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-brand-dark">
          Tao ma Voucher moi
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Thiet lap chuong trinh khuyen mai cho khach hang.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              className="uppercase font-mono"
              label="Ma Code"
              name="code"
              placeholder="VD: SUMMER24"
              required
            />
            <InputField
              label="Gioi han luot dung"
              name="max_uses"
              type="number"
              min="1"
              placeholder="100"
              required
            />
          </div>

          <InputField
            label="Ten chuong trinh"
            name="name"
            placeholder="Giam gia chao he..."
            required
          />
          <InputField
            label="Mo ta ngan"
            name="description"
            placeholder="Ap dung cho dich vu Nieng rang..."
          />

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-brand-dark">
                Loai giam gia
              </label>
              <select
                value={discountType}
                onChange={(event) =>
                  setDiscountType(event.target.value as DiscountType)
                }
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              >
                <option value="PERCENTAGE">Phan tram (%)</option>
                <option value="FIXED_AMOUNT">Tien mat (VND)</option>
              </select>
            </div>
            <InputField
              className={discountType === "FIXED_AMOUNT" ? "text-right" : ""}
              label={
                discountType === "PERCENTAGE"
                  ? "Muc giam (%)"
                  : "Muc giam (VND)"
              }
              name="discount_value"
              type="number"
              min="1"
              max={discountType === "PERCENTAGE" ? 100 : undefined}
              placeholder={discountType === "PERCENTAGE" ? "20" : "500000"}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField label="Tu ngay" name="start_date" type="date" required />
            <InputField label="Den ngay" name="end_date" type="date" required />
          </div>

          <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]"
            >
              Huy
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
            >
              Tao ma
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({
  className,
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-brand-dark">{label}</label>
      <input
        className={cn(
          "rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand",
          className,
        )}
        {...props}
      />
    </div>
  );
}
