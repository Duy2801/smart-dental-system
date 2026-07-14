import { Header } from "@/src/components/layout/header";
import { ServicesPageContent } from "@/src/components/admin/service_pricing";

export default function AdminServicesPage() {
  return (
    <>
      <Header
        title="Dịch vụ & Bảng giá"
        description="Quản lý danh mục dịch vụ nha khoa và thiết lập giá"
      />
      <ServicesPageContent />
    </>
  );
}
