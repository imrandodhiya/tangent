import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const tournamentId = id

    // Get live scores with team and member details
    const liveScores = await prisma.score.findMany({
      where: {
        match: {
          tournament: {
            id: tournamentId,
          },
        },
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            gender: true,
          },
        },
        match: {
          include: {
            teams: {
              include: {
                team: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                    brand: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ match: { id: "asc" } }, { member: { name: "asc" } }, { frame: "asc" }],
    })

    // Get team positions
    const teamPositions = await prisma.slotTeam.findMany({
      where: {
        slot: {
          tournament: {
            id: tournamentId,
          },
        },
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            color: true,
            brand: {
              select: {
                name: true,
              },
            },
          },
        },
        lane: {
          select: {
            id: true,
            laneNo: true,
          },
        },
      },
    })

    return NextResponse.json({
      liveScores,
      teamPositions,
    })
  } catch (error) {
    console.error("Error fetching live scores:", error)
    return NextResponse.json({ error: "Failed to fetch live scores" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { teamPositions } = await request.json()
    const tournamentId = id

    // Update team positions
    for (const position of teamPositions) {
      await prisma.slotTeam.updateMany({
        where: {
          teamId: position.teamId,
          slot: {
            tournamentId: tournamentId,
          },
        },
        data: {
          laneId: position.laneId,
          positionNo: position.position,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating team positions:", error)
    return NextResponse.json({ error: "Failed to update team positions" }, { status: 500 })
  }
}
