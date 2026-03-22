import type React from "react"
import { redirect, RedirectType } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/auth-utils'
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { AuthProvider } from "@/lib/mysql/auth-context"
import { TrialSubscriptionPopup } from "@/components/subscription/trial-subscription-popup"

export async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login', RedirectType.replace)
  }

  return (
    <AuthProvider>
      <div className="flex h-screen bg-gray-50">
        <TrialSubscriptionPopup />
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar user={user} />
          <main className="flex-1 overflow-auto">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}
