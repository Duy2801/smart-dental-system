import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function AdminDashboardPage() {
  return (
    <>
      <Header
        title="Tổng quan quản trị"
        description="Theo dõi hoạt động phòng khám và quản lý hệ thống"
      />
      <PageShell
        title="Dashboard"
        description="Thống kê người dùng, bác sĩ, dịch vụ và báo cáo."
      />
    </>
  );
}
