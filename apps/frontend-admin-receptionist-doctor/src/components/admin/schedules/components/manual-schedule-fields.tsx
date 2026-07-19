import type { Dispatch, SetStateAction } from "react";
import { AdminInput, AdminSelect } from "@/src/components/admin/common";
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
        label="Loai lich"
        value={form.recordType}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            recordType: event.target.value as "WEEKLY" | "TIME_OFF",
          }))
        }
      >
        <option value="WEEKLY">Ca lam viec</option>
        <option value="TIME_OFF">Nghi phep</option>
      </AdminSelect>

      <AdminSelect
        label="Ngay trong tuan"
        value={form.dayOfWeek}
        onChange={(event) => {
          const dayOfWeek = Number(event.target.value);
          const businessHour = businessHours.find(
            (day) => day.id === dayOfWeek,
          );

          setForm((current) => ({
            ...current,
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
              disabled={form.recordType === "WEEKLY" && !businessHour?.isOpen}
            >
              {day.label}
              {businessHour?.isOpen
                ? ` (${businessHour.start}-${businessHour.end})`
                : " (phong kham nghi)"}
            </option>
          );
        })}
      </AdminSelect>

      {form.recordType === "WEEKLY" ? (
        <>
          {selectedBusinessHour?.isOpen ? (
            <p className="text-xs text-muted-foreground">
              Khung gio phong kham: {selectedBusinessHour.start} -{" "}
              {selectedBusinessHour.end}
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TimeInput
              label="Gio bat dau"
              value={form.startTime}
              onChange={(value) =>
                setForm((current) => ({ ...current, startTime: value }))
              }
            />
            <TimeInput
              label="Gio ket thuc"
              value={form.endTime}
              onChange={(value) =>
                setForm((current) => ({ ...current, endTime: value }))
              }
            />
          </div>
        </>
      ) : (
        <AdminInput
          label="Ly do nghi"
          type="text"
          value={form.reason}
          onChange={(event) =>
            setForm((current) => ({ ...current, reason: event.target.value }))
          }
          placeholder="VD: Nghi phep ca nhan"
          required
        />
      )}
    </>
  );
}
