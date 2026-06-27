import { RoleLayout } from "@/src/components/layout/role-layout";
import { adminNavItems } from "@/src/components/layout/nav-config";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleLayout title="Quản trị" items={adminNavItems}>
      {children}
    </RoleLayout>
  );
}
