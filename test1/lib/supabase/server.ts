import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Crée un client Supabase côté serveur pour Server Components
 * Usage: Server Components, Server Actions
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options);
          } catch {
            // ignore en dev si cookies() est readonly
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, "", {
              ...options,
              maxAge: 0,
            });
          } catch {
            // ignore en dev si cookies() est readonly
          }
        },
      },
    }
  );
}

/**
 * Fonction spéciale pour le middleware
 * Usage: middleware.ts uniquement
 */
export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set(name, "", {
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  return { supabase, response };
}

/**
 * Crée un client Supabase pour les API routes
 * Usage: /app/api/*/
 
export function createApiClient() {
  // ✅ CORRECTION : Même pour les API, il faut une config cookies minimale
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // Configuration minimale pour les API routes
        get() {
          return undefined; // Les API n'ont pas besoin de lire les cookies
        },
        set() {
          // Les API ne définissent généralement pas de cookies
        },
        remove() {
          // Les API ne suppriment généralement pas de cookies
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  );
}

/**
 * Alternative : Créer un client simple sans cookies (si l'autre ne fonctionne pas)
 */
export function createApiClientSimple() {
  // Solution alternative sans dépendance à @supabase/ssr
  const { createClient } = require('@supabase/supabase-js');
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  );
}