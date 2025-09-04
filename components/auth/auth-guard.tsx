"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiredRoles?: string[]
  fallbackUrl?: string
}

export function AuthGuard({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallbackUrl = "/auth/login",
}: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      console.log("🔒 AuthGuard: No session, redirecting to login")
      router.push(fallbackUrl)
      return
    }
    console.log(session.user.role);
    if (session.user.role === "SUPER_ADMIN" || session.user.role === "Super Admin") {
      console.log("👑 AuthGuard: Super Admin detected - bypassing all checks")
      return
    }

    // Check role requirements
    if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
      console.log("❌ AuthGuard: Role check failed", {
        userRole: session.user.role,
        requiredRoles,
      })
      router.push("/unauthorized")
      return
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const userPermissions = session.user.permissions || []
      const hasRequiredPermission = requiredPermissions.some(
        (permission) => userPermissions.includes(permission) || userPermissions.includes("*"),
      )

      console.log("🔍 AuthGuard: Permission check", {
        requiredPermissions,
        userPermissions: userPermissions,
        userRole: session.user.role,
        hasRequiredPermission,
      })

      if (!hasRequiredPermission) {
        console.log("❌ AuthGuard: Permission check failed, redirecting to unauthorized")
        router.push("/unauthorized")
        return
      }
    }

    console.log("✅ AuthGuard: All checks passed")
  }, [session, status, router, requiredPermissions, requiredRoles, fallbackUrl])

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (session.user.role === "SUPER_ADMIN"   || session.user.role === "Super Admin") {
    return <>{children}</>
  }

  // Check permissions after session is loaded
  if (requiredRoles.length > 0 && !requiredRoles.includes(session.user.role)) {
    return null
  }

  if (requiredPermissions.length > 0) {
    const userPermissions = session.user.permissions || []
    const hasRequiredPermission = requiredPermissions.some(
      (permission) => userPermissions.includes(permission) || userPermissions.includes("*"),
    )

    if (!hasRequiredPermission) {
      return null
    }
  }

  return <>{children}</>
}
