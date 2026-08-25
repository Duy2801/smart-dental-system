import type { Dispatch, SetStateAction } from "react";
import { AdminSelect } from "@/src/components/admin/common";
import { weekDays } from "../constants";
import { TimeInput } from "./time-input";
import type { ScheduleFormState } from "../types";
import type { BusinessHour } from "../../setting/types";

type ManualScheduleFieldsProps = {
  businessHours: BusinessHour[];
  form: ScheduleFormState;
  setForm: Dispatch<SetStateAction<ScheduleFormState>>;
};

export function ManualScheduleFields({
  businessHours,
  form,
  setForm,
}: ManualScheduleFieldsProps) {
  const selectedBusinessHour = businessHours.find(
    (day) => day.id === form.dayOfWeek,
  );

  return (
    <>
      <AdminSelect
        label="Ngày trong tuần"
        value={form.dayOfWeek}
        onChange={(event) => {
          const dayOfWeek = Number(event.target.value);
          const businessHour = businessHours.find(
            (day) => day.id === dayOfWeek,
          );

          setForm((current) => ({
            ...current,
            recordType: "WEEKLY",
            dayOfWeek,
            startTime: businessHour?.start ?? current.startTime,
            endTime: businessHour?.end ?? current.endTime,
          }));
        }}
      >
        {weekDays.map((day) => {
          const businessHour = businessHours.find(
            (hour) => hour.id === day.index,
          );

          return (
            <option
              key={day.index}
              value={day.index}
              disabled={!businessHour?.isOpen}
            >
              {day.label}
              {businessHour?.isOpen
                ? ` (${businessHour.start}-${businessHour.end})`
                : " (phòng khám nghỉ)"}
            </option>
          );
        })}
      </AdminSelect>

      {selectedBusinessHour?.isOpen ? (
        <p className="text-xs text-muted-foreground">
          Khung giờ phòng khám: {selectedBusinessHour.start} -{" "}
          {selectedBusinessHour.end}
        </p>
      ) : null}

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
    </>
  );
}

