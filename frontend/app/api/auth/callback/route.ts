// @/app/auth/callback/route.ts - VERSION SIMPLIFIÉE
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/dashboard";

    if (code) {
      // Créer le client Supabase directement
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              // Les cookies seront gérés dans la réponse
            },
          },
        }
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error) {
        // Rediriger vers la page demandée
        return NextResponse.redirect(new URL(next, origin));
      }
      
      console.error("Auth error:", error);
    }

    // En cas d'erreur ou pas de code
    return NextResponse.redirect(new URL("/auth/login?error=auth_failed", origin));
    
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(new URL("/auth/login?error=internal", request.url));
  }
}