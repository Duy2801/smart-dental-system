import { Header } from "@/src/components/layout/header";
import { FinancePageContent } from "@/src/components/admin/finance-page-content";

export default function AdminFinancePage() {
  return (
    <>
      <Header title="Quản lý tài chính" description="Theo dõi doanh thu theo dịch vụ và thống kê tài chính" />
      <FinancePageContent />
    </>
  );
}
