import { useMemo } from "react";
import type { AppointmentItem, AppointmentStatus } from "../api";
import type { CurrentAppointment } from "../types";
import { appointmentStatusLabels } from "../utils";

type UseAppointmentWorkspaceViewParams = {
  upcoming: AppointmentItem[];
  historyItems: AppointmentItem[];
  query: string;
  statusFilter: AppointmentStatus | "all";
};

export function useAppointmentWorkspaceView({
  upcoming,
  historyItems,
  query,
  statusFilter,
}: UseAppointmentWorkspaceViewParams) {
  const history = useMemo(
    () =>
      historyItems
        .filter(
          (item) => statusFilter === "all" || item.status === statusFilter,
        )
        .filter((item) =>
          `${item.doctor} ${item.service}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    [historyItems, query, statusFilter],
  );

  const current: CurrentAppointment | null = useMemo(
    () =>
      upcoming[0]
        ? {
            service: upcoming[0].service,
            date: upcoming[0].date,
            time: upcoming[0].time,
            doctor: upcoming[0].doctor,
            status: appointmentStatusLabels[upcoming[0].status],
          }
        : null,
    [upcoming],
  );

  return {
    history,
    current,
  };
}
