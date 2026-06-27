import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function AdminDoctorsPage() {
  return (
    <>
      <Header title="Bác sĩ" description="Quản lý hồ sơ bác sĩ" />
      <PageShell title="Danh sách bác sĩ" />
    </>
  );
}
