import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReceptionistShell } from "@/src/features/support-inbox/ReceptionistShell";
import { receptionistNavItems } from "@/src/components/layout/nav-config";
import { ROLE_HOME, type Role } from "@/src/constants/roles";
import { ROUTES } from "@/src/constants/routes";

function redirectByRole(role?: string) {
  if (role === "RECEPTIONIST") return;
  if (role === "ADMIN" || role === "DOCTOR") {
    redirect(ROLE_HOME[role]);
  }

  redirect(ROUTES.LOGIN);
}

export default async function ReceptionistLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  redirectByRole(cookieStore.get("role")?.value as Role | undefined);

  return (
    <ReceptionistShell title="Lễ tân" items={receptionistNavItems}>
      {children}
    </ReceptionistShell>
  );
}
