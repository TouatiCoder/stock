import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/utils/edge-jwt";
import { isExcludedFromSubscriptionEnforcement } from "@/lib/platform-access/routes";

const INTERNAL_PLATFORM_ACCESS_KEY = process.env.INTERNAL_PLATFORM_ACCESS_KEY || "local-platform-access-key";

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/set-password",
  "/invite",
  "/auth",
];

async function evaluateAccessGate(request: NextRequest, payload: { companyId?: string; isPlatformAdmin?: boolean }) {
  const decisionUrl = new URL("/api/internal/platform-access", request.url);

  const response = await fetch(decisionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-platform-access-key": INTERNAL_PLATFORM_ACCESS_KEY,
    },
    body: JSON.stringify({
      companyId: payload.companyId ?? null,
      isPlatformAdmin: Boolean(payload.isPlatformAdmin),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json().catch(() => null) as Promise<
    | {
        allowed: boolean;
        reason: string;
        billingPath: string;
      }
    | null
  >;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("auth-token");
    return response;
  }

  if (isExcludedFromSubscriptionEnforcement(pathname)) {
    return NextResponse.next();
  }

  try {
    const decision = await evaluateAccessGate(request, {
      companyId: payload.companyId,
      isPlatformAdmin: Boolean((payload as any).isPlatformAdmin),
    });

    if (!decision || decision.allowed) {
      return NextResponse.next();
    }

    const redirectUrl = new URL(decision.billingPath || "/billing", request.url);
    redirectUrl.searchParams.set("reason", decision.reason || "subscription_required");
    redirectUrl.searchParams.set("next", pathname);

    const response = NextResponse.redirect(redirectUrl);
    response.headers.set("x-payment-required", "1");
    response.headers.set("x-payment-required-code", "402");
    return response;
  } catch (error) {
    console.error("Subscription enforcement middleware error:", error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};