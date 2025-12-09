// app/dashboard/layout.tsx
import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/utils/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar user={user} />
      
      <div className="flex-1 flex flex-col">
        <TopNav user={user} />
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}