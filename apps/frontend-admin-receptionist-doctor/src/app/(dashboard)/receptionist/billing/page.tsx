import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function BillingPage() {
  return (
    <>
      <Header title="Thanh toán" description="Quản lý hóa đơn và thu phí" />
      <PageShell title="Danh sách thanh toán" />
    </>
  );
}
