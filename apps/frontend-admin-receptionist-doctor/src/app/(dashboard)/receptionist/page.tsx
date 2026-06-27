import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function ReceptionistDashboardPage() {
  return (
    <>
      <Header
        title="Tổng quan lễ tân"
        description="Lịch hẹn hôm nay và tiếp nhận bệnh nhân"
      />
      <PageShell
        title="Dashboard lễ tân"
        description="Xem lịch hẹn, check-in và thanh toán nhanh."
      />
    </>
  );
}
