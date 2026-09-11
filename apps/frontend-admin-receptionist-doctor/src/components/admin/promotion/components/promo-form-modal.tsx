import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AdminButton,
  AdminInput,
  AdminModal,
  AdminSelect,
} from "@/src/components/admin/common";
import { getServices } from "@/src/components/admin/service_pricing/service-pricing-api";
import type { DentalService } from "@/src/components/admin/service_pricing/types";
import type { SavePromotionPayload, DiscountType, Promotion } from "../types";

type PromoFormModalProps = {
  initialValue?: Promotion | null;
  onClose: () => void;
  onSubmit: (payload: SavePromotionPayload) => void;
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
      <div className="flex min-w-0 items-center gap-4 rounded-xl border border-border bg-white p-3">
        <div className="flex h-24 w-36 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 border border-slate-200 shadow-xs">
          {value ? (
            <img
              src={value}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="px-2 text-center text-xs font-medium text-muted-foreground">
              Chưa chọn ảnh
            </span>
          )}
        </div>
        <label className="inline-flex min-w-28 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-brand-dark">
          📷 Chọn ảnh Banner
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

export function PromoFormModal({
  initialValue,
  onClose,
  onSubmit,
  submitting,
}: PromoFormModalProps) {
  const isEditing = Boolean(initialValue);

  const { data: services = [] } = useQuery({
    queryKey: ["admin", "services", "all"],
    queryFn: () => getServices({}),
  });

  const [code, setCode] = useState(initialValue?.code ?? "");
  const [name, setName] = useState(initialValue?.name ?? "");
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialValue?.discount_type ?? "PERCENTAGE"
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialValue?.discount_value ?? 10
  );
  const [minOrderAmount, setMinOrderAmount] = useState<number>(
    initialValue?.min_order_amount ?? 0
  );
  const [maxUses, setMaxUses] = useState<number>(initialValue?.max_uses ?? 100);
  const [startDate, setStartDate] = useState<string>(
    initialValue?.start_date
      ? new Date(initialValue.start_date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    initialValue?.end_date
      ? new Date(initialValue.end_date).toISOString().slice(0, 10)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [imageUrl, setImageUrl] = useState<string>(
    initialValue?.image_url ?? ""
  );

  // Scope: ALL | SERVICE | METHOD
  const [scopeType, setScopeType] = useState<"ALL" | "SERVICE" | "METHOD">(
    initialValue?.applicable_treatment_method_id
      ? "METHOD"
      : initialValue?.applicable_service_slug
      ? "SERVICE"
      : "ALL"
  );
  const [selectedServiceSlug, setSelectedServiceSlug] = useState<string>(
    initialValue?.applicable_service_slug ?? ""
  );
  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    initialValue?.applicable_treatment_method_id ?? ""
  );

  const [broadcastNotification, setBroadcastNotification] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flatten all treatment methods across services
  const allTreatmentMethods = services.flatMap((s) =>
    (s.treatmentMethods ?? []).map((m) => ({
      ...m,
      serviceName: s.name,
      category: s.category,
    }))
  );

  const usedCount = initialValue?.used_count ?? 0;
  const minAllowedUses = isEditing ? usedCount : 1;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const numericMaxUses = Number(maxUses);
    if (isEditing && numericMaxUses < usedCount) {
      setError(
        `Giới hạn số lượt dùng (${numericMaxUses}) không được ít hơn số lượt đã sử dụng (${usedCount}).`
      );
      return;
    }

    const payload: SavePromotionPayload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      min_order_amount: Number(minOrderAmount),
      max_uses: numericMaxUses,
      start_date: startDate,
      end_date: endDate,
      image_url: imageUrl || undefined,
      applicable_service_slug:
        scopeType === "SERVICE" ? selectedServiceSlug || undefined : undefined,
      applicable_treatment_method_id:
        scopeType === "METHOD" ? selectedMethodId || undefined : undefined,
      broadcast_notification: broadcastNotification,
    };

    onSubmit(payload);
  };

  return (
    <AdminModal
      title={isEditing ? `Sửa Voucher: ${initialValue?.code}` : "Tạo Mã Voucher / Khuyến mãi mới"}
      description="Thiết lập chương trình khuyến mãi, phạm vi áp dụng và thời hạn cho khách hàng."
      onClose={onClose}
    >
      <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-semibold text-red-700">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminInput
            label="Mã Voucher Code"
            required
            disabled={isEditing}
            className="uppercase font-mono tracking-wider font-bold"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="VD: SUMMER2026"
          />
          <div>
            <AdminInput
              label={
                isEditing
                  ? `Giới hạn số lượt dùng (Đã dùng: ${usedCount})`
                  : "Giới hạn số lượt dùng"
              }
              type="number"
              required
              min={minAllowedUses}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="font-mono"
              placeholder="100"
            />
            {isEditing && (
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Lưu ý: Không được nhập nhỏ hơn số lượt đã dùng ({usedCount}).
              </p>
            )}
          </div>
        </div>

        <AdminInput
          label="Tên chương trình khuyến mãi"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Giảm giá niềng răng chào hè 2026"
        />

        <TextareaField
          label="Mô tả chương trình"
          rows={2}
          value={description}
          onChange={setDescription}
          placeholder="Mô tả chi tiết điều kiện, đối tượng và phạm vi ưu đãi..."
        />

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-slate-50/70 p-4 sm:grid-cols-3">
          <AdminSelect
            label="Loại giảm giá"
            required
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as DiscountType)}
          >
            <option value="PERCENTAGE">Phần trăm (%)</option>
            <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
          </AdminSelect>

          <AdminInput
            label={
              discountType === "PERCENTAGE"
                ? "Mức giảm (%)"
                : "Mức giảm (VNĐ)"
            }
            type="number"
            required
            min={1}
            max={discountType === "PERCENTAGE" ? 100 : undefined}
            step={discountType === "PERCENTAGE" ? 1 : 50000}
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value))}
            className="font-mono text-right font-bold text-brand"
          />

          <AdminInput
            label="Đơn hàng tối thiểu (VNĐ)"
            type="number"
            min={0}
            step={50000}
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(Number(e.target.value))}
            className="font-mono text-right"
            placeholder="0"
          />
        </div>

        {/* Section: Applicable Scope */}
        <div className="space-y-3 rounded-xl border border-border bg-slate-50/70 p-4">
          <label className="text-sm font-semibold text-brand-dark">
            Phạm vi áp dụng Voucher
          </label>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="radio"
                name="scopeType"
                checked={scopeType === "ALL"}
                onChange={() => setScopeType("ALL")}
                className="text-brand focus:ring-brand"
              />
              Toàn hệ thống (Tất cả dịch vụ)
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="radio"
                name="scopeType"
                checked={scopeType === "SERVICE"}
                onChange={() => setScopeType("SERVICE")}
                className="text-brand focus:ring-brand"
              />
              Theo Nhóm dịch vụ
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="radio"
                name="scopeType"
                checked={scopeType === "METHOD"}
                onChange={() => setScopeType("METHOD")}
                className="text-brand focus:ring-brand"
              />
              Theo Phương pháp điều trị
            </label>
          </div>

          {scopeType === "SERVICE" && (
            <div className="mt-2">
              <AdminSelect
                label="Chọn nhóm dịch vụ áp dụng"
                required
                value={selectedServiceSlug}
                onChange={(e) => setSelectedServiceSlug(e.target.value)}
              >
                <option value="">-- Chọn nhóm dịch vụ --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.slug || ""}>
                    [{s.category}] {s.name}
                  </option>
                ))}
              </AdminSelect>
            </div>
          )}

          {scopeType === "METHOD" && (
            <div className="mt-2">
              <AdminSelect
                label="Chọn phương pháp điều trị cụ thể"
                required
                value={selectedMethodId}
                onChange={(e) => setSelectedMethodId(e.target.value)}
              >
                <option value="">-- Chọn phương pháp điều trị --</option>
                {allTreatmentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.category}] {m.serviceName} - {m.name}
                  </option>
                ))}
              </AdminSelect>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AdminInput
            label="Từ ngày"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <AdminInput
            label="Đến ngày"
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <ImagePicker
          label="Ảnh đại diện / Banner khuyến mãi"
          value={imageUrl}
          onChange={setImageUrl}
        />

        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={broadcastNotification}
              onChange={(e) => setBroadcastNotification(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
            />
            <span className="text-sm font-bold text-blue-900">
              📢 Tự động gửi thông báo quảng bá (Broadcast) tới tất cả Bệnh nhân ngay khi lưu
            </span>
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-3 border-t border-border pt-4">
          <AdminButton
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </AdminButton>
          <AdminButton type="submit" disabled={submitting}>
            {submitting ? "Đang lưu..." : isEditing ? "Cập nhật Voucher" : "Tạo Voucher mới"}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  );
}
