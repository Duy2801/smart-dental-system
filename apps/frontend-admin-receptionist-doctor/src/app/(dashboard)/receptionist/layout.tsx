import { RoleLayout } from "@/src/components/layout/role-layout";
import { receptionistNavItems } from "@/src/components/layout/nav-config";

export default function ReceptionistLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleLayout title="Lễ tân" items={receptionistNavItems}>
      {children}
    </RoleLayout>
  );
}
