import { Header } from "@/src/components/layout/header";
import { UsersPageContent } from "@/src/components/admin/users-page-content";

export default function AdminUsersPage() {
  return (
    <>
      <Header title="Nhân sự" description="Tạo tài khoản và phân quyền (Admin, Bác sĩ, Lễ tân)" />
      <UsersPageContent />
    </>
  );
}
