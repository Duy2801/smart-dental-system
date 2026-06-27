import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function AdminServicesPage() {
  return (
    <>
      <Header title="Dịch vụ" description="Quản lý dịch vụ nha khoa" />
      <PageShell title="Danh sách dịch vụ" />
    </>
  );
}
