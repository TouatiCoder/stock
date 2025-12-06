"use client"

import { useAuth } from "@/lib/auth-context"
import { Bell, Search } from "lucide-react"

export function TopBar() {
  const { user } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 h-16 px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2 flex-1 max-w-xs">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-transparent border-none outline-none text-sm w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">{user?.name.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
