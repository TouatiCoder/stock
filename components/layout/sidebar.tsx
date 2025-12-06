"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/hooks/use-permissions"
import { LayoutDashboard, Package, Calculator, DollarSign, Settings, BarChart3, LogOut } from "lucide-react"
import { useState } from "react"

export function Sidebar() {
  const { user, logout } = useAuth()
  const { hasPermission } = usePermissions()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    {
      label: "Tableau de Bord",
      href: "/dashboard",
      icon: LayoutDashboard,
      permission: "view_dashboard" as const,
    },
    {
      label: "Gestion de Stock",
      href: "/inventory",
      icon: Package,
      permission: "view_inventory" as const,
    },
    {
      label: "Calculs Structurels",
      href: "/projects",
      icon: Calculator,
      permission: "view_projects" as const,
    },
    {
      label: "Gestion des Coûts",
      href: "/costs",
      icon: DollarSign,
      permission: "view_costs" as const,
    },
    {
      label: "Rapports",
      href: "/reports",
      icon: BarChart3,
      permission: "view_dashboard" as const,
    },
    {
      label: "Paramètres",
      href: "/settings",
      icon: Settings,
      permission: "view_settings" as const,
    },
  ]

  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"} flex flex-col`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BS</span>
            </div>
            <span className="font-bold text-gray-900">BuildStock</span>
          </div>
        )}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 hover:bg-gray-100 rounded-lg">
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          if (!hasPermission(item.permission as any)) return null

          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title={isCollapsed ? item.label : ""}
            >
              <Icon size={20} />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {!isCollapsed && user && (
          <div className="text-xs">
            <p className="font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-gray-500 truncate">{user.email}</p>
            <p className="text-xs text-blue-600 capitalize mt-1">
              {user.role === "admin"
                ? "Administrateur"
                : user.role === "supervisor"
                  ? "Chef de Chantier"
                  : "Ingénieur Structure"}
            </p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={18} />
          {!isCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}
