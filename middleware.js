import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session_token")?.value;

  // Public routes
  if (pathname === "/login" || pathname.startsWith("/api/auth/login")) {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch {
        // Invalid token, continue to login
      }
    }
    return NextResponse.next();
  }

  // Protected routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/transfer") ||
    pathname.startsWith("/api/notifications") ||
    pathname.startsWith("/api/verification")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Admin-only routes
      if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        if (payload.role !== "admin") {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }

      // Attach user info to headers for API routes
      const response = NextResponse.next();
      response.headers.set("x-user-id", payload.id);
      response.headers.set("x-user-role", payload.role);
      response.headers.set("x-account-id", payload.account_id);
      return response;
    } catch {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/transfer/:path*",
    "/api/notifications/:path*",
    "/api/verification/:path*",
  ],
};
