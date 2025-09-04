"use client"

import type React from "react"
import { useSession } from "next-auth/react"
import { usePermissions } from "@/hooks/use-permissions"
import type { Permission } from "@/lib/permissions"

interface PermissionGuardProps {
  permission?: Permission
  permissions?: Permission[]
  requireAll?: boolean
  role?: string
  roles?: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  role,
  roles,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { status } = useSession()
  const { hasPermission, hasAnyPermission, hasAllPermissions, userRole } = usePermissions()

  if (status === "loading") {
    return <>{fallback}</>
  }

  if (status === "unauthenticated") {
    return <>{fallback}</>
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    console.log(`Permission denied: ${permission}`, { userRole, hasPermission: hasPermission(permission) })
    return <>{fallback}</>
  }

  // Check multiple permissions
  if (permissions) {
    const hasRequiredPermissions = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)

    if (!hasRequiredPermissions) {
      console.log(`Permissions denied:`, permissions, { userRole, hasRequiredPermissions })
      return <>{fallback}</>
    }
  }

  // Check single role
  if (role && userRole !== role) {
    console.log(`Role denied: required ${role}, user has ${userRole}`)
    return <>{fallback}</>
  }

  // Check multiple roles
  if (roles && !roles.includes(userRole || "")) {
    console.log(`Roles denied: required one of ${roles.join(", ")}, user has ${userRole}`)
    return <>{fallback}</>
  }

  return <>{children}</>
}
