import { RoleLayout } from "@/src/components/layout/role-layout";
import { doctorNavItems } from "@/src/components/layout/nav-config";

export default function DoctorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RoleLayout title="Bác sĩ" items={doctorNavItems}>
      {children}
    </RoleLayout>
  );
}
