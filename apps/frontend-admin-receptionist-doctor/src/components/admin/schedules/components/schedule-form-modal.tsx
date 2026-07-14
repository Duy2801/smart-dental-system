import type { Dispatch, FormEvent, SetStateAction } from "react";
import { AdminButton, AdminModal } from "@/src/components/admin/common";
import { AutoScheduleFields } from "./auto-schedule-fields";
import { ManualScheduleFields } from "./manual-schedule-fields";
import type { ScheduleFormState } from "../types";

type ScheduleFormModalProps = {
  addAutoShift: () => void;
  form: ScheduleFormState;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  removeAutoShift: (index: number) => void;
  setAutoShift: (
    index: number,
    key: "startTime" | "endTime",
    value: string,
  ) => void;
  setForm: Dispatch<SetStateAction<ScheduleFormState>>;
  submitting: boolean;
  toggleSelectedDay: (dayOfWeek: number) => void;
};

export function ScheduleFormModal({
  addAutoShift,
  form,
  onClose,
  onSubmit,
  removeAutoShift,
  setAutoShift,
  setForm,
  submitting,
  toggleSelectedDay,
}: ScheduleFormModalProps) {
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
              Tạo nhiều ca cho nhiều ngày trong tuần cùng lúc.
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
          <ManualScheduleFields form={form} setForm={setForm} />
        ) : (
          <AutoScheduleFields
            form={form}
            setForm={setForm}
            toggleSelectedDay={toggleSelectedDay}
            setAutoShift={setAutoShift}
            addAutoShift={addAutoShift}
            removeAutoShift={removeAutoShift}
          />
        )}

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
            disabled={
              submitting ||
              (form.autoSchedule &&
                (form.selectedDays.length === 0 ||
                  form.autoShifts.length === 0))
            }
          >
            {submitting ? "Đang lưu..." : "Thêm lịch"}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  );
}
