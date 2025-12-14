// @/lib/supabase/route.ts - NOUVEAU FICHIER
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// OU version encore plus simple :
export function createRouteHandlerClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Array.from(request.cookies.getAll());
        },
        setAll(cookiesToSet) {
          // Les cookies seront gérés par NextResponse
        },
      },
    }
  );
}