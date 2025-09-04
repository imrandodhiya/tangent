import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const slots = await prisma.tournamentSlot.findMany({
      where: {
        tournamentId: id,
        deletedAt: null,
      },
      include: {
        slotTeams: {
          where: { deletedAt: null },
          include: {
            team: {
              include: {
                brand: true,
              },
            },
          },
        },
      },
      orderBy: [{ roundNo: "asc" }, { matchNo: "asc" }, { slotNo: "asc" }],
    })

    return NextResponse.json(slots)
  } catch (error) {
    console.error("Error fetching tournament slots:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roundNo, matchNo, slotNo, name, laneNo, teamIds } = await request.json()

    // Create or update slot
    const slot = await prisma.tournamentSlot.upsert({
      where: {
        tournamentId_roundNo_matchNo_slotNo: {
          tournamentId: id,
          roundNo,
          matchNo,
          slotNo,
        },
      },
      update: {
        name,
        laneNo,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      },
      create: {
        tournamentId: id,
        roundNo,
        matchNo,
        slotNo,
        name,
        laneNo,
        createdBy: session.user.id,
      },
    })

    // Update slot teams
    if (teamIds && Array.isArray(teamIds)) {
      // Remove existing teams
      await prisma.slotTeam.updateMany({
        where: {
          slotId: slot.id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
          updatedBy: session.user.id,
        },
      })

      // Add new teams
      if (teamIds.length > 0) {
        await prisma.slotTeam.createMany({
          data: teamIds.map((teamId: string) => ({
            slotId: slot.id,
            teamId,
            createdBy: session.user.id,
          })),
        })
      }
    }

    const updatedSlot = await prisma.tournamentSlot.findUnique({
      where: { id: slot.id },
      include: {
        slotTeams: {
          where: { deletedAt: null },
          include: {
            team: {
              include: {
                brand: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedSlot)
  } catch (error) {
    console.error("Error creating/updating tournament slot:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
