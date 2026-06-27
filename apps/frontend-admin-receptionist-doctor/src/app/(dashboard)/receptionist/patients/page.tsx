import Link from "next/link";
import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";
import { ROUTES } from "@/src/constants/routes";

export default function PatientsPage() {
  return (
    <>
      <Header title="Bệnh nhân" description="Quản lý hồ sơ bệnh nhân" />
      <PageShell title="Danh sách bệnh nhân">
        <Link
          href={ROUTES.RECEPTIONIST.PATIENTS_NEW}
          className="inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Thêm bệnh nhân
        </Link>
      </PageShell>
    </>
  );
}
