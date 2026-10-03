// middleware.ts (di root project, sejajar dengan app/)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rute publik
  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Untuk rute lain, kita biarkan AuthGuard di client yang handle
  // (karena session disimpan di localStorage)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};