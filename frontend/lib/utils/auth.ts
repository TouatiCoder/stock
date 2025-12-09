// lib/utils/auth.ts (corrigé)
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    // NE PAS utiliser .single() si la table users est vide
    const { data: dbUsers } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id);
    
    if (dbUsers && dbUsers.length > 0) {
      return dbUsers[0];
    }
    
    // Fallback aux données d'authentification
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      role: user.user_metadata?.role || "user",
    };
    
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}
export async function requireRole(requiredRole: string) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      throw new Error("Unauthorized: Please log in")
    }
    
    if (user.role !== requiredRole) {
      throw new Error(`Forbidden: Requires ${requiredRole} role`)
    }
    
    return user
    
  } catch (error) {
    console.error("Error in requireRole:", error)
    throw error
  }
}
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized: Please log in")
  }
  return user
}