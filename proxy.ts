import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("pb_token")?.value;

  // Redirect authenticated users away from login
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/homepage", request.url));
  }

  // Redirect unauthenticated users to login
  if (!PUBLIC_PATHS.includes(pathname) && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|public|api).*)"],
};
