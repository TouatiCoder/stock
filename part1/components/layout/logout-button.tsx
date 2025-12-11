"use client"

import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="w-full justify-start gap-2 text-slate-300 hover:bg-slate-800"
    >
      <LogOut size={20} />
      <span>Sign Out</span>
    </Button>
  )
}
