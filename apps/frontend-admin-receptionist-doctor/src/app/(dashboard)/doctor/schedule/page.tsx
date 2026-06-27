import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function DoctorSchedulePage() {
  return (
    <>
      <Header title="Lịch khám" description="Lịch làm việc và ca khám" />
      <PageShell title="Lịch khám hôm nay" />
    </>
  );
}
