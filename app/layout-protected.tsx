"use client"

import type React from "react"

import { AuthProvider } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto">
              <div className="p-6">{children}</div>
            </main>
          </div>
        </div>
      </ProtectedRoute>
    </AuthProvider>
  )
}
