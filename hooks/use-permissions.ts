"use client"

// ✅ تصحيح المسار: استخدام السياق الجديد بدلاً من lib/auth-context القديم
import { useAuth } from "@/lib/mysql/auth-context"
import { 
  type Permission, 
  hasPermission as checkPermission, 
  hasAnyPermission as checkAnyPermission, 
  hasAllPermissions as checkAllPermissions,
  type UserRole 
} from "@/lib/permissions"
import { useCallback } from "react"

export function usePermissions() {
  const { user } = useAuth()

  // استخدام useCallback لتحسين الأداء
  const hasPermission = useCallback((permission: Permission) => {
    if (!user?.role) return false
    return checkPermission(user.role as UserRole, permission)
  }, [user?.role])

  const hasAnyPermission = useCallback((permissions: Permission[]) => {
    if (!user?.role) return false
    return checkAnyPermission(user.role as UserRole, permissions)
  }, [user?.role])

  const hasAllPermissions = useCallback((permissions: Permission[]) => {
    if (!user?.role) return false
    return checkAllPermissions(user.role as UserRole, permissions)
  }, [user?.role])

  // دالة مساعدة للتحقق من الدور
  const hasRole = useCallback((role: UserRole) => {
    return user?.role === role
  }, [user?.role])

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    role: user?.role as UserRole | undefined
  }
}