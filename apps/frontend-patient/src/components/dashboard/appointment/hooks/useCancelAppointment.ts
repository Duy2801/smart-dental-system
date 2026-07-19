import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/dashboard/common/toast";
import { cancelPatientAppointment } from "../api";
import { getCreateAppointmentErrorMessage } from "../utils";

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  const cancelAppointmentMutation = useMutation({
    mutationFn: cancelPatientAppointment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["patient", "appointments"] }),
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
        "Huy lich thanh cong",
        "Lich hen da duoc huy som va khong bi danh dau vang mat.",
      );
    } catch (error) {
      toast.error(
        "Khong the huy lich hen",
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
