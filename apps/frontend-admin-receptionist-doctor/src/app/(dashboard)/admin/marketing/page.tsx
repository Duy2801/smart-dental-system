import { Header } from "@/src/components/layout/header";
import { MarketingPageContent } from "@/src/components/admin/marketing-page-content";

export default function AdminMarketingPage() {
  return (
    <>
      <Header title="Truyền thông & Marketing" description="Gửi thông báo ưu đãi qua email cho bệnh nhân" />
      <MarketingPageContent />
    </>
  );
}
