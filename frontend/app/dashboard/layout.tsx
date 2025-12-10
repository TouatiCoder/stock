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
  // Vérifiez que cette fonction est appelée
  console.log("🎨 DashboardLayout: Executing...")
  
  const user = await getCurrentUser()
  console.log("👤 Layout user:", user ? user.email : "null")
  
  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* DEBUG: Ajoutez une bordure rouge pour voir */}
      <div className="border-4 border-red-500">
        <Sidebar user={user} />
      </div>
      
      <div className="flex-1 flex flex-col">
        {/* DEBUG: Ajoutez une bordure bleue pour voir */}
        <div className="border-4 border-blue-500">
          <TopNav user={user} />
        </div>
        
        <main className="flex-1 overflow-auto p-6 bg-green-100">
          {/* DEBUG: Zone visible */}
          <div className="mb-4 p-4 bg-yellow-200 rounded">
            <h2 className="font-bold">DEBUG: Layout is working!</h2>
            <p>Sidebar (red border) and TopNav (blue border) should be visible above</p>
          </div>
          
          {children} {/* Votre DashboardContent va ici */}
        </main>
      </div>
    </div>
  )
}