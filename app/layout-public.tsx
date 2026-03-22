import type React from "react"
import { AuthProvider } from "@/lib/mysql/auth-context"

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}