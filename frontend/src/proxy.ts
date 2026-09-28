import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes accessible ONLY by unauthenticated (guest) users
const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

// Routes accessible ONLY by authenticated users
const PROTECTED_PREFIXES = ["/home", "/my-forms", "/org-settings", "/profile", "/create-org"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve session token using better-auth helper and standard cookie lookups
  const sessionToken =
    getSessionCookie(request) ||
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const hasSession = Boolean(sessionToken);

  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Root path ("/") routing
  if (pathname === "/") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // 1. Private route check: Redirect unauthenticated users to /sign-in
  if (isProtectedRoute && !hasSession) {
    const signInUrl = new URL("/sign-in", request.url);
    // Optionally preserve the attempted path for post-login redirect
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 2. Guest-only route check: Redirect authenticated users to /home
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

// Backward compatibility alias if needed
export const middleware = proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - image assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
