import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function DoctorDashboardPage() {
  return (
    <>
      <Header
        title="Tổng quan bác sĩ"
        description="Lịch khám hôm nay và bệnh nhân đang chờ"
      />
      <PageShell
        title="Dashboard bác sĩ"
        description="Xem lịch, hồ sơ điều trị và kê đơn."
      />
    </>
  );
}
