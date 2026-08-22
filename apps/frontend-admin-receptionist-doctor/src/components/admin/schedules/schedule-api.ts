import apiClient from "@/src/lib/api/client";
import type {
  AvailabilityApprovalStatus,
  AvailabilityResponse,
  Doctor,
  ScheduleFormState,
  ShiftMatrixResponse,
} from "./types";
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

export async function getShiftMatrix() {
  const response = await apiClient.get<ShiftMatrixResponse>(
    "/doctor-availability/matrix",
  );
  return response.data;
}

export async function updateTimeOffApproval(
  id: string,
  approvalStatus: AvailabilityApprovalStatus,
) {
  const response = await apiClient.patch(
    `/doctor-availability/${id}/approval`,
    { approvalStatus },
  );
  return response.data;
}

export async function createDoctorAvailability(
  doctorId: string,
  form: ScheduleFormState,
  businessHours: BusinessHour[],
  force = false,
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

  await apiClient.post(
    "/doctor-availability",
    {
      doctorId,
      recordType: form.recordType,
      dayOfWeek: form.recordType === "DATE_OVERRIDE" ? undefined : form.dayOfWeek,
      specificDate: form.recordType === "DATE_OVERRIDE" ? form.specificDate : undefined,
      startTime: form.recordType === "TIME_OFF" ? (form.startTime || "00:00") : form.startTime,
      endTime: form.recordType === "TIME_OFF" ? (form.endTime || "23:59") : form.endTime,
      reason: form.recordType === "TIME_OFF" ? form.reason : undefined,
    },
    { params: { force: force ? "true" : "false" } },
  );
}

export async function deleteDoctorAvailability(id: string, force = false) {
  await apiClient.delete(`/doctor-availability/${id}`, {
    params: { force: force ? "true" : "false" },
  });
}

