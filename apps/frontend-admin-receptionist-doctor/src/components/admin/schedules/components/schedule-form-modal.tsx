"use client";

import { useId, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { CalendarPlus, MagicWand, PencilSimpleLine, WarningCircle } from "@phosphor-icons/react";
import { AdminButton, AdminModal } from "@/src/components/admin/common";
import { cn } from "@/src/lib/utils/cn";
import { AutoScheduleFields } from "./auto-schedule-fields";
import { ManualScheduleFields } from "./manual-schedule-fields";
import { getScheduleValidationError } from "../schedule-utils";
import type { ScheduleFormState } from "../types";
import type { BusinessHour } from "../../setting/types";

type ScheduleFormModalProps = {
  businessHours: BusinessHour[];
  form: ScheduleFormState;
  isEditing?: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  serverError?: string | null;
  setForm: Dispatch<SetStateAction<ScheduleFormState>>;
  submitting: boolean;
  toggleSelectedDay: (dayOfWeek: number) => void;
};

export function ScheduleFormModal({
  businessHours,
  form,
  isEditing = false,
  onClose,
  onSubmit,
  serverError,
  setForm,
  submitting,
  toggleSelectedDay,
}: ScheduleFormModalProps) {
  const formId = useId();
  const validationError = getScheduleValidationError(form, businessHours);
  const displayError = validationError || serverError;

  const setAutoSchedule = (autoSchedule: boolean) =>
    setForm((current) => ({ ...current, autoSchedule, recordType: "WEEKLY" }));

  return (
    <AdminModal
      title={isEditing ? "Cập nhật ca làm việc" : "Thêm lịch mới"}
      description={
        isEditing
          ? "Điều chỉnh thời gian làm việc của bác sĩ trong ngày này."
          : "Thiết lập ca trực mới hoặc tự động tạo lịch tuần cho bác sĩ."
      }
      icon={isEditing ? <PencilSimpleLine size={20} weight="duotone" /> : <CalendarPlus size={20} weight="duotone" />}
      size="md"
      onClose={onClose}
      footer={
        <>
          <AdminButton variant="secondary" onClick={onClose} disabled={submitting}>
            Hủy
          </AdminButton>
          <AdminButton type="submit" form={formId} loading={submitting} disabled={Boolean(validationError)}>
            {submitting ? "Đang lưu..." : isEditing ? "Cập nhật" : "Thêm lịch"}
          </AdminButton>
        </>
      }
    >
      <form id={formId} className="mt-4 flex flex-col gap-5" onSubmit={onSubmit}>
        <div role="radiogroup" aria-label="Cách tạo lịch" className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1">
          {[
            { value: false, label: "Từng ca thủ công", icon: PencilSimpleLine },
            { value: true, label: "Tự động lên lịch", icon: MagicWand },
          ].map((option) => {
            const selected = form.autoSchedule === option.value;
            const OptionIcon = option.icon;
            return (
              <button
                key={option.label}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAutoSchedule(option.value)}
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all",
                  selected ? "bg-white text-brand shadow-sm ring-1 ring-slate-900/5" : "text-slate-500 hover:text-slate-800",
                )}
              >
                <OptionIcon size={16} weight="bold" />
                {option.label}
              </button>
            );
          })}
        </div>
        {form.autoSchedule ? (
          <p className="-mt-2 text-xs text-slate-500">Chỉ tạo ca trong những ngày phòng khám đang mở cửa.</p>
        ) : null}

        {!form.autoSchedule ? (
          <ManualScheduleFields businessHours={businessHours} form={form} setForm={setForm} />
        ) : (
          <AutoScheduleFields
            businessHours={businessHours}
            form={form}
            setForm={setForm}
            toggleSelectedDay={toggleSelectedDay}
          />
        )}

        {displayError ? (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs font-medium text-red-700">
            <WarningCircle size={16} weight="fill" className="shrink-0 text-red-500" />
            <span>{displayError}</span>
          </div>
        ) : null}
      </form>
    </AdminModal>
  );
}
