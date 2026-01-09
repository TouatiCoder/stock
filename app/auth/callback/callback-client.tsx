"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

export default function CallbackClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const code = searchParams.get("code")

    if (!code) {
      router.replace("/login")
      return
    }

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    supabase.auth
      .exchangeCodeForSession(code)
      .then(() => {
        router.replace("/dashboard")
      })
      .catch(() => {
        router.replace("/login")
      })
  }, [searchParams, router])

  return <div>Connexion en cours...</div>
}
