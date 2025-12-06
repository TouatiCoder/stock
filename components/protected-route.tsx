"use client"

import { useAuth } from "@/lib/auth-context"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Chargement...</p>
      </div>
    )
  }

  if (!user) {
    redirect("/login")
  }

  return <>{children}</>
}
