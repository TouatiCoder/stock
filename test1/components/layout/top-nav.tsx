"use client"

import type { User } from "@/lib/types"
import { Bell, Menu } from "lucide-react"

interface TopNavProps {
  user: User
}

export function TopNav({ user }: TopNavProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100 rounded-lg">
          <Menu size={20} className="text-slate-600" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100 rounded-lg relative">
          <Bell size={20} className="text-slate-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
