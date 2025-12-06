"use client"

import { useAuth } from "@/lib/auth-context"
import { type Permission, hasPermission, hasAnyPermission } from "@/lib/permissions"
import type { ReactNode } from "react"

interface PermissionGateProps {
  children: ReactNode
  permission?: Permission | Permission[]
  fallback?: ReactNode
}

export function PermissionGate({ children, permission, fallback }: PermissionGateProps) {
  const { user } = useAuth()

  if (!user) {
    return <>{fallback || null}</>
  }

  if (!permission) {
    return <>{children}</>
  }

  const hasAccess = Array.isArray(permission)
    ? hasAnyPermission(user.role, permission)
    : hasPermission(user.role, permission)

  if (!hasAccess) {
    return <>{fallback || null}</>
  }

  return <>{children}</>
}
