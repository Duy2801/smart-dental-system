"use client";

import { useState } from "react";
import { doctors } from "@/src/components/admin/mock-data";
import { cn } from "@/src/lib/utils/cn";

type ShiftBlock = {
  id: string;
  type: "SCHEDULE" | "LEAVE";
  dayOfWeek: number; // 1 to 7 (1 = Thứ 2, 7 = Chủ Nhật)
  startTime?: string;
  endTime?: string;
  reason?: string;
};

const weekDays = [
  { label: "Thứ 2", index: 1 },
  { label: "Thứ 3", index: 2 },
  { label: "Thứ 4", index: 3 },
  { label: "Thứ 5", index: 4 },
  { label: "Thứ 6", index: 5 },
  { label: "Thứ 7", index: 6 },
  { label: "Chủ Nhật", index: 7 },
];

const mockShifts: ShiftBlock[] = [
  { id: "s1", type: "SCHEDULE", dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
  { id: "s2", type: "SCHEDULE", dayOfWeek: 1, startTime: "13:30", endTime: "17:30" },
  { id: "s3", type: "SCHEDULE", dayOfWeek: 2, startTime: "08:00", endTime: "12:00" },
  { id: "s4", type: "LEAVE", dayOfWeek: 3, reason: "Nghỉ phép cá nhân" },
  { id: "s5", type: "SCHEDULE", dayOfWeek: 4, startTime: "13:30", endTime: "17:30" },
  { id: "s6", type: "SCHEDULE", dayOfWeek: 5, startTime: "08:00", endTime: "17:30" },
  { id: "s7", type: "SCHEDULE", dayOfWeek: 6, startTime: "08:00", endTime: "12:00" },
];

export function SchedulesPageContent() {
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [shifts, setShifts] = useState<ShiftBlock[]>(mockShifts);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDayToAdd, setSelectedDayToAdd] = useState<number>(1);
  const [shiftType, setShiftType] = useState<"SCHEDULE" | "LEAVE">("SCHEDULE");

  const onDoctorChange = (id: string) => {
    setDoctorId(id);
    // In real app, fetch new schedule here
  };

  const openAddModal = (dayIndex: number) => {
    setSelectedDayToAdd(dayIndex);
    setShiftType("SCHEDULE");
    setIsAddModalOpen(true);
  };

  const removeShift = (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy add
    const formData = new FormData(e.target as HTMLFormElement);
    const newShift: ShiftBlock = {
      id: Math.random().toString(),
      type: shiftType,
      dayOfWeek: selectedDayToAdd,
      startTime: shiftType === "SCHEDULE" ? (formData.get("startTime") as string) : undefined,
      endTime: shiftType === "SCHEDULE" ? (formData.get("endTime") as string) : undefined,
      reason: shiftType === "LEAVE" ? (formData.get("reason") as string) : undefined,
    };
    setShifts((prev) => [...prev, newShift]);
    setIsAddModalOpen(false);
  };

  return (
    <>
      <div className="space-y-6 p-6 md:p-8">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <select
            value={doctorId}
            onChange={(e) => onDoctorChange(e.target.value)}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand sm:max-w-xs"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => openAddModal(1)}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]"
            >
              Thêm ca
            </button>
            <button
              type="button"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
            >
              Lưu lịch
            </button>
          </div>
        </div>

        {/* Schedule Table (Weekly View) */}
        <div className="flex flex-col rounded-xl border border-border bg-white">
          {weekDays.map((day) => {
            const dayShifts = shifts.filter((s) => s.dayOfWeek === day.index).sort((a, b) => {
              if (a.type !== "SCHEDULE" || b.type !== "SCHEDULE") return 0;
              return (a.startTime || "").localeCompare(b.startTime || "");
            });

            return (
              <div
                key={day.index}
                className="flex min-h-[80px] flex-col gap-4 border-b border-border p-5 last:border-b-0 sm:flex-row sm:items-start"
              >
                {/* Day Label */}
                <div className="flex w-32 shrink-0 items-center justify-between sm:block">
                  <h4 className="text-sm font-semibold text-brand-dark">{day.label}</h4>
                  <button
                    onClick={() => openAddModal(day.index)}
                    className="mt-1 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-brand sm:hidden"
                    title="Thêm ca"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  </button>
                  <button
                    onClick={() => openAddModal(day.index)}
                    className="mt-1 hidden text-xs font-medium text-muted-foreground hover:text-brand sm:inline-flex items-center gap-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    Thêm ca
                  </button>
                </div>

                {/* Shifts Blocks */}
                <div className="flex flex-1 flex-wrap gap-2">
                  {dayShifts.length === 0 ? (
                    <span className="py-1 text-sm text-muted-foreground">Không có lịch làm việc</span>
                  ) : (
                    dayShifts.map((shift) => (
                      <div
                        key={shift.id}
                        className={cn(
                          "group relative flex items-center rounded-lg px-3 py-1.5 text-sm",
                          shift.type === "SCHEDULE"
                            ? "bg-brand-light text-brand-dark"
                            : "bg-red-50 text-red-600"
                        )}
                      >
                        {shift.type === "SCHEDULE" ? (
                          <span className="font-mono font-medium">
                            {shift.startTime} - {shift.endTime}
                          </span>
                        ) : (
                          <span className="font-medium">Nghỉ phép: {shift.reason}</span>
                        )}
                        <button
                          onClick={() => removeShift(shift.id)}
                          className="absolute -right-2 -top-2 hidden rounded-full bg-white p-1 text-red-500 shadow-sm transition-colors hover:bg-red-50 group-hover:block"
                          title="Xóa ca"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Shift Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-brand-dark">Thêm lịch mới</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Thiết lập ca trực mới hoặc ngày nghỉ cho bác sĩ.
            </p>

            <form className="mt-6 flex flex-col gap-4" onSubmit={handleAddSubmit}>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-dark">Loại lịch</label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as "SCHEDULE" | "LEAVE")}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  <option value="SCHEDULE">Ca làm việc (Schedule)</option>
                  <option value="LEAVE">Ngày nghỉ (Leave)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-brand-dark">Ngày trong tuần</label>
                <select
                  value={selectedDayToAdd}
                  onChange={(e) => setSelectedDayToAdd(Number(e.target.value))}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                >
                  {weekDays.map((day) => (
                    <option key={day.index} value={day.index}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              {shiftType === "SCHEDULE" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-brand-dark">Giờ bắt đầu</label>
                    <input
                      type="time"
                      name="startTime"
                      defaultValue="08:00"
                      required
                      className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-brand-dark">Giờ kết thúc</label>
                    <input
                      type="time"
                      name="endTime"
                      defaultValue="12:00"
                      required
                      className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-brand-dark">Lý do nghỉ</label>
                  <input
                    type="text"
                    name="reason"
                    placeholder="VD: Nghỉ phép thường niên, Có việc gia đình..."
                    required
                    className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  />
                </div>
              )}

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-muted active:scale-[0.98]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark active:scale-[0.98]"
                >
                  Thêm lịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
