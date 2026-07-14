import { Header } from "@/src/components/layout/header";
import { SchedulesPageContent } from "@/src/components/admin/schedules";

export default function AdminSchedulesPage() {
  return (
    <>
      <Header
        title="Lịch làm việc"
        description="Phân ca, lịch làm việc và ngày nghỉ của bác sĩ"
      />
      <SchedulesPageContent />
    </>
  );
}
