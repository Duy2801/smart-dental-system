import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/features/dashboard/common/toast";
import {
  cancelPatientAppointment,
  type AppointmentItem,
  type PatientAppointmentsData,
} from "../api";
import { getCreateAppointmentErrorMessage } from "../utils";
import { appointmentQueryKeys } from "./useAppointmentQueries";

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  const cancelAppointmentMutation = useMutation({
    mutationFn: cancelPatientAppointment,
    onMutate: async (appointmentId) => {
      await queryClient.cancelQueries({ queryKey: appointmentQueryKeys.all });

      const previousData =
        queryClient.getQueryData<PatientAppointmentsData>(
          appointmentQueryKeys.all,
        );

      if (previousData) {
        const cancelledItem = previousData.upcoming.find(
          (item) => item.id === appointmentId,
        );
        queryClient.setQueryData<PatientAppointmentsData>(
          appointmentQueryKeys.all,
          {
            ...previousData,
            upcoming: previousData.upcoming.filter(
              (item) => item.id !== appointmentId,
            ),
            history: cancelledItem
              ? [
                  { ...cancelledItem, status: "cancelled" as const },
                  ...(previousData.history ?? []),
                ]
              : previousData.history,
          },
        );
      }

      return { previousData };
    },
    onError: (_err, _appointmentId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(appointmentQueryKeys.all, context.previousData);
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all }),
        queryClient.invalidateQueries({
          queryKey: ["patient", "appointment-options"],
        }),
      ]);
    },
  });

  async function cancelAppointment(appointmentId: string) {
    try {
      await cancelAppointmentMutation.mutateAsync(appointmentId);
      toast.success(
        "Hủy lịch thành công",
        "Lịch hẹn đã được hủy sớm và không bị đánh dấu vắng mặt.",
      );
    } catch (error) {
      toast.error(
        "Không thể hủy lịch hẹn",
        getCreateAppointmentErrorMessage(error),
      );
    }
  }

  return {
    cancelAppointment,
    cancellingAppointmentId: cancelAppointmentMutation.variables ?? null,
    isCancelling: cancelAppointmentMutation.isPending,
  };
}
