import apiClient from "@/src/lib/api/client";
import type { AvailabilityResponse, Doctor, ScheduleFormState } from "./types";
import type { BusinessHour } from "../setting/types";

export async function getDoctors() {
  const response = await apiClient.get<Doctor[]>("/doctors");
  return response.data;
}

export async function getDoctorAvailability(doctorId: string) {
  const response = await apiClient.get<AvailabilityResponse>(
    "/doctor-availability",
    { params: { doctorId } },
  );
  return response.data;
}

export async function createDoctorAvailability(
  doctorId: string,
  form: ScheduleFormState,
  businessHours: BusinessHour[],
) {
  if (form.autoSchedule) {
    const selectedOpenDays = form.selectedDays
      .map((dayId) => businessHours.find((day) => day.id === dayId))
      .filter((day): day is BusinessHour => Boolean(day?.isOpen));

    if (selectedOpenDays.length === 0) {
      throw new Error("availability.no_open_days_selected");
    }

    const groupedByHours = selectedOpenDays.reduce<
      Record<string, BusinessHour[]>
    >((groups, day) => {
      const key = `${day.start}-${day.end}`;
      return {
        ...groups,
        [key]: [...(groups[key] ?? []), day],
      };
    }, {});

    await Promise.all(
      Object.values(groupedByHours).map((days) =>
        apiClient.post("/doctor-availability/auto-weekly", {
          doctorId,
          daysOfWeek: days.map((day) => day.id),
          shifts: [{ startTime: days[0].start, endTime: days[0].end }],
          mode: form.autoMode,
        }),
      ),
    );
    return;
  }

  await apiClient.post("/doctor-availability", {
    doctorId,
    recordType: form.recordType,
    dayOfWeek: form.dayOfWeek,
    startTime: form.recordType === "WEEKLY" ? form.startTime : "00:00",
    endTime: form.recordType === "WEEKLY" ? form.endTime : "23:59",
    reason: form.recordType === "TIME_OFF" ? form.reason : undefined,
  });
}

export async function deleteDoctorAvailability(id: string) {
  await apiClient.delete(`/doctor-availability/${id}`);
}
