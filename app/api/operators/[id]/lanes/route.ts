import { NextResponse } from "next/server"
import { withPermission } from "@/lib/auth-middleware"
import { PERMISSIONS } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

// Get operator lane assignments
export const GET = withPermission(PERMISSIONS.USERS_VIEW)(async (req, { params }) => {
  try {
    const { id } = await params
    const operatorId = id

    const assignments = await prisma.operatorLaneAssignment.findMany({
      where: { operatorId },
      include: {
        lane: {
          include: {
            slotTeams: {
              include: {
                tournamentSlot: {
                  include: {
                    tournament: true,
                  },
                },
              },
            },
          },
        },
        tournament: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error("Error fetching operator lane assignments:", error)
    return NextResponse.json({ error: "Failed to fetch lane assignments" }, { status: 500 })
  }
})

// Assign operator to lanes
export const POST = withPermission(PERMISSIONS.USERS_EDIT)(async (req, { params }) => {
  try {
    const { id } = await params
    const operatorId = id
    const body = await req.json()
    const { tournamentId, laneIds } = body

    // Verify operator exists and has appropriate role
    const operator = await prisma.user.findUnique({
      where: { id: operatorId },
      include: { role: true },
    })

    if (!operator || !["OPERATOR", "SCORER", "TOURNAMENT_OPERATOR"].includes(operator.role.name)) {
      return NextResponse.json({ error: "Invalid operator" }, { status: 400 })
    }

    // Remove existing assignments for this tournament
    await prisma.operatorLaneAssignment.deleteMany({
      where: {
        operatorId,
        tournamentId,
      },
    })

    // Create new assignments
    const assignments = await Promise.all(
      laneIds.map((laneId: string) =>
        prisma.operatorLaneAssignment.create({
          data: {
            operatorId,
            laneId,
            tournamentId,
          },
          include: {
            lane: true,
            tournament: true,
          },
        }),
      ),
    )

    return NextResponse.json(assignments)
  } catch (error) {
    console.error("Error assigning operator to lanes:", error)
    return NextResponse.json({ error: "Failed to assign lanes" }, { status: 500 })
  }
})

// Remove lane assignment
export const DELETE = withPermission(PERMISSIONS.USERS_EDIT)(async (req, { params }) => {
  try {
    const { id } = await params
    const operatorId = id
    const { searchParams } = new URL(req.url)
    const laneId = searchParams.get("laneId")
    const tournamentId = searchParams.get("tournamentId")

    if (!laneId || !tournamentId) {
      return NextResponse.json({ error: "Lane ID and Tournament ID are required" }, { status: 400 })
    }

    await prisma.operatorLaneAssignment.deleteMany({
      where: {
        operatorId,
        laneId,
        tournamentId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing lane assignment:", error)
    return NextResponse.json({ error: "Failed to remove lane assignment" }, { status: 500 })
  }
})
