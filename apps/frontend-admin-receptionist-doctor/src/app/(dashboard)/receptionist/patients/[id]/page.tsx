import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <Header title="Chi tiết bệnh nhân" />
      <PageShell title={`Bệnh nhân #${id}`} />
    </>
  );
}
