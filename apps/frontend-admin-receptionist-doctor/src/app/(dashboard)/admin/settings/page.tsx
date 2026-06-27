import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function AdminSettingsPage() {
  return (
    <>
      <Header title="Cài đặt" description="Cấu hình hệ thống phòng khám" />
      <PageShell title="Cài đặt chung" />
    </>
  );
}
