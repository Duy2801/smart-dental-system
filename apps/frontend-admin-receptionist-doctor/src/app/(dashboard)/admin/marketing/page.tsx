import { Header } from "@/src/components/layout/header";
import { MarketingPageContent } from "@/src/components/admin/marketing";

export default function AdminMarketingPage() {
  return (
    <>
      <Header
        title="Truyền thông & Banner Quảng cáo"
        description="Quản lý chiến dịch quảng cáo và banner truyền thông hiển thị trên hệ thống nha khoa"
      />
      <MarketingPageContent />
    </>
  );
}
