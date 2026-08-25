import { AppointmentWorkspace } from "@/features/dashboard/appointment";

type AppointmentPageProps = {
  searchParams: Promise<{ doctorId?: string | string[] }>;
};

export default async function AppointmentPage({
  searchParams,
}: AppointmentPageProps) {
  const params = await searchParams;
  const doctorId = Array.isArray(params.doctorId)
    ? params.doctorId[0]
    : params.doctorId;

  return <AppointmentWorkspace dedicatedDoctorId={doctorId} />;
}
