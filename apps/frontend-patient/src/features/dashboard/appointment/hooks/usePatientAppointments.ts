import { useMemo } from "react";
import { usePatientAppointmentsQuery } from "./useAppointmentQueries";

export function usePatientAppointments(isLoggedIn: boolean) {
  const patientAppointmentsQuery = usePatientAppointmentsQuery(isLoggedIn);

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
