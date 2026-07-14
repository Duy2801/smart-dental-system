import apiClient from "@/src/lib/api/client";
import type { AvailabilityResponse, Doctor, ScheduleFormState } from "./types";

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
) {
  if (form.autoSchedule) {
    await apiClient.post("/doctor-availability/auto-weekly", {
      doctorId,
      daysOfWeek: form.selectedDays,
      shifts: form.autoShifts,
      mode: form.autoMode,
    });
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
