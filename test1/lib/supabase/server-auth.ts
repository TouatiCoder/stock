// @/lib/supabase/server-auth.ts - VERSION CORRIGÉE
import { createClient } from "@/lib/supabase/server"

export async function getServerUser() {
  try {
    const supabase = await createClient()
    
    // UTILISER getUser() au lieu de getSession()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log("No auth user found:", authError?.message)
      return null
    }
    
    console.log("Auth user found:", user.email)
    
    // Récupérer depuis la table users
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    
    if (dbError) {
      console.warn("Error fetching user from DB:", dbError.message)
    }
    
    // Retourner l'utilisateur complet
    if (dbUser) {
      console.log("DB user found:", dbUser.email)
      return dbUser
    }
    
    // Fallback aux données Auth
    console.log("Using auth data for user")
    return {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role: user.user_metadata?.role || 'user',
      phone: null,
      avatar_url: null,
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
    }
    
  } catch (error) {
    console.error("Error in getServerUser:", error)
    return null
  }
}