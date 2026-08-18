import type { Dispatch, SetStateAction } from "react";
import { AdminInput, AdminSelect } from "@/src/components/admin/common";
import { DEFAULT_SHIFT_TEMPLATES, weekDays } from "../constants";
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
        label="Loại lịch"
        value={form.recordType}
        onChange={(event) =>
          setForm((current) => ({
            ...current,
            recordType: event.target.value as "WEEKLY" | "DATE_OVERRIDE" | "TIME_OFF",
          }))
        }
      >
        <option value="WEEKLY">Lịch tuần cố định (Cố định thứ)</option>
        <option value="DATE_OVERRIDE">Lịch làm bù / Đột xuất (Ngày cụ thể)</option>
        <option value="TIME_OFF">Đăng ký nghỉ phép</option>
      </AdminSelect>

      {form.recordType === "DATE_OVERRIDE" ? (
        <AdminInput
          label="Ngày làm bù / Đột xuất"
          type="date"
          value={form.specificDate}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              specificDate: event.target.value,
            }))
          }
          required
        />
      ) : (
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
                  : " (phòng khám nghỉ)"}
              </option>
            );
          })}
        </AdminSelect>
      )}

      {form.recordType !== "TIME_OFF" ? (
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Chọn nhanh Ca chuẩn phòng khám:
            </label>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_SHIFT_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      startTime: tmpl.startTime,
                      endTime: tmpl.endTime,
                    }))
                  }
                  className="rounded border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {selectedBusinessHour?.isOpen && form.recordType === "WEEKLY" ? (
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
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TimeInput
              label="Từ giờ (để trống nếu nghỉ cả ngày)"
              value={form.startTime}
              onChange={(value) =>
                setForm((current) => ({ ...current, startTime: value }))
              }
            />
            <TimeInput
              label="Đến giờ (để trống nếu nghỉ cả ngày)"
              value={form.endTime}
              onChange={(value) =>
                setForm((current) => ({ ...current, endTime: value }))
              }
            />
          </div>
          <AdminInput
            label="Lý do nghỉ phép"
            type="text"
            value={form.reason}
            onChange={(event) =>
              setForm((current) => ({ ...current, reason: event.target.value }))
            }
            placeholder="VD: Nghỉ phép cá nhân / Đi công tác"
            required
          />
        </>
      )}
    </>
  );
}

