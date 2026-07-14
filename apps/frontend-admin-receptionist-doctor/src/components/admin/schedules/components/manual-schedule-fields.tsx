import type { Dispatch, SetStateAction } from "react";
import { AdminInput, AdminSelect } from "@/src/components/admin/common";
import { weekDays } from "../constants";
import { TimeInput } from "./time-input";
import type { ScheduleFormState } from "../types";

type ManualScheduleFieldsProps = {
  form: ScheduleFormState;
  setForm: Dispatch<SetStateAction<ScheduleFormState>>;
};

export function ManualScheduleFields({
  form,
  setForm,
}: ManualScheduleFieldsProps) {
  return (
    <>
      <AdminSelect
        label="Loại lịch"
        value={form.recordType}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            recordType: event.target.value as "WEEKLY" | "TIME_OFF",
          }))
        }
      >
        <option value="WEEKLY">Ca làm việc</option>
        <option value="TIME_OFF">Nghỉ phép</option>
      </AdminSelect>

      <AdminSelect
        label="Ngày trong tuần"
        value={form.dayOfWeek}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            dayOfWeek: Number(event.target.value),
          }))
        }
      >
        {weekDays.map((day) => (
          <option key={day.index} value={day.index}>
            {day.label}
          </option>
        ))}
      </AdminSelect>

      {form.recordType === "WEEKLY" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TimeInput
            label="Giờ bắt đầu"
            value={form.startTime}
            onChange={(value) =>
              setForm((current) => ({ ...current, startTime: value }))
            }
          />
          <TimeInput
            label="Giờ kết thúc"
            value={form.endTime}
            onChange={(value) =>
              setForm((current) => ({ ...current, endTime: value }))
            }
          />
        </div>
      ) : (
        <AdminInput
          label="Lý do nghỉ"
          type="text"
          value={form.reason}
          onChange={(event) =>
            setForm((current) => ({ ...current, reason: event.target.value }))
          }
          placeholder="VD: Nghỉ phép cá nhân"
          required
        />
      )}
    </>
  );
}
