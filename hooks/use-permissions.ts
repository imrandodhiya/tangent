"use client"

import { useSession } from "next-auth/react"
import { PermissionChecker, type Permission } from "@/lib/permissions"

export function usePermissions() {
  const { data: session, status } = useSession()

  const permissions = session?.user?.permissions || []
  const userRole = session?.user?.role
  const checker = new PermissionChecker(permissions)

  // Super Admin bypass - they have all permissions
  const isSuperAdmin = userRole === "SUPER_ADMIN" || userRole === "Super Admin"

  if (process.env.NODE_ENV === "development" && session) {
    console.log("🔍 usePermissions Debug:", {
      userRole,
      permissionCount: permissions.length,
      permissions: permissions,
      sessionStatus: status,
      userId: session.user?.id,
      isSuperAdmin,
    })
  }

  return {
    permissions,
    userRole,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isSuperAdmin,
    hasPermission: (permission: Permission) => {
      if (isSuperAdmin) return true
      const result = checker.hasPermission(permission)
      if (process.env.NODE_ENV === "development") {
        console.log(`🔐 Permission check: ${permission} = ${result}`)
      }
      return result
    },
    hasAnyPermission: (permissions: Permission[]) => {
      if (isSuperAdmin) return true
      return checker.hasAnyPermission(permissions)
    },
    hasAllPermissions: (permissions: Permission[]) => {
      if (isSuperAdmin) return true
      return checker.hasAllPermissions(permissions)
    },
    canManageUsers: () => isSuperAdmin || checker.canManageUsers(),
    canManageTournaments: () => isSuperAdmin || checker.canManageTournaments(),
    canManageTeams: () => isSuperAdmin || checker.canManageTeams(),
    canManageBrands: () => isSuperAdmin || checker.canManageBrands(),
    canEnterScores: () => isSuperAdmin || checker.canEnterScores(),
    canApproveScores: () => isSuperAdmin || checker.canApproveScores(),
    canViewReports: () => isSuperAdmin || checker.canViewReports(),
    canExportReports: () => isSuperAdmin || checker.canExportReports(),
    canManageSystem: () => isSuperAdmin || checker.canManageSystem(),
    isAdmin: () => isSuperAdmin || checker.isAdmin(),
  }
}
