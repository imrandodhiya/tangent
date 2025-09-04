"use client"

import { Badge } from "@/components/ui/badge"
import { useSession } from "next-auth/react"

const ROLE_COLORS = {
  SUPER_ADMIN: "destructive",
  ADMIN: "default",
  TOURNAMENT_DIRECTOR: "secondary",
  SCOREKEEPER: "outline",
  VIEWER: "outline",
} as const

export function RoleBadge() {
  const { data: session } = useSession()

  if (!session?.user?.role) {
    return null
  }

  const role = session.user.role as keyof typeof ROLE_COLORS
  const variant = ROLE_COLORS[role] || "outline"

  return <Badge variant={variant}>{role.replace("_", " ")}</Badge>
}
