import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { RoleLayout } from "@/src/components/layout/role-layout";
import { adminNavItems } from "@/src/components/layout/nav-config";
import { ROLE_HOME, type Role } from "@/src/constants/roles";
import { ROUTES } from "@/src/constants/routes";

function redirectByRole(role?: string) {
  if (role === "ADMIN") return;
  if (role === "RECEPTIONIST" || role === "DOCTOR") {
    redirect(ROLE_HOME[role]);
  }

  redirect(ROUTES.LOGIN);
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  redirectByRole(cookieStore.get("role")?.value as Role | undefined);

  return (
    <RoleLayout title="Quản trị" items={adminNavItems}>
      {children}
    </RoleLayout>
  );
}
