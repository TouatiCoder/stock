import type { UserRole } from "./auth-context"

export type Permission =
  | "view_dashboard"
  | "view_inventory"
  | "edit_inventory"
  | "view_projects"
  | "edit_projects"
  | "view_costs"
  | "edit_costs"
  | "view_users"
  | "edit_users"
  | "view_settings"
  | "edit_settings"

export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // Dashboard
    "view_dashboard",
    // Inventaire
    "view_inventory",
    "edit_inventory",
    // Projets
    "view_projects",
    "edit_projects",
    // Coûts
    "view_costs",
    "edit_costs",
    // Utilisateurs
    "view_users",
    "edit_users",
    // Paramètres
    "view_settings",
    "edit_settings",
  ],
  supervisor: [
    // Dashboard
    "view_dashboard",
    // Inventaire
    "view_inventory",
    "edit_inventory",
    // Projets
    "view_projects",
    // Coûts
    "view_costs",
    // Paramètres (profil seulement)
    "view_settings",
  ],
  engineer: [
    // Dashboard
    "view_dashboard",
    // Inventaire
    "view_inventory",
    // Projets
    "view_projects",
    "edit_projects",
    // Coûts
    "view_costs",
    // Paramètres (profil seulement)
    "view_settings",
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role].includes(permission)
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p))
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p))
}
