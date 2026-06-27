import { Header } from "@/src/components/layout/header";
import { PromotionsPageContent } from "@/src/components/admin/promotions-page-content";

export default function AdminPromotionsPage() {
  return (
    <>
      <Header title="Khuyến mãi & Voucher" description="Tạo chương trình khuyến mãi và quản lý voucher cho bệnh nhân" />
      <PromotionsPageContent />
    </>
  );
}
