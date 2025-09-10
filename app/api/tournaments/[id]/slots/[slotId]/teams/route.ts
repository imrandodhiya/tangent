import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const assignTeamSchema = z.object({
  teamId: z.string(),
  laneId: z.string().optional(),
  positionNo: z.number().min(1),
  seed: z.number().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string; slotId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, slotId } = await params

    const slotTeams = await prisma.slotTeam.findMany({
      where: { tournamentSlotId: slotId },
      include: {
        team: {
          include: {
            brand: true,
            teamMembers: {
              include: {
                member: true,
              },
            },
          },
        },
        lane: true,
      },
      orderBy: { positionNo: "asc" },
    })

    return NextResponse.json(slotTeams)
  } catch (error) {
    console.error("Error fetching slot teams:", error)
    return NextResponse.json({ error: "Failed to fetch slot teams" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string; slotId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = assignTeamSchema.parse(body)

    const { id, slotId } = await params

    // Check if team is already assigned to this slot
    const existingAssignment = await prisma.slotTeam.findFirst({
      where: {
        tournamentSlotId: slotId,
        teamId: validatedData.teamId,
      },
    })

    if (existingAssignment) {
      return NextResponse.json({ error: "Team is already assigned to this slot" }, { status: 400 })
    }

    const slotTeam = await prisma.slotTeam.create({
      data: {
        tournamentSlotId: slotId,
        teamId: validatedData.teamId,
        laneId: validatedData.laneId || null,
        positionNo: validatedData.positionNo,
        seed: validatedData.seed || null,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        team: {
          include: {
            brand: true,
            teamMembers: {
              include: {
                member: true,
              },
            },
          },
        },
        lane: true,
      },
    })

    return NextResponse.json(slotTeam, { status: 201 })
  } catch (error) {
    console.error("Error assigning team to slot:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to assign team to slot" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string; slotId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { teamId, laneId, positionNo, seed } = body

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    const { id, slotId } = await params

    // Find existing slot team assignment
    const existingSlotTeam = await prisma.slotTeam.findFirst({
      where: {
        tournamentSlotId: slotId,
        teamId: teamId,
      },
    })

    if (!existingSlotTeam) {
      return NextResponse.json({ error: "Team assignment not found in this slot" }, { status: 404 })
    }

    // Update the slot team with new lane assignment
    const updatedSlotTeam = await prisma.slotTeam.update({
      where: { id: existingSlotTeam.id },
      data: {
        laneId: laneId || null,
        positionNo: positionNo || existingSlotTeam.positionNo,
        seed: seed || existingSlotTeam.seed,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      },
      include: {
        team: {
          include: {
            brand: true,
            teamMembers: {
              include: {
                member: true,
              },
            },
          },
        },
        lane: true,
      },
    })

    return NextResponse.json(updatedSlotTeam)
  } catch (error) {
    console.error("Error updating team lane assignment:", error)
    return NextResponse.json({ error: "Failed to update team lane assignment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; slotId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get("teamId")

    if (!teamId) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 })
    }

    const { id, slotId } = await params

    await prisma.slotTeam.deleteMany({
      where: {
        tournamentSlotId: slotId,
        teamId: teamId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing team from slot:", error)
    return NextResponse.json({ error: "Failed to remove team from slot" }, { status: 500 })
  }
}
