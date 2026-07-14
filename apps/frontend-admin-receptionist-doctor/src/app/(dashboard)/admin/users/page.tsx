import { UsersPageContent } from "@/src/components/admin/personnel";
import { Header } from "@/src/components/layout/header";

export default function AdminUsersPage() {
  return (
    <>
      <Header
        title="Nhan su"
        description="Tao tai khoan va phan quyen (Admin, Bac si, Le tan)"
      />
      <UsersPageContent />
    </>
  );
}
