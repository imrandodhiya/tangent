import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PermissionChecker, type Permission } from "@/lib/permissions"

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string
    email: string
    role: string
    permissions: string[]
  }
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.user = {
      id: session.user.id,
      email: session.user.email!,
      role: session.user.role,
      permissions: session.user.permissions,
    }

    return handler(authenticatedReq)
  }
}

export function withPermission(permission: Permission) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(async (req: AuthenticatedRequest) => {
      const checker = new PermissionChecker(req.user.permissions)

      if (!checker.hasPermission(permission)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      return handler(req)
    })
}

export function withAnyPermission(permissions: Permission[]) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(async (req: AuthenticatedRequest) => {
      const checker = new PermissionChecker(req.user.permissions)

      if (!checker.hasAnyPermission(permissions)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      return handler(req)
    })
}

export function withRole(allowedRoles: string[]) {
  return (handler: (req: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(async (req: AuthenticatedRequest) => {
      if (!allowedRoles.includes(req.user.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      return handler(req)
    })
}
