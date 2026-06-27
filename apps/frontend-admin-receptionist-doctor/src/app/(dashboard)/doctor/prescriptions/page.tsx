import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function PrescriptionsPage() {
  return (
    <>
      <Header title="Đơn thuốc" description="Quản lý đơn thuốc bệnh nhân" />
      <PageShell title="Danh sách đơn thuốc" />
    </>
  );
}
