import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/features/dashboard/common/toast";
import {
  reschedulePatientAppointment,
  type AppointmentItem,
} from "../api";
import { getCreateAppointmentErrorMessage, pickFirstBookableDate } from "../utils";
import {
  appointmentQueryKeys,
  useAppointmentRescheduleOptionsQuery,
} from "./useAppointmentQueries";

type UseRescheduleAppointmentParams = {
  appointment: AppointmentItem | null;
  onClose: () => void;
};

export function useRescheduleAppointment({
  appointment,
  onClose,
}: UseRescheduleAppointmentParams) {
  const queryClient = useQueryClient();

  // Initialize selectedDateId with appointment.dateId so API loads for that date immediately
  const initialDateId = appointment?.dateId ?? "";
  const [selectedDateId, setSelectedDateId] = useState(initialDateId);
  const [selectedTime, setSelectedTime] = useState("");

  // Sync date and clear time whenever appointment changes
  useEffect(() => {
    setSelectedDateId(appointment?.dateId ?? "");
    setSelectedTime("");
  }, [appointment?.id, appointment?.dateId]);

  const activeDateId = selectedDateId || appointment?.dateId || "";

  const rescheduleParams = useMemo(
    () => ({
      appointmentId: appointment?.id,
      serviceId: appointment?.serviceId,
      doctorId: appointment?.doctorId,
      date: activeDateId,
    }),
    [appointment?.doctorId, appointment?.id, appointment?.serviceId, activeDateId],
  );

  const optionsQuery = useAppointmentRescheduleOptionsQuery(rescheduleParams);

  const dates = useMemo(() => optionsQuery.data?.dates ?? [], [optionsQuery.data?.dates]);
  const timeSlots = useMemo(
    () => optionsQuery.data?.timeSlots ?? [],
    [optionsQuery.data?.timeSlots],
  );

  // Auto pick first available date if selectedDateId is empty or invalid
  useEffect(() => {
    if (dates.length > 0 && (!selectedDateId || !dates.some((d) => d.id === selectedDateId && d.isOpen))) {
      const firstAvailable = pickFirstBookableDate(dates)?.id ?? dates[0]?.id;
      if (firstAvailable && firstAvailable !== selectedDateId) {
        setSelectedDateId(firstAvailable);
      }
    }
  }, [dates, selectedDateId]);

  const defaultDateId = pickFirstBookableDate(dates)?.id ?? dates[0]?.id ?? "";
  const resolvedDateId = selectedDateId || defaultDateId;
  const resolvedTime = selectedTime || timeSlots[0] || "";

  const canReschedule =
    Boolean(appointment) &&
    (appointment?.rescheduleCount ?? 0) < 1 &&
    dates.some((date) => date.isOpen);

  const mutation = useMutation({
    mutationFn: ({
      appointmentId,
      scheduledAt,
    }: {
      appointmentId: string;
      scheduledAt: string;
    }) => reschedulePatientAppointment(appointmentId, { scheduledAt }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: ["patient", "appointment-options"],
        }),
      ]);
    },
  });

  async function confirmReschedule() {
    if (!appointment) return;
    if (!canReschedule) {
      toast.error(
        "Không thể đổi lịch",
        "Cuộc hẹn này đã vượt giới hạn đổi lịch hoặc không còn khung giờ phù hợp.",
      );
      return;
    }

    if (!resolvedDateId || !resolvedTime) {
      toast.error(
        "Thiếu thông tin đổi lịch",
        "Vui lòng chọn ngày và giờ mới.",
      );
      return;
    }

    try {
      await mutation.mutateAsync({
        appointmentId: appointment.id,
        scheduledAt: new Date(`${resolvedDateId}T${resolvedTime}:00`).toISOString(),
      });
      toast.success(
        "Đổi lịch thành công",
        "Khung giờ cũ đã được giải phóng và lịch mới đã được giữ chỗ.",
      );
      onClose();
    } catch (error) {
      toast.error("Không thể đổi lịch", getCreateAppointmentErrorMessage(error));
    }
  }

  return {
    dates,
    timeSlots,
    slotIntervalMinutes: optionsQuery.data?.slotIntervalMinutes ?? 30,
    selectedDateId: resolvedDateId,
    selectedTime: resolvedTime,
    setSelectedDateId,
    setSelectedTime,
    confirmReschedule,
    isSubmitting: mutation.isPending,
    canReschedule,
    rescheduleCount: appointment?.rescheduleCount ?? 0,
  };
}
