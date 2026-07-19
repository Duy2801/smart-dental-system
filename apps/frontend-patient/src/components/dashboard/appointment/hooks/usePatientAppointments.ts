import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPatientAppointments } from "../api";

export function usePatientAppointments(isLoggedIn: boolean) {
  const patientAppointmentsQuery = useQuery({
    queryKey: ["patient", "appointments"],
    queryFn: getPatientAppointments,
    enabled: isLoggedIn,
  });

  const upcoming = useMemo(
    () => patientAppointmentsQuery.data?.upcoming ?? [],
    [patientAppointmentsQuery.data?.upcoming],
  );
  const historyItems = useMemo(
    () => patientAppointmentsQuery.data?.history ?? [],
    [patientAppointmentsQuery.data?.history],
  );
  const appointments = useMemo(
    () => [...upcoming, ...historyItems],
    [historyItems, upcoming],
  );

  return {
    patientAppointmentsQuery,
    upcoming,
    historyItems,
    appointments,
  };
}
