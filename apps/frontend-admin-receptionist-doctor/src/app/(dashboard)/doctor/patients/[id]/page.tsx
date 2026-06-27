import Link from "next/link";
import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function DoctorPatientDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <Header title="Hồ sơ bệnh nhân" />
      <PageShell title={`Bệnh nhân #${id}`}>
        <Link
          href={`/doctor/patients/${id}/records`}
          className="inline-flex rounded-lg border border-brand px-4 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand-light"
        >
          Xem hồ sơ điều trị
        </Link>
      </PageShell>
    </>
  );
}
