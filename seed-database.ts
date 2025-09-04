import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seeding...")

  const permissions = [
    // User Management
    { name: "View Users", code: "users.view", description: "View user list and details" },
    { name: "Create Users", code: "users.create", description: "Create new users" },
    { name: "Edit Users", code: "users.edit", description: "Edit user information" },
    { name: "Delete Users", code: "users.delete", description: "Delete users" },
    { name: "Manage User Roles", code: "users.roles", description: "Assign roles to users" },

    // Tournament Management
    { name: "View Tournaments", code: "tournaments.view", description: "View tournament list and details" },
    { name: "Create Tournaments", code: "tournaments.create", description: "Create new tournaments" },
    { name: "Edit Tournaments", code: "tournaments.edit", description: "Edit tournament information" },
    { name: "Delete Tournaments", code: "tournaments.delete", description: "Delete tournaments" },
    { name: "Manage Tournament Status", code: "tournaments.status", description: "Change tournament status" },

    // Team Management
    { name: "View Teams", code: "teams.view", description: "View team list and details" },
    { name: "Create Teams", code: "teams.create", description: "Create new teams" },
    { name: "Edit Teams", code: "teams.edit", description: "Edit team information" },
    { name: "Delete Teams", code: "teams.delete", description: "Delete teams" },
    { name: "Manage Team Members", code: "teams.members", description: "Add/remove team members" },

    // Member Management
    { name: "View Members", code: "members.view", description: "View member list and details" },
    { name: "Create Members", code: "members.create", description: "Create new members" },
    { name: "Edit Members", code: "members.edit", description: "Edit member information" },
    { name: "Delete Members", code: "members.delete", description: "Delete members" },

    // Brand Management
    { name: "View Brands", code: "brands.view", description: "View brand list and details" },
    { name: "Create Brands", code: "brands.create", description: "Create new brands" },
    { name: "Edit Brands", code: "brands.edit", description: "Edit brand information" },
    { name: "Delete Brands", code: "brands.delete", description: "Delete brands" },

    // Scoring
    { name: "View Scores", code: "scoring.view", description: "View game scores and results" },
    { name: "Enter Scores", code: "scoring.enter", description: "Enter and edit scores" },
    { name: "Approve Scores", code: "scoring.approve", description: "Approve and confirm scores" },
    { name: "Override Scores", code: "scoring.override", description: "Override calculated scores" },

    // Reports & Analytics
    { name: "View Reports", code: "reports.view", description: "View reports and analytics" },
    { name: "Export Reports", code: "reports.export", description: "Export reports and data" },

    // System Administration
    { name: "System Settings", code: "system.settings", description: "Manage system settings" },
    { name: "View Audit Logs", code: "system.audit", description: "View system audit logs" },
  ]

  console.log("Creating permissions...")
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {},
      create: permission,
    })
  }

  const roles = [
    {
      name: "Super Admin",
      description: "Full system access with all permissions",
      isSystem: true,
      permissions: permissions.map((p) => p.code), // All permissions
    },
    {
      name: "Admin",
      description: "Administrative access with most permissions",
      isSystem: true,
      permissions: [
        "users.view",
        "users.create",
        "users.edit",
        "tournaments.view",
        "tournaments.create",
        "tournaments.edit",
        "tournaments.status",
        "teams.view",
        "teams.create",
        "teams.edit",
        "teams.members",
        "members.view",
        "members.create",
        "members.edit",
        "brands.view",
        "brands.create",
        "brands.edit",
        "scoring.view",
        "scoring.enter",
        "scoring.approve",
        "reports.view",
        "reports.export",
      ],
    },
    {
      name: "Tournament Director",
      description: "Manage tournaments and teams",
      isSystem: true,
      permissions: [
        "tournaments.view",
        "tournaments.edit",
        "tournaments.status",
        "teams.view",
        "teams.create",
        "teams.edit",
        "teams.members",
        "members.view",
        "members.create",
        "members.edit",
        "brands.view",
        "scoring.view",
        "scoring.approve",
        "reports.view",
      ],
    },
    {
      name: "Scorekeeper",
      description: "Enter and manage scores",
      isSystem: true,
      permissions: ["tournaments.view", "teams.view", "members.view", "scoring.view", "scoring.enter", "reports.view"],
    },
    {
      name: "Viewer",
      description: "Read-only access to view data",
      isSystem: true,
      permissions: ["tournaments.view", "teams.view", "members.view", "brands.view", "scoring.view", "reports.view"],
    },
  ]

  console.log("Creating roles and assigning permissions...")
  for (const roleData of roles) {
    let role = await prisma.role.findFirst({
      where: { name: roleData.name },
    })

    if (!role) {
      role = await prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          isSystem: roleData.isSystem,
        },
      })
    }

    // Assign permissions to role
    for (const permissionCode of roleData.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { code: permissionCode },
      })
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        })
      }
    }
  }

  console.log("Creating states and cities...")
  let defaultState = await prisma.state.findFirst({
    where: { name: "California" },
  })

  if (!defaultState) {
    defaultState = await prisma.state.create({
      data: {
        name: "California",
        isDefault: true,
      },
    })
  }

  let defaultCity = await prisma.city.findFirst({
    where: {
      stateId: defaultState.id,
      name: "Los Angeles",
    },
  })

  if (!defaultCity) {
    defaultCity = await prisma.city.create({
      data: {
        name: "Los Angeles",
        stateId: defaultState.id,
        pincode: "90210",
        isDefault: true,
      },
    })
  }

  console.log("Creating default admin user...")
  const superAdminRole = await prisma.role.findFirst({
    where: { name: "Super Admin" },
  })

  if (superAdminRole) {
    const hashedPassword = await bcrypt.hash("admin123", 12)

    await prisma.user.upsert({
      where: { email: "admin@bowling.com" },
      update: {},
      create: {
        firstName: "System",
        lastName: "Administrator",
        email: "admin@bowling.com",
        mobile: "+1234567890",
        passwordHash: hashedPassword,
        roleId: superAdminRole.id,
        stateId: defaultState.id,
        cityId: defaultCity.id,
        isDefault: true,
      },
    })
  }

  let sampleBrand = await prisma.brand.findFirst({
    where: { name: "Strike Force Bowling" },
  })

  if (!sampleBrand) {
    sampleBrand = await prisma.brand.create({
      data: {
        name: "Strike Force Bowling",
        description: "Premier bowling team brand",
        stateId: defaultState.id,
        cityId: defaultCity.id,
        primaryColor: "#1e40af",
        secondaryColor: "#f59e0b",
        contactName: "John Manager",
        contactEmail: "manager@strikeforce.com",
        contactPhone: "+1234567891",
        isDefault: true,
      },
    })
  }

  const sampleMembers = [
    {
      firstName: "Alice",
      lastName: "Johnson",
      gender: "FEMALE",
      mobile: "+1234567892",
      email: "alice@example.com",
      experienceYears: 5,
    },
    {
      firstName: "Bob",
      lastName: "Smith",
      gender: "MALE",
      mobile: "+1234567893",
      email: "bob@example.com",
      experienceYears: 8,
    },
    {
      firstName: "Carol",
      lastName: "Davis",
      gender: "FEMALE",
      mobile: "+1234567894",
      email: "carol@example.com",
      experienceYears: 3,
    },
    {
      firstName: "David",
      lastName: "Wilson",
      gender: "MALE",
      mobile: "+1234567895",
      email: "david@example.com",
      experienceYears: 6,
    },
  ]

  const createdMembers = []
  for (const memberData of sampleMembers) {
    const member = await prisma.member.upsert({
      where: { mobile: memberData.mobile },
      update: {},
      create: {
        ...memberData,
        stateId: defaultState.id,
        cityId: defaultCity.id,
        brandId: sampleBrand.id,
        dob: new Date("1990-01-01"),
        address: "123 Bowling Lane, Los Angeles, CA",
        education: "Bachelor's Degree",
        notes: "Sample member for testing",
      },
    })
    createdMembers.push(member)
  }

  let sampleTournament = await prisma.tournament.findFirst({
    where: { name: "Spring Championship 2024" },
  })

  if (!sampleTournament) {
    sampleTournament = await prisma.tournament.create({
      data: {
        name: "Spring Championship 2024",
        description: "Annual spring bowling championship tournament",
        stateId: defaultState.id,
        cityId: defaultCity.id,
        startDate: new Date("2024-04-01"),
        endDate: new Date("2024-04-03"),
        visibility: "PUBLIC",
        status: "ACTIVE",
        brandsCount: 2,
        teamsPerBrand: 2,
        playersPerTeam: 4,
        malePerTeam: 2,
        femalePerTeam: 2,
        lanesTotal: 8,
        framesPerGame: 10,
        handicapBaseScore: 200,
        handicapPercent: 80,
        femaleAdjustmentPins: 8,
        allowManualOverride: true,
        requireDualApproval: false,
        laneRotationEnabled: true,
        noOfRounds: 3, // Added missing noOfRounds field
      },
    })
  }

  const existingTournamentBrand = await prisma.tournamentBrand.findFirst({
    where: {
      tournamentId: sampleTournament.id,
      brandId: sampleBrand.id,
    },
  })

  if (!existingTournamentBrand) {
    await prisma.tournamentBrand.create({
      data: {
        tournamentId: sampleTournament.id,
        brandId: sampleBrand.id,
        numberOfTeams: 2,
      },
    })
  }

  const sampleTeams = [
    {
      name: "Strike Force Alpha",
      baseName: "Strike Force",
      suffix: "Alpha",
      color: "#1e40af",
      seedNo: 1,
    },
    {
      name: "Strike Force Beta",
      baseName: "Strike Force",
      suffix: "Beta",
      color: "#dc2626",
      seedNo: 2,
    },
  ]

  const createdTeams = []
  for (const teamData of sampleTeams) {
    let team = await prisma.team.findFirst({
      where: {
        tournamentId: sampleTournament.id,
        name: teamData.name,
      },
    })

    if (!team) {
      team = await prisma.team.create({
        data: {
          ...teamData,
          tournamentId: sampleTournament.id,
          brandId: sampleBrand.id,
        },
      })
    }
    createdTeams.push(team)
  }

  console.log("Assigning members to teams...")
  // Team 1: Alice (Captain), Bob
  const existingTeamMember1 = await prisma.teamMember.findFirst({
    where: {
      teamId: createdTeams[0].id,
      memberId: createdMembers[0].id,
    },
  })

  if (!existingTeamMember1) {
    await prisma.teamMember.create({
      data: {
        teamId: createdTeams[0].id,
        memberId: createdMembers[0].id,
        roleInTeam: "CAPTAIN",
        jerseyNo: 1,
      },
    })
  }

  const existingTeamMember2 = await prisma.teamMember.findFirst({
    where: {
      teamId: createdTeams[0].id,
      memberId: createdMembers[1].id,
    },
  })

  if (!existingTeamMember2) {
    await prisma.teamMember.create({
      data: {
        teamId: createdTeams[0].id,
        memberId: createdMembers[1].id,
        roleInTeam: "PLAYER",
        jerseyNo: 2,
      },
    })
  }

  // Team 2: Carol (Captain), David
  const existingTeamMember3 = await prisma.teamMember.findFirst({
    where: {
      teamId: createdTeams[1].id,
      memberId: createdMembers[2].id,
    },
  })

  if (!existingTeamMember3) {
    await prisma.teamMember.create({
      data: {
        teamId: createdTeams[1].id,
        memberId: createdMembers[2].id,
        roleInTeam: "CAPTAIN",
        jerseyNo: 1,
      },
    })
  }

  const existingTeamMember4 = await prisma.teamMember.findFirst({
    where: {
      teamId: createdTeams[1].id,
      memberId: createdMembers[3].id,
    },
  })

  if (!existingTeamMember4) {
    await prisma.teamMember.create({
      data: {
        teamId: createdTeams[1].id,
        memberId: createdMembers[3].id,
        roleInTeam: "PLAYER",
        jerseyNo: 2,
      },
    })
  }

  console.log("Creating sample lanes...")
  const sampleLanes = []
  for (let i = 1; i <= 8; i++) {
    let lane = await prisma.lane.findFirst({
      where: { laneNo: i },
    })

    if (!lane) {
      lane = await prisma.lane.create({
        data: {
          venueName: "Main Bowling Center",
          laneNo: i,
          isActive: true,
          notes: `Lane ${i} - Standard bowling lane`,
        },
      })
    }
    sampleLanes.push(lane)
  }

  console.log("Creating tournament rounds...")
  let sampleRound = await prisma.tournamentRound.findFirst({
    where: {
      tournamentId: sampleTournament.id,
      roundNo: 1,
    },
  })

  if (!sampleRound) {
    sampleRound = await prisma.tournamentRound.create({
      data: {
        tournamentId: sampleTournament.id,
        roundNo: 1,
        name: "Qualifying Round",
        isKnockout: false,
        teamsIn: 2,
        teamsOut: 0,
        teamsAdvancing: 2,
        matchesCount: 1,
        aggregationScope: "ROUND",
        aggregationMetric: "TEAM_TOTAL",
      },
    })
  }

  let sampleMatch = await prisma.tournamentMatch.findFirst({
    where: {
      tournamentRoundId: sampleRound.id,
      matchNo: 1,
    },
  })

  if (!sampleMatch) {
    sampleMatch = await prisma.tournamentMatch.create({
      data: {
        tournamentRoundId: sampleRound.id,
        matchNo: 1,
        name: "Match 1 - Qualifying",
        scheduledAt: new Date("2024-04-01T10:00:00Z"),
        positionNo: 1,
      },
    })
  }

  let sampleSlot = await prisma.tournamentSlot.findFirst({
    where: {
      tournamentId: sampleTournament.id,
      slotNo: 1,
    },
  })

  if (!sampleSlot) {
    sampleSlot = await prisma.tournamentSlot.create({
      data: {
        tournamentId: sampleTournament.id,
        tournamentRoundId: sampleRound.id, // Added missing tournamentRoundId field
        slotNo: 1,
        name: "Slot 1 - Morning Session",
        scheduledAt: new Date("2024-04-01T10:00:00Z"),
        status: "PENDING",
      },
    })
  }

  for (let i = 0; i < createdTeams.length; i++) {
    const existingSlotTeam = await prisma.slotTeam.findFirst({
      where: {
        tournamentSlotId: sampleSlot.id,
        teamId: createdTeams[i].id,
      },
    })

    if (!existingSlotTeam) {
      await prisma.slotTeam.create({
        data: {
          tournamentSlotId: sampleSlot.id,
          teamId: createdTeams[i].id,
          laneId: sampleLanes[i].id,
          positionNo: i + 1,
          seed: i + 1,
        },
      })
    }
  }

  console.log("✅ Database seeding completed successfully!")
  console.log("\n📋 Created:")
  console.log(`- ${permissions.length} permissions`)
  console.log(`- ${roles.length} roles`)
  console.log("- 1 default admin user (admin@bowling.com / admin123)")
  console.log("- 1 state and 1 city")
  console.log("- 1 sample brand")
  console.log(`- ${sampleMembers.length} sample members`)
  console.log("- 1 sample tournament with rounds and matches")
  console.log(`- ${sampleTeams.length} sample teams with members`)
  console.log(`- ${sampleLanes.length} bowling lanes`)
  console.log("- Tournament slots and team assignments")
  console.log("\n🔐 Default Admin Login:")
  console.log("Email: admin@bowling.com")
  console.log("Password: admin123")
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
