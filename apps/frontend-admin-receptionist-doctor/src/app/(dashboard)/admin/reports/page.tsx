import { Header } from "@/src/components/layout/header";
import { ReportsPageContent } from "@/src/components/admin/report";

export default function AdminReportsPage() {
  return (
    <>
      <Header
        title="Báo cáo"
        description="Xuất báo cáo tài chính, lịch hẹn ra PDF/Excel"
      />
      <ReportsPageContent />
    </>
  );
}
