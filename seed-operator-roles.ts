import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function seedOperatorRoles() {
  console.log("🌱 Seeding operator roles...")

  const operatorRoles = [
    {
      name: "OPERATOR",
      description: "General tournament operator with basic permissions",
      permissions: ["tournament.view", "team.view", "member.view", "scoring.entry", "scoring.view"],
    },
    {
      name: "SCORER",
      description: "Score entry specialist with scoring permissions",
      permissions: ["tournament.view", "team.view", "member.view", "scoring.entry", "scoring.view", "scoring.edit"],
    },
    {
      name: "TOURNAMENT_OPERATOR",
      description: "Senior tournament operator with extended permissions",
      permissions: [
        "tournament.view",
        "tournament.edit",
        "team.view",
        "team.edit",
        "member.view",
        "member.edit",
        "scoring.entry",
        "scoring.view",
        "scoring.edit",
        "scoring.approve",
      ],
    },
  ]

  for (const roleData of operatorRoles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: roleData.name },
    })

    if (!existingRole) {
      await prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
        },
      })
      console.log(`✅ Created role: ${roleData.name}`)
    } else {
      // Update permissions if role exists
      await prisma.role.update({
        where: { name: roleData.name },
        data: {
          description: roleData.description,
          permissions: roleData.permissions,
        },
      })
      console.log(`🔄 Updated role: ${roleData.name}`)
    }
  }

  console.log("✅ Operator roles seeding completed!")
}

seedOperatorRoles()
  .catch((e) => {
    console.error("❌ Error seeding operator roles:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
