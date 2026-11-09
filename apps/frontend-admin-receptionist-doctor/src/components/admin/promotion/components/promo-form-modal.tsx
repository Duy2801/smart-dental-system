"use client";

import { useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowsClockwise,
  CalendarBlank,
  CurrencyCircleDollar,
  Globe,
  ImageSquare,
  Megaphone,
  Percent,
  Tag,
  Target,
  Ticket,
  WarningCircle,
  type Icon,
} from "@phosphor-icons/react";
import {
  AdminButton,
  AdminFormSection,
  AdminImagePicker,
  AdminInput,
  AdminModal,
  AdminSelect,
  AdminTextarea as TextareaField,
  collapseSpaces,
  focusFirstError,
  hasErrors,
  todayISODate,
  validateNumber,
  validateText,
  type FieldErrors,
} from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { getServices } from "@/src/components/admin/service_pricing/service-pricing-api";
import type { SavePromotionPayload, DiscountType, Promotion } from "../types";

type PromoFormModalProps = {
  initialValue?: Promotion | null;
  onClose: () => void;
  onSubmit: (payload: SavePromotionPayload) => void;
  submitting: boolean;
};

function generateVoucherCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `KM${randomPart}`;
}

type ScopeType = "ALL" | "SERVICE" | "METHOD";

type PromoField =
  | "name"
  | "description"
  | "maxUses"
  | "discountValue"
  | "minOrderAmount"
  | "scope"
  | "startDate"
  | "endDate";

const scopeOptions: { value: ScopeType; label: string; description: string; icon: Icon }[] = [
  { value: "ALL", label: "Toàn hệ thống", description: "Áp dụng cho mọi dịch vụ", icon: Globe },
  { value: "SERVICE", label: "Theo nhóm dịch vụ", description: "Ví dụ: Chỉnh nha, Nha chu", icon: Tag },
  { value: "METHOD", label: "Theo phương pháp", description: "Một phương pháp điều trị cụ thể", icon: Target },
];

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

  const [code, setCode] = useState(() => initialValue?.code ?? generateVoucherCode());
  const [name, setName] = useState(initialValue?.name ?? "");
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(
    initialValue?.discount_type ?? "PERCENTAGE"
  );
  const [discountValue, setDiscountValue] = useState<string | number>(
    initialValue?.discount_value ?? 10
  );
  const [minOrderAmount, setMinOrderAmount] = useState<string | number>(
    initialValue?.min_order_amount ?? 0
  );
  const [maxUses, setMaxUses] = useState<string | number>(
    initialValue?.max_uses ?? 100
  );

  const handleNumericChange =
    (setter: (value: string | number) => void) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const val = event.target.value;
      if (val === "") {
        setter("");
        return;
      }
      const cleaned = val.replace(/^0+(?=\d)/, "");
      setter(cleaned);
    };
  const [startDate, setStartDate] = useState<string>(() =>
    initialValue?.start_date
      ? new Date(initialValue.start_date).toISOString().slice(0, 10)
      : todayISODate()
  );
  const [endDate, setEndDate] = useState<string>(() =>
    initialValue?.end_date
      ? new Date(initialValue.end_date).toISOString().slice(0, 10)
      : (() => {
          const date = new Date(`${todayISODate()}T00:00:00`);
          date.setDate(date.getDate() + 30);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        })()
  );
  const [imageUrl, setImageUrl] = useState<string>(
    initialValue?.image_url ?? ""
  );

  // Scope: ALL | SERVICE | METHOD
  const formId = useId();
  const [scopeType, setScopeType] = useState<ScopeType>(
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
  const [errors, setErrors] = useState<FieldErrors<PromoField>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const today = todayISODate();
  const originalStartDate = initialValue?.start_date
    ? new Date(initialValue.start_date).toISOString().slice(0, 10)
    : null;

  /** Bọc setter để xóa lỗi của trường khi người dùng sửa lại */
  const withClear =
    <Value,>(field: PromoField | PromoField[], setter: (value: Value) => void) =>
    (value: Value) => {
      const fields = Array.isArray(field) ? field : [field];
      setErrors((current) =>
        fields.some((key) => current[key])
          ? { ...current, ...Object.fromEntries(fields.map((key) => [key, undefined])) }
          : current,
      );
      setter(value);
    };

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

  const validate = (): FieldErrors<PromoField> => {
    const numericDiscount = discountValue === "" ? "" : Number(discountValue);
    const numericMinOrder = minOrderAmount === "" ? 0 : Number(minOrderAmount);
    const next: FieldErrors<PromoField> = {
      name: validateText(name, { label: "Tên chương trình", required: true, min: 3, max: 150 }),
      description: validateText(description, { label: "Mô tả", max: 1000 }),
      maxUses: validateNumber(maxUses, {
        label: "Giới hạn số lượt dùng",
        min: Math.max(1, minAllowedUses),
        max: 1_000_000,
      }),
      discountValue:
        discountType === "PERCENTAGE"
          ? validateNumber(numericDiscount, { label: "Mức giảm", min: 1, max: 100, unit: "%" })
          : validateNumber(numericDiscount, { label: "Mức giảm", min: 1_000, max: 1_000_000_000, unit: "đ" }),
      minOrderAmount: validateNumber(minOrderAmount, {
        label: "Đơn hàng tối thiểu",
        min: 0,
        max: 10_000_000_000,
        required: false,
        unit: "đ",
      }),
      scope:
        scopeType === "SERVICE" && !selectedServiceSlug
          ? "Vui lòng chọn nhóm dịch vụ được áp dụng."
          : scopeType === "METHOD" && !selectedMethodId
            ? "Vui lòng chọn phương pháp điều trị được áp dụng."
            : undefined,
      startDate: !startDate
        ? "Vui lòng chọn ngày bắt đầu."
        : // Ngày bắt đầu mới không được ở quá khứ (giữ nguyên ngày cũ khi sửa thì cho phép)
          startDate < today && startDate !== originalStartDate
          ? "Ngày bắt đầu không được ở trong quá khứ."
          : undefined,
      endDate: !endDate
        ? "Vui lòng chọn ngày kết thúc."
        : startDate && endDate < startDate
          ? "Ngày kết thúc phải sau hoặc trùng ngày bắt đầu."
          : endDate < today
            ? "Ngày kết thúc đã qua — voucher sẽ hết hạn ngay."
            : undefined,
    };
    if (
      !next.discountValue &&
      discountType === "FIXED_AMOUNT" &&
      numericMinOrder > 0 &&
      Number(numericDiscount) > numericMinOrder
    ) {
      next.discountValue = "Mức giảm không được lớn hơn giá trị đơn hàng tối thiểu.";
    }
    return next;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      focusFirstError(formRef.current);
      return;
    }

    const numericMaxUses = Number(maxUses);
    const numericDiscount = Number(discountValue);
    const numericMinOrder = minOrderAmount === "" ? 0 : Number(minOrderAmount);

    const payload: SavePromotionPayload = {
      code: code.trim().toUpperCase(),
      name: collapseSpaces(name),
      description: description.trim(),
      discount_type: discountType,
      discount_value: numericDiscount,
      min_order_amount: numericMinOrder,
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

  const numericPreview = Number(discountValue) || 0;
  const discountPreview =
    discountType === "PERCENTAGE"
      ? `Giảm ${numericPreview}%`
      : `Giảm ${numericPreview.toLocaleString("vi-VN")}đ`;

  return (
    <AdminModal
      title={isEditing ? `Sửa voucher ${initialValue?.code}` : "Tạo voucher khuyến mãi mới"}
      description="Thiết lập chương trình khuyến mãi, phạm vi áp dụng và thời hạn cho khách hàng."
      icon={<Ticket size={20} weight="duotone" />}
      size="md"
      variant="drawer"
      onClose={onClose}
      footer={
        <>
          <AdminButton type="submit" form={formId} loading={submitting}>
            {submitting ? "Đang lưu..." : isEditing ? "Cập nhật voucher" : "Tạo voucher"}
          </AdminButton>
          <AdminButton variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </AdminButton>
          {hasErrors(errors) ? (
            <p role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <WarningCircle size={16} weight="fill" className="shrink-0" />
              Vui lòng kiểm tra lại các trường được đánh dấu.
            </p>
          ) : null}
        </>
      }
    >
      <form id={formId} ref={formRef} noValidate className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
        <AdminFormSection title="Thông tin chương trình" icon={<Ticket size={15} weight="bold" />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold text-slate-700">
                  Mã voucher <span className="text-rose-500">*</span>
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold",
                    isEditing
                      ? "border-slate-200 bg-slate-100 text-slate-600"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700",
                  )}
                >
                  {!isEditing ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> : null}
                  {isEditing ? "Mã cố định" : "Tự động sinh"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  aria-label="Mã voucher"
                  value={code}
                  className="h-11 w-full min-w-0 cursor-default select-all rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 font-mono text-sm font-bold uppercase tracking-wider text-slate-900 outline-none"
                />
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setCode(generateVoucherCode())}
                    title="Sinh lại mã khác"
                    aria-label="Sinh lại mã voucher khác"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-brand/30 hover:bg-brand-light hover:text-brand"
                  >
                    <ArrowsClockwise size={16} weight="bold" />
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Mã voucher cố định, không thể thay đổi sau khi đã tạo."
                  : "Mã được hệ thống tự động sinh, không cần nhập tay."}
              </p>
            </div>
            <AdminInput
              label="Giới hạn số lượt dùng"
              type="number"
              required
              min={minAllowedUses}
              max={1_000_000}
              inputMode="numeric"
              value={maxUses}
              error={errors.maxUses}
              onChange={handleNumericChange(withClear("maxUses", setMaxUses))}
              className="font-mono"
              placeholder="100"
              hint={
                isEditing
                  ? `Đã dùng ${usedCount} lượt — không được nhập nhỏ hơn số này.`
                  : "Tổng số lần voucher có thể được áp dụng."
              }
            />
          </div>

          <AdminInput
            label="Tên chương trình khuyến mãi"
            required
            maxLength={150}
            value={name}
            error={errors.name}
            onChange={(e) => withClear("name", setName)(e.target.value)}
            placeholder="VD: Giảm giá niềng răng chào hè 2026"
          />

          <TextareaField
            label="Mô tả chương trình"
            rows={3}
            maxLength={1000}
            value={description}
            error={errors.description}
            onChange={withClear("description", setDescription)}
            placeholder="Mô tả chi tiết điều kiện, đối tượng và phạm vi ưu đãi..."
          />
        </AdminFormSection>

        <AdminFormSection
          title="Mức giảm giá"
          icon={<CurrencyCircleDollar size={15} weight="bold" />}
          description={
            <>
              Xem trước:{" "}
              <span className="rounded-md bg-brand-light px-1.5 py-0.5 font-bold text-brand">{discountPreview}</span>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-slate-700">
                Loại giảm giá <span className="text-rose-500">*</span>
              </span>
              <div role="radiogroup" aria-label="Loại giảm giá" className="grid h-11 grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
                {([
                  { value: "PERCENTAGE", label: "Phần trăm", icon: Percent },
                  { value: "FIXED_AMOUNT", label: "Số tiền", icon: CurrencyCircleDollar },
                ] as const).map((option) => {
                  const selected = discountType === option.value;
                  const OptionIcon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => withClear("discountValue", setDiscountType)(option.value)}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all",
                        selected ? "bg-white text-brand shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:text-slate-800",
                      )}
                    >
                      <OptionIcon size={14} weight="bold" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <AdminInput
              label={discountType === "PERCENTAGE" ? "Mức giảm (%)" : "Mức giảm (VNĐ)"}
              type="number"
              required
              min={discountType === "PERCENTAGE" ? 1 : 1000}
              max={discountType === "PERCENTAGE" ? 100 : undefined}
              inputMode="numeric"
              value={discountValue}
              error={errors.discountValue}
              onChange={handleNumericChange(withClear("discountValue", setDiscountValue))}
              className="font-mono font-bold text-brand"
              hint={discountType === "PERCENTAGE" ? "Từ 1 đến 100%." : "Tối thiểu 1.000đ."}
            />

            <AdminInput
              label="Đơn hàng tối thiểu (VNĐ)"
              type="number"
              min={0}
              inputMode="numeric"
              value={minOrderAmount}
              error={errors.minOrderAmount}
              onChange={handleNumericChange(withClear(["minOrderAmount", "discountValue"], setMinOrderAmount))}
              className="font-mono"
              placeholder="0"
              hint="Để 0 nếu không yêu cầu."
            />
          </div>
        </AdminFormSection>

        <AdminFormSection title="Phạm vi áp dụng" icon={<Target size={15} weight="bold" />}>
          <div role="radiogroup" aria-label="Phạm vi áp dụng" className="grid gap-2.5 sm:grid-cols-3">
            {scopeOptions.map((option) => {
              const selected = scopeType === option.value;
              const ScopeIcon = option.icon;
              return (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border bg-white p-3 transition-all has-focus-visible:ring-3 has-focus-visible:ring-brand/25",
                    selected ? "border-brand ring-1 ring-brand shadow-sm shadow-brand/10" : "border-slate-200 hover:border-slate-300",
                  )}
                >
                  <input
                    type="radio"
                    name="scopeType"
                    checked={selected}
                    onChange={() => withClear("scope", setScopeType)(option.value)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      selected ? "bg-brand text-white" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    <ScopeIcon size={16} weight={selected ? "fill" : "regular"} />
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block text-sm font-bold", selected ? "text-brand" : "text-slate-800")}>
                      {option.label}
                    </span>
                    <span className="block text-[11px] leading-snug text-slate-500">{option.description}</span>
                  </span>
                </label>
              );
            })}
          </div>

          {scopeType === "SERVICE" ? (
            <AdminSelect
              label="Nhóm dịch vụ áp dụng"
              required
              value={selectedServiceSlug}
              error={errors.scope}
              onChange={(e) => withClear("scope", setSelectedServiceSlug)(e.target.value)}
            >
              <option value="">-- Chọn nhóm dịch vụ --</option>
              {services.map((s) => (
                <option key={s.id} value={s.slug || ""}>
                  [{s.category}] {s.name}
                </option>
              ))}
            </AdminSelect>
          ) : null}

          {scopeType === "METHOD" ? (
            <AdminSelect
              label="Phương pháp điều trị áp dụng"
              required
              value={selectedMethodId}
              error={errors.scope}
              onChange={(e) => withClear("scope", setSelectedMethodId)(e.target.value)}
            >
              <option value="">-- Chọn phương pháp điều trị --</option>
              {allTreatmentMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.category}] {m.serviceName} - {m.name}
                </option>
              ))}
            </AdminSelect>
          ) : null}
        </AdminFormSection>

        <AdminFormSection title="Thời gian hiệu lực" icon={<CalendarBlank size={15} weight="bold" />}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AdminInput
              label="Từ ngày"
              type="date"
              required
              min={isEditing ? undefined : today}
              value={startDate}
              error={errors.startDate}
              onChange={(e) => withClear(["startDate", "endDate"], setStartDate)(e.target.value)}
            />
            <AdminInput
              label="Đến ngày"
              type="date"
              required
              min={startDate > today ? startDate : today}
              value={endDate}
              error={errors.endDate}
              onChange={(e) => withClear("endDate", setEndDate)(e.target.value)}
            />
          </div>
        </AdminFormSection>

        <AdminFormSection title="Ảnh banner khuyến mãi" icon={<ImageSquare size={15} weight="bold" />}>
          <AdminImagePicker
            layout="wide"
            value={imageUrl}
            onChange={setImageUrl}
            hint="Nên dùng ảnh ngang tỉ lệ 16:9, hiển thị ở trang ưu đãi của bệnh nhân."
          />
        </AdminFormSection>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50/70 p-4 transition-colors hover:bg-sky-50">
          <input
            type="checkbox"
            checked={broadcastNotification}
            onChange={(e) => setBroadcastNotification(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
          />
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-sky-600 ring-1 ring-sky-200">
            <Megaphone size={16} weight="duotone" />
          </span>
          <span>
            <span className="block text-sm font-bold text-sky-900">Gửi thông báo quảng bá ngay khi lưu</span>
            <span className="block text-xs text-sky-800/80">Tất cả bệnh nhân sẽ nhận được thông báo về chương trình này.</span>
          </span>
        </label>
      </form>
    </AdminModal>
  );
}
