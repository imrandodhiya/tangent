"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { PermissionGuard } from "@/components/auth/permission-guard"
import { RoleBadge } from "@/components/auth/role-badge"
import { PERMISSIONS } from "@/lib/permissions"
import {
  Trophy,
  Users,
  UserCheck,
  BarChart3,
  Target,
  Shield,
  Home,
  MapPin,
  Building2,
  Calculator,
  UserCog,
  Gamepad2,
  Settings,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Tournaments",
    href: "/tournaments",
    icon: Trophy,
    permission: PERMISSIONS.TOURNAMENTS_VIEW,
  },
  {
    name: "Teams",
    href: "/teams",
    icon: Users,
    permission: PERMISSIONS.TEAMS_VIEW,
  },
  {
    name: "Members",
    href: "/members",
    icon: UserCheck,
    permission: PERMISSIONS.MEMBERS_VIEW,
  },
  {
    name: "Brands",
    href: "/brands",
    icon: Target,
    permission: PERMISSIONS.BRANDS_VIEW,
  },
  {
    name: "States",
    href: "/states",
    icon: MapPin,
    permission: PERMISSIONS.SYSTEM_SETTINGS,
  },
  {
    name: "Cities",
    href: "/cities",
    icon: Building2,
    permission: PERMISSIONS.SYSTEM_SETTINGS,
  },
  {
    name: "Lanes",
    href: "/lanes",
    icon: Gamepad2,
    permission: PERMISSIONS.SYSTEM_SETTINGS,
  },
  {
    name: "Score Entry",
    href: "/scoring",
    icon: Calculator,
    permission: PERMISSIONS.SCORING_APPROVE,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    permission: PERMISSIONS.REPORTS_VIEW,
  },
  {
    name: "Operators",
    href: "/operators",
    icon: UserCog,
    permission: PERMISSIONS.USERS_VIEW,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Shield,
    permission: PERMISSIONS.USERS_VIEW,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    permission: PERMISSIONS.SYSTEM_SETTINGS,
  },
]

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isSuperAdmin = session?.user?.role === "Super Admin"

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
          <Trophy className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white"></h1>
          <RoleBadge />
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          const NavItem = (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )

          if (isSuperAdmin || !item.permission) {
            return NavItem
          }

          return (
            <PermissionGuard key={item.name} permission={item.permission}>
              {NavItem}
            </PermissionGuard>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400">Logged in as: {session?.user?.email}</div>
      </div>
    </div>
  )
}
