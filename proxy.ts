import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "evconn_session";

// Inline token verification so proxy.ts is self-contained for the Edge runtime
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-secret-change-in-production",
);

type Role = "super_admin" | "assistant" | "student" | "guest";

interface Payload {
  sub: string;
  role: Role;
  mustChangePassword: boolean;
}

async function getPayload(token: string): Promise<Payload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as Payload;
  } catch {
    return null;
  }
}

function clearSession(response: NextResponse): NextResponse {
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow Next.js internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;

  // ─── Admin routes: super_admin only ────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = await getPayload(token);
    if (!payload) {
      return clearSession(
        NextResponse.redirect(new URL("/login", request.url)),
      );
    }
    if (payload.mustChangePassword) {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }
    if (payload.role !== "super_admin") {
      return NextResponse.redirect(new URL("/lms/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // ─── LMS routes: any authenticated user ────────────────────────────────────
  if (pathname.startsWith("/lms")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const payload = await getPayload(token);
    if (!payload) {
      return clearSession(
        NextResponse.redirect(new URL("/login", request.url)),
      );
    }
    if (payload.mustChangePassword) {
      return NextResponse.redirect(new URL("/change-password", request.url));
    }
    return NextResponse.next();
  }

  // ─── Change-password: require auth ─────────────────────────────────────────
  if (pathname === "/change-password") {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const payload = await getPayload(token);
    if (!payload) {
      return clearSession(
        NextResponse.redirect(new URL("/login", request.url)),
      );
    }
    return NextResponse.next();
  }

  // ─── Auth pages: redirect away if already logged in ────────────────────────
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      const payload = await getPayload(token);
      if (payload) {
        if (payload.mustChangePassword) {
          return NextResponse.redirect(
            new URL("/change-password", request.url),
          );
        }
        if (payload.role === "super_admin") {
          return NextResponse.redirect(
            new URL("/admin/dashboard", request.url),
          );
        }
        return NextResponse.redirect(new URL("/lms/dashboard", request.url));
      }
    }
    return NextResponse.next();
  }

  // Public paths — no auth required
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
