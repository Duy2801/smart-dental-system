import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/src/constants/routes";

function isValidRole(role?: string) {
  return role === "ADMIN" || role === "RECEPTIONIST" || role === "DOCTOR";
}

export default async function DashboardGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const accessToken = cookieStore.get("access_token")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const role = cookieStore.get("role")?.value;

  // Khớp middleware: đủ session + role + ít nhất 1 token.
  // access_token có thể hết hạn sớm; refresh_token còn thì axios sẽ tự refresh.
  if (
    session !== "authenticated" ||
    (!accessToken && !refreshToken) ||
    !isValidRole(role)
  ) {
    redirect(ROUTES.LOGIN);
  }

  return children;
}
