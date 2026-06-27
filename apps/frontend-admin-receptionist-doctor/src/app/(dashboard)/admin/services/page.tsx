import { Header } from "@/src/components/layout/header";
import { ServicesPageContent } from "@/src/components/admin/services-page-content";

export default function AdminServicesPage() {
  return (
    <>
      <Header title="Dịch vụ & Bảng giá" description="Quản lý danh mục dịch vụ nha khoa và thiết lập giá" />
      <ServicesPageContent />
    </>
  );
}
