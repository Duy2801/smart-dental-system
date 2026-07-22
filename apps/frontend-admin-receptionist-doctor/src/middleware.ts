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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get("role")?.value;
  const session = request.cookies.get("session")?.value;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  // Coi là đã xác thực nếu còn session hợp lệ + ít nhất 1 trong 2 token còn tồn tại.
  // access_token chết sau 15-20 phút nhưng refresh_token còn 7 ngày — axios interceptor
  // sẽ tự refresh khi API trả 401, không cần đá user ra ở đây.
  const isAuthenticated =
    session === "authenticated" &&
    (Boolean(accessToken) || Boolean(refreshToken)) &&
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
