import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROLE_HOME, type Role } from "@/src/constants/roles";
import { ROUTES } from "@/src/constants/routes";
import { canAccessRoute } from "@/src/lib/auth/permissions";

const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.FORGOT_PASSWORD];
const AUTH_COOKIE_NAMES = [
  "access_token",
  "refresh_token",
  "role",
  "session",
  "user_info",
];

function isValidRole(role?: string): role is Role {
  return role === "ADMIN" || role === "RECEPTIONIST" || role === "DOCTOR";
}

function clearAuthCookies(response: NextResponse) {
  AUTH_COOKIE_NAMES.forEach((name) => response.cookies.delete(name));
  return response;
}

function decodeJwtPayload(token: string): { sub?: string; exp?: number; tokenType?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr =
      typeof Buffer !== "undefined"
        ? Buffer.from(base64, "base64").toString("utf-8")
        : decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}


export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("role")?.value;
  const session = request.cookies.get("session")?.value;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  let isTokenValid = false;
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    if (payload && payload.sub && payload.tokenType === "access") {
      isTokenValid = true;
    }
  } else if (refreshToken) {
    const payload = decodeJwtPayload(refreshToken);
    if (payload && payload.sub && payload.tokenType === "refresh") {
      isTokenValid = true;
    }
  }

  const isAuthenticated =
    session === "authenticated" &&
    isTokenValid &&
    isValidRole(role);

  if (
    PUBLIC_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`),
    )
  ) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
    }

    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return clearAuthCookies(NextResponse.redirect(loginUrl));
  }

  if (!canAccessRoute(role, pathname)) {
    return NextResponse.redirect(new URL(ROLE_HOME[role], request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

