import type { Role } from "@/src/constants/roles";

const ROLE_PREFIX: Record<Role, string> = {
  ADMIN: "/admin",
  RECEPTIONIST: "/receptionist",
  DOCTOR: "/doctor",
};

export function canAccessRoute(role: Role, pathname: string) {
  return pathname.startsWith(ROLE_PREFIX[role]);
}

export function getRoleFromPath(pathname: string): Role | null {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/receptionist")) return "RECEPTIONIST";
  if (pathname.startsWith("/doctor")) return "DOCTOR";
  return null;
}
