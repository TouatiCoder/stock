// app/auth/callback/route.ts - VERSION CORRIGÉE
/*import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  try {
    const code = requestUrl.searchParams.get('code')
    
    if (code) {
      // Créer le client avec les cookies
      const cookieStore = await cookies()
      const supabase = createClient()
      
      // Échanger le code contre une session
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error.message)
        
        // Si c'est une erreur de code PKCE, rediriger vers forgot-password
        if (error.message.includes('code verifier')) {
          return NextResponse.redirect(
            new URL('/auth/forgot-password?error=pkce_error', requestUrl.origin)
          )
        }
        
        return NextResponse.redirect(
          new URL('/auth/login?error=auth_failed', requestUrl.origin)
        )
      }
      
      // SUCCÈS : Rediriger vers reset-password
      return NextResponse.redirect(
        new URL('/auth/reset-password', requestUrl.origin)
      )
    }
    
    // Si pas de code, vérifier si c'est une erreur
    const error = requestUrl.searchParams.get('error')
    if (error) {
      return NextResponse.redirect(
        new URL(`/auth/login?error=${error}`, requestUrl.origin)
      )
    }
    
    // Redirection par défaut
    return NextResponse.redirect(
      new URL('/auth/login', requestUrl.origin)
    )
    
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=server_error', requestUrl.origin)
    )
  }
}*/