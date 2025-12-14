// lib/supabase/client.ts
"use client"

import { createBrowserClient } from "@supabase/ssr"
import { useMemo } from "react"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseClient
}

// Hook React pour utiliser dans les composants
export function useSupabaseClient() {
  return useMemo(() => getSupabaseClient(), [])
}