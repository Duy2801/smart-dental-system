import { Header } from "@/src/components/layout/header";
import { PatientsPageContent } from "@/src/components/admin/patients/patients-page-content";

export default function AdminPatientsPage() {
  return (
    <>
      <Header
        title="Bệnh nhân"
        description="Danh sách bệnh nhân đã tới khám và lịch sử khám tại phòng khám"
      />
      <PatientsPageContent />
    </>
  );
}
