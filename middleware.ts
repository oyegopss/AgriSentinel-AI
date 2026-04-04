/**
 * middleware.ts — Next.js Edge Middleware
 * Protects all non-public routes by checking for a Firebase session cookie.
 * Public routes: /, /auth
 * Protected routes: /dashboard, /analytics, /advisor, /profile,
 *   /disease-detection, /yield-prediction, /mandi-intelligence, /voice-assistant
 */

import { NextRequest, NextResponse } from "next/server";

// Routes that don't require auth
const PUBLIC_PATHS = new Set(["/", "/auth"]);

// Prefixes that don't require auth (static assets, API routes, _next internals)
const PUBLIC_PREFIXES = ["/_next", "/favicon", "/api/public", "/public"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // Allow all file extensions (images, fonts, etc)
  if (/\.\w{2,5}$/.test(pathname)) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // Check for Firebase session cookie (written by AuthProvider on login)
  const session = request.cookies.get("__session")?.value;

  if (!session) {
    // Redirect unauthenticated users to /auth, preserving intended destination
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static Next.js internals
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
