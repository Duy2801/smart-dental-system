import type { Dispatch, FormEvent, SetStateAction } from "react";
import { AdminButton, AdminModal } from "@/src/components/admin/common";
import { AutoScheduleFields } from "./auto-schedule-fields";
import { ManualScheduleFields } from "./manual-schedule-fields";
import { getScheduleValidationError } from "../schedule-utils";
import type { ScheduleFormState } from "../types";
import type { BusinessHour } from "../../setting/types";

type ScheduleFormModalProps = {
  businessHours: BusinessHour[];
  form: ScheduleFormState;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setForm: Dispatch<SetStateAction<ScheduleFormState>>;
  submitting: boolean;
  toggleSelectedDay: (dayOfWeek: number) => void;
};

export function ScheduleFormModal({
  businessHours,
  form,
  onClose,
  onSubmit,
  setForm,
  submitting,
  toggleSelectedDay,
}: ScheduleFormModalProps) {
  const validationError = getScheduleValidationError(form, businessHours);

  return (
    <AdminModal
      title="Thêm lịch mới"
      description="Thiết lập ca trực mới hoặc tự động tạo lịch tuần cho bác sĩ."
      onClose={onClose}
    >
      <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmit}>
        <label className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/60 px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-brand-dark">
              Tự động lên lịch
            </span>
            <span className="block text-xs text-muted-foreground">
              Chỉ tạo ca trong ngày phòng khám đang mở cửa.
            </span>
          </span>
          <input
            type="checkbox"
            checked={form.autoSchedule}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                autoSchedule: event.target.checked,
                recordType: "WEEKLY",
              }))
            }
            className="h-5 w-5 accent-brand"
          />
        </label>

        {!form.autoSchedule ? (
          <ManualScheduleFields
            businessHours={businessHours}
            form={form}
            setForm={setForm}
          />
        ) : (
          <AutoScheduleFields
            businessHours={businessHours}
            form={form}
            setForm={setForm}
            toggleSelectedDay={toggleSelectedDay}
          />
        )}

        {validationError ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            <svg
              className="h-4 w-4 shrink-0 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{validationError}</span>
          </div>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <AdminButton
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </AdminButton>
          <AdminButton
            type="submit"
            disabled={submitting || Boolean(validationError)}
          >
            {submitting ? "Đang lưu..." : "Thêm lịch"}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  );
}
