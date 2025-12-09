"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { User } from "@/lib/types"
import { LogoutButton } from "./logout-button"
import { Home, Package, Calculator, DollarSign, Users, Settings } from "lucide-react"

interface SidebarProps {
  user: User
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const menuItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard", roles: ["admin", "chef_de_chantier", "ingenieur_structure"] },
    {
      href: "/dashboard/projects",
      icon: Home,
      label: "Projects",
      roles: ["admin", "chef_de_chantier", "ingenieur_structure"],
    },
    { href: "/dashboard/inventory", icon: Package, label: "Inventory", roles: ["admin", "chef_de_chantier"] },
    {
      href: "/dashboard/calculations",
      icon: Calculator,
      label: "Calculations",
      roles: ["admin", "chef_de_chantier", "ingenieur_structure"], // Added chef_de_chantier to roles
    },
    { href: "/dashboard/costs", icon: DollarSign, label: "Costs", roles: ["admin", "chef_de_chantier"] },
    { 
      href: "/dashboard/users", 
      icon: Users, 
      label: "Users", 
      roles: ["admin", "chef_de_chantier", "ingenieur_structure"], // Added all roles
    },
    {
      href: "/dashboard/settings",
      icon: Settings,
      label: "Settings",
      roles: ["admin", "chef_de_chantier", "ingenieur_structure"],
    },
  ]

  const visibleItems = menuItems.filter((item) => item.roles.includes(user.role))

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold">BuildStock</h1>
        <p className="text-sm text-slate-400">Pro</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-2">
        <div className="px-4 py-3 bg-slate-800 rounded-lg">
          <p className="text-sm font-medium">{user.full_name || user.email}</p>
          <p className="text-xs text-slate-400 capitalize">{user.role.replace("_", " ")}</p>
        </div>
        <LogoutButton />
      </div>
    </aside>
  )
}
