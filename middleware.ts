import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest, SESSION_COOKIE } from "@/lib/session";

const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  const session = await getSessionFromRequest(request);

  if (!isPublic && !session) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (hasSessionCookie) {
      response.cookies.delete(SESSION_COOKIE);
    }
    return response;
  }

  if (isPublic && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();
  if (isPublic && hasSessionCookie && !session) {
    response.cookies.delete(SESSION_COOKIE);
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};
