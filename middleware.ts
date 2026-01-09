import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Pages publiques
  const publicPaths = [
    "/", 
    "/login",
    "/signup",
    "/forgot-password",
    "/auth/callback",
    "/auth/reset-password",
    "/invite",
  ]

  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  )

  if (isPublic) {
    return NextResponse.next()
  }

  // 🔐 Pas de blocage ici, auth gérée côté app
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.*|apple-icon.*).*)",
  ],
}
