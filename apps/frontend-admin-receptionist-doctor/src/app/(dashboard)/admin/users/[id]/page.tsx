import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <Header title="Chi tiết người dùng" />
      <PageShell title={`Người dùng #${id}`} />
    </>
  );
}
