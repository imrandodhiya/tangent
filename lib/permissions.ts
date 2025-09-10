// Permission constants
export const PERMISSIONS = {
  // User Management
  USERS_VIEW: "users.view",
  USERS_EDIT: "users.edit",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  // Tournament Management
  TOURNAMENTS_VIEW: "tournaments.view",
  TOURNAMENTS_CREATE: "tournaments.create",
  TOURNAMENTS_UPDATE: "tournaments.update",
  TOURNAMENTS_DELETE: "tournaments.delete",
  TOURNAMENTS_MANAGE: "tournaments.manage",

  // Team Management
  TEAMS_VIEW: "teams.view",
  TEAMS_CREATE: "teams.create",
  TEAMS_UPDATE: "teams.update",
  TEAMS_DELETE: "teams.delete",

  // Member Management
  MEMBERS_VIEW: "members.view",
  MEMBERS_CREATE: "members.create",
  MEMBERS_UPDATE: "members.update",
  MEMBERS_DELETE: "members.delete",

  // Brand Management
  BRANDS_VIEW: "brands.view",
  BRANDS_CREATE: "brands.create",
  BRANDS_UPDATE: "brands.update",
  BRANDS_DELETE: "brands.delete",

  // Scoring
  SCORING_VIEW: "scoring.view",
  SCORING_ENTER: "scoring.enter",
  SCORING_UPDATE: "scoring.update",
  SCORING_DELETE: "scoring.delete",
  SCORING_APPROVE: "scoring.approve",

  // Reports
  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",

  // System Administration
  SYSTEM_ADMIN: "system.admin",
  SYSTEM_SETTINGS: "system.settings",
  ROLES_MANAGE: "roles.manage",
  PERMISSIONS_MANAGE: "permissions.manage",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// Role definitions
export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  TOURNAMENT_DIRECTOR: "TOURNAMENT_DIRECTOR",
  SCOREKEEPER: "SCOREKEEPER",
  VIEWER: "VIEWER",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

// Role-Permission mappings
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),

  [ROLES.ADMIN]: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.TOURNAMENTS_VIEW,
    PERMISSIONS.TOURNAMENTS_CREATE,
    PERMISSIONS.TOURNAMENTS_UPDATE,
    PERMISSIONS.TOURNAMENTS_MANAGE,
    PERMISSIONS.TEAMS_VIEW,
    PERMISSIONS.TEAMS_CREATE,
    PERMISSIONS.TEAMS_UPDATE,
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.MEMBERS_CREATE,
    PERMISSIONS.MEMBERS_UPDATE,
    PERMISSIONS.BRANDS_VIEW,
    PERMISSIONS.BRANDS_CREATE,
    PERMISSIONS.BRANDS_UPDATE,
    PERMISSIONS.SCORING_VIEW,
    PERMISSIONS.SCORING_ENTER,
    PERMISSIONS.SCORING_UPDATE,
    PERMISSIONS.SCORING_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.SYSTEM_SETTINGS,
  ],

  [ROLES.TOURNAMENT_DIRECTOR]: [
    PERMISSIONS.TOURNAMENTS_VIEW,
    PERMISSIONS.TOURNAMENTS_UPDATE,
    PERMISSIONS.TOURNAMENTS_MANAGE,
    PERMISSIONS.TEAMS_VIEW,
    PERMISSIONS.TEAMS_CREATE,
    PERMISSIONS.TEAMS_UPDATE,
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.MEMBERS_CREATE,
    PERMISSIONS.MEMBERS_UPDATE,
    PERMISSIONS.BRANDS_VIEW,
    PERMISSIONS.SCORING_VIEW,
    PERMISSIONS.SCORING_ENTER,
    PERMISSIONS.SCORING_UPDATE,
    PERMISSIONS.REPORTS_VIEW,
  ],

  [ROLES.SCOREKEEPER]: [
    PERMISSIONS.TOURNAMENTS_VIEW,
    PERMISSIONS.TEAMS_VIEW,
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.BRANDS_VIEW,
    PERMISSIONS.SCORING_VIEW,
    PERMISSIONS.SCORING_ENTER,
    PERMISSIONS.SCORING_UPDATE,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.TOURNAMENTS_VIEW,
    PERMISSIONS.TEAMS_VIEW,
    PERMISSIONS.MEMBERS_VIEW,
    PERMISSIONS.BRANDS_VIEW,
    PERMISSIONS.SCORING_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
}

// Permission utility functions
export class PermissionChecker {
  constructor(private userPermissions: string[]) {}

  hasPermission(permission: Permission): boolean {
    return this.userPermissions.includes(permission)
  }

  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission))
  }

  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission))
  }

  canManageUsers(): boolean {
    return this.hasAnyPermission([PERMISSIONS.USERS_CREATE, PERMISSIONS.USERS_UPDATE, PERMISSIONS.USERS_DELETE])
  }

  canManageTournaments(): boolean {
    return this.hasAnyPermission([
      PERMISSIONS.TOURNAMENTS_CREATE,
      PERMISSIONS.TOURNAMENTS_UPDATE,
      PERMISSIONS.TOURNAMENTS_DELETE,
      PERMISSIONS.TOURNAMENTS_MANAGE,
    ])
  }

  canManageTeams(): boolean {
    return this.hasAnyPermission([PERMISSIONS.TEAMS_CREATE, PERMISSIONS.TEAMS_UPDATE, PERMISSIONS.TEAMS_DELETE])
  }

  canManageBrands(): boolean {
    return this.hasAnyPermission([PERMISSIONS.BRANDS_CREATE, PERMISSIONS.BRANDS_UPDATE, PERMISSIONS.BRANDS_DELETE])
  }

  canEnterScores(): boolean {
    return this.hasPermission(PERMISSIONS.SCORING_ENTER)
  }

  canApproveScores(): boolean {
    return this.hasPermission(PERMISSIONS.SCORING_APPROVE)
  }

  canViewReports(): boolean {
    return this.hasPermission(PERMISSIONS.REPORTS_VIEW)
  }

  canExportReports(): boolean {
    return this.hasPermission(PERMISSIONS.REPORTS_EXPORT)
  }

  canManageSystem(): boolean {
    return this.hasAnyPermission([PERMISSIONS.SYSTEM_ADMIN, PERMISSIONS.SYSTEM_SETTINGS])
  }

  isAdmin(): boolean {
    return this.hasAnyPermission([PERMISSIONS.SYSTEM_ADMIN, PERMISSIONS.ROLES_MANAGE])
  }
}
