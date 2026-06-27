import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function CheckInPage() {
  return (
    <>
      <Header title="Tiếp nhận" description="Check-in bệnh nhân đến khám" />
      <PageShell title="Danh sách chờ tiếp nhận" />
    </>
  );
}
