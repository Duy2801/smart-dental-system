import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RoleLayout } from "@/src/components/layout/role-layout";
import { doctorNavItems } from "@/src/components/layout/nav-config";
import { ROLE_HOME, type Role } from "@/src/constants/roles";
import { ROUTES } from "@/src/constants/routes";

function redirectByRole(role?: string) {
  if (role === "DOCTOR") return;
  if (role === "ADMIN" || role === "RECEPTIONIST") {
    redirect(ROLE_HOME[role]);
  }

  redirect(ROUTES.LOGIN);
}

export default async function DoctorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  redirectByRole(cookieStore.get("role")?.value as Role | undefined);

  return (
    <RoleLayout title="Bác sĩ" items={doctorNavItems}>
      {children}
    </RoleLayout>
  );
}
