import { Header } from "@/src/components/layout/header";
import { PageShell } from "@/src/components/shared/page-shell";

export default function AdminUsersPage() {
  return (
    <>
      <Header title="Người dùng" description="Quản lý tài khoản hệ thống" />
      <PageShell title="Danh sách người dùng" />
    </>
  );
}
