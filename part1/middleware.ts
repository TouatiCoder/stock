// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  // ✅ CORRECTION : Utilise directement la fonction qui te donne déjà supabase
  const { supabase, response } = createMiddlewareClient(request);
  
  // ❌ SUPPRIME cette partie qui duplique la création du client :
  // const supabase = createServerClient(...)

  // ------- Récupérer utilisateur actuel -------
  const { data: { user } } = await supabase.auth.getUser();

  // ------- Vérifier s'il existe déjà un admin -------
  let adminExists = false;
  try {
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .eq("role", "admin")
      .limit(1);
    
    adminExists = !!(admins && admins.length > 0);
  } catch (error) {
    console.error("Error checking admin:", error);
    // Continuer sans bloquer en cas d'erreur
  }

  // 🛑 1. Bloquer /auth/signup si un admin existe déjà
  if (adminExists && request.nextUrl.pathname === "/auth/signup") {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // 🚫 2. Empêcher accès dashboard si non connecté
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    // Stocker l'URL originale pour redirection après login
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 🔄 3. Empêcher utilisateur connecté d'aller sur /auth/*
  // SAUF /auth/login?redirect=... (pour la redirection)
  if (user && request.nextUrl.pathname.startsWith("/auth")) {
    // Permettre l'accès si c'est une redirection depuis le middleware
    const isRedirectFromMiddleware = request.nextUrl.searchParams.has("redirect");
    if (!isRedirectFromMiddleware) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

// On protège auth + dashboard
export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*'],
};