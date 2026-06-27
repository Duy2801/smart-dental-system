import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function TreatmentPlansPage() {
  return (
    <>
      <Header title="Kế hoạch điều trị" description="Lập và theo dõi kế hoạch điều trị" />
      <PageShell title="Danh sách kế hoạch điều trị" />
    </>
  );
}
