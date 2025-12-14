// middleware.ts - Version simplifiée
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  // Juste pour déboguer, pas pour bloquer
  const { supabase } = createMiddlewareClient(request);
  const { data: { session } } = await supabase.auth.getSession();
  
  console.log('Middleware - Session:', {
    hasSession: !!session,
    user: session?.user?.email,
    path: request.nextUrl.pathname
  });

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*']
}