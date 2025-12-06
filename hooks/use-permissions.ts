"use client"

import { useAuth } from "@/lib/auth-context"
import { type Permission, hasPermission, hasAnyPermission, hasAllPermissions } from "@/lib/permissions"

export function usePermissions() {
  const { user } = useAuth()

  if (!user) {
    return {
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
    }
  }

  return {
    hasPermission: (permission: Permission) => hasPermission(user.role, permission),
    hasAnyPermission: (permissions: Permission[]) => hasAnyPermission(user.role, permissions),
    hasAllPermissions: (permissions: Permission[]) => hasAllPermissions(user.role, permissions),
  }
}
