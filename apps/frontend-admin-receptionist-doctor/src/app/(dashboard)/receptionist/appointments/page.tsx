import Link from "next/link";
import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";
import { ROUTES } from "@/src/constants/routes";

export default function AppointmentsPage() {
  return (
    <>
      <Header title="Lịch hẹn" description="Quản lý lịch hẹn bệnh nhân" />
      <PageShell title="Danh sách lịch hẹn">
        <Link
          href={ROUTES.RECEPTIONIST.APPOINTMENTS_NEW}
          className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Đặt lịch mới
        </Link>
      </PageShell>
    </>
  );
}
