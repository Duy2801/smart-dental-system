import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function AdminReportsPage() {
  return (
    <>
      <Header title="Báo cáo" description="Báo cáo doanh thu và hoạt động" />
      <PageShell title="Báo cáo tổng hợp" />
    </>
  );
}
