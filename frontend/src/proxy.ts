import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Routes accessible ONLY by unauthenticated (guest) users
const AUTH_ROUTES = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

// Routes accessible ONLY by authenticated users
const PROTECTED_PREFIXES = [
  "/home",
  "/my-forms",
  "/forms",
  "/form",
  "/responses",
  "/org-settings",
  "/profile",
  "/create-org",
  "/accept-invitation",
];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

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
    // Preserve the full attempted path including search params (e.g. ?id=...) for post-login redirect
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  // 2. Guest-only route check: Redirect authenticated users to callbackUrl (if present) or /home
  if (isAuthRoute && hasSession) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl) {
      try {
        const redirectUrl = new URL(callbackUrl, request.url);
        // Ensure redirect stays within same origin to prevent open-redirect vulnerabilities
        if (redirectUrl.origin === request.nextUrl.origin) {
          return NextResponse.redirect(redirectUrl);
        }
      } catch {
        // Fall back to /home on invalid URL
      }
    }
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
