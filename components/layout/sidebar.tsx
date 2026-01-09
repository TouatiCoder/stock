"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { usePermissions } from "@/hooks/use-permissions"
import { LayoutDashboard, Package, Calculator, DollarSign, Settings, BarChart3, LogOut, Building } from "lucide-react"
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
      permission: "view_reports" as const,
    },
    {
      label: "Paramètres",
      href: "/settings",
      icon: Settings,
      permission: "view_settings" as const,
    },
  ]

  // Fonction pour obtenir le nom complet
  const getUserFullName = () => {
    if (!user) return "Utilisateur"
    return `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email
  }

  // Fonction pour traduire le rôle
  const getRoleDisplay = () => {
    if (!user?.role) return "Utilisateur"
    
    switch (user.role) {
      case "admin":
        return "Administrateur"
      case "site_manager":
        return "Chef de Chantier"
      case "structural_engineer":
        return "Ingénieur Structure"
      default:
        const roleStr = String(user.role)
      return roleStr.replace("_", " ")
    }
  }

  // Fonction pour obtenir les initiales
  const getUserInitials = () => {
    if (!user) return "U"
    
    const first = user.first_name?.charAt(0) || ""
    const last = user.last_name?.charAt(0) || ""
    
    if (first && last) return `${first}${last}`.toUpperCase()
    if (first) return first.toUpperCase()
    if (user.email) return user.email.charAt(0).toUpperCase()
    
    return "U"
  }

  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      } flex flex-col h-screen sticky top-0`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center w-full" : ""}`}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            {isCollapsed ? (
              <span className="text-white font-bold text-sm">BS</span>
            ) : (
              <Building className="h-5 w-5 text-white" />
            )}
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 truncate">BuildStock Pro</h1>
              <p className="text-xs text-gray-500 truncate">Gestion Construction</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
            aria-label={isCollapsed ? "Agrandir la sidebar" : "Réduire la sidebar"}
          >
            ←
          </button>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          // Si usePermissions n'existe pas encore, on montre tout
          const shouldShow = hasPermission ? hasPermission(item.permission as any) : true
          if (!shouldShow) return null

          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors ${
                isCollapsed ? "justify-center" : ""
              }`}
              title={isCollapsed ? item.label : ""}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {!isCollapsed && user ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{getUserInitials()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{getUserFullName()}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{getRoleDisplay()}</p>
              </div>
            </div>
          </div>
        ) : isCollapsed && user ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">{getUserInitials()}</span>
            </div>
          </div>
        ) : null}

        <button
          onClick={logout}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={isCollapsed ? "Déconnexion" : ""}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  )
}