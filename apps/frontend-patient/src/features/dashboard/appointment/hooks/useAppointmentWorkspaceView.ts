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
  // Deduplicate and combine all appointments (upcoming + history)
  const allAppointments = useMemo(() => {
    const map = new Map<string, AppointmentItem>();
    [...upcoming, ...historyItems].forEach((item) => {
      map.set(item.id, item);
    });
    return Array.from(map.values());
  }, [upcoming, historyItems]);

  const filteredAppointments = useMemo(
    () =>
      allAppointments
        .filter(
          (item) => statusFilter === "all" || item.status === statusFilter,
        )
        .filter((item) =>
          `${item.doctor} ${item.service} ${item.patientName || ""}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    [allAppointments, query, statusFilter],
  );

  const filteredUpcoming = useMemo(
    () =>
      upcoming
        .filter(
          (item) => statusFilter === "all" || item.status === statusFilter,
        )
        .filter((item) =>
          `${item.doctor} ${item.service}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    [upcoming, query, statusFilter],
  );

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
    filteredAppointments,
    filteredUpcoming,
    history,
    current,
  };
}
