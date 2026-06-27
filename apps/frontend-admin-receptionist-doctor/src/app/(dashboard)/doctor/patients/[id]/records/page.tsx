import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function TreatmentRecordsPage({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <Header title="Hồ sơ điều trị" />
      <PageShell title={`Hồ sơ điều trị - BN #${id}`} />
    </>
  );
}
