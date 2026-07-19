import type { Dispatch, FormEvent, SetStateAction } from "react";
import { AdminButton, AdminModal } from "@/src/components/admin/common";
import { AutoScheduleFields } from "./auto-schedule-fields";
import { ManualScheduleFields } from "./manual-schedule-fields";
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
  return (
    <AdminModal
      title="Them lich moi"
      description="Thiet lap ca truc moi hoac tu dong tao lich tuan cho bac si."
      onClose={onClose}
    >
      <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmit}>
        <label className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/60 px-4 py-3">
          <span>
            <span className="block text-sm font-semibold text-brand-dark">
              Tu dong len lich
            </span>
            <span className="block text-xs text-muted-foreground">
              Chi tao ca trong ngay phong kham dang mo cua.
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

        <div className="flex justify-end gap-3 pt-2">
          <AdminButton
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Huy
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
            {submitting ? "Dang luu..." : "Them lich"}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  );
}
