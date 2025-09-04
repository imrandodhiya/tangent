"use client"

import { useSession } from "next-auth/react"
import { PermissionChecker, type Permission } from "@/lib/permissions"

export function usePermissions() {
  const { data: session, status } = useSession()

  const permissions = session?.user?.permissions || []
  const userRole = session?.user?.role
  const checker = new PermissionChecker(permissions)

  if (process.env.NODE_ENV === "development" && session) {
    console.log("🔍 usePermissions Debug:", {
      userRole,
      permissionCount: permissions.length,
      permissions: permissions,
      sessionStatus: status,
      userId: session.user?.id,
      isSuperAdmin: userRole === "SUPER_ADMIN",
    })
  }

  return {
    permissions,
    userRole,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    hasPermission: (permission: Permission) => {
      const result = checker.hasPermission(permission)
      if (process.env.NODE_ENV === "development") {
        console.log(`🔐 Permission check: ${permission} = ${result}`)
      }
      return result
    },
    hasAnyPermission: (permissions: Permission[]) => checker.hasAnyPermission(permissions),
    hasAllPermissions: (permissions: Permission[]) => checker.hasAllPermissions(permissions),
    canManageUsers: () => checker.canManageUsers(),
    canManageTournaments: () => checker.canManageTournaments(),
    canManageTeams: () => checker.canManageTeams(),
    canEnterScores: () => checker.canEnterScores(),
    canViewReports: () => checker.canViewReports(),
    canExportReports: () => checker.canExportReports(),
    isAdmin: () => checker.isAdmin(),
  }
}
