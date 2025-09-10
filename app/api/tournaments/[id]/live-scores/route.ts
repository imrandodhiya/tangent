import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Helper to build "last frame" snapshot from frames JSON
function buildLastFrameSnapshot(framesJson: string | any, totalScore: number, finalScore?: number) {
  const frames = typeof framesJson === "string" ? (JSON.parse(framesJson) as any[]) : (framesJson as any[])
  let lastIndex = -1
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i]
    if (f && (f.roll1 !== null || f.roll2 !== null || f.roll3 !== null)) lastIndex = i
  }
  if (lastIndex < 0) lastIndex = 0
  const f = frames[lastIndex] || {}
  const roll1 = f.roll1 ?? null
  const roll2 = f.roll2 ?? null
  const roll3 = f.roll3 ?? null
  const isStrike = !!f.isStrike
  const isSpare = !!f.isSpare
  const bestTotal = typeof finalScore === "number" ? finalScore : totalScore
  return {
    frame: lastIndex + 1,
    roll1,
    roll2,
    roll3,
    frameScore: f.frameScore ?? 0,
    totalScore: bestTotal ?? 0,
    isStrike,
    isSpare,
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tournamentId = params.id

    // Pull scoring records for tournament; include member+team and match with teams for team mapping
    const scoring = await prisma.scoring.findMany({
      where: {
        match: {
          tournament: { id: tournamentId },
        },
      },
      include: {
        teamMember: {
          include: {
            member: true,
            team: {
              include: {
                brand: true,
              },
            },
          },
        },
        match: {
          include: {
            teams: {
              include: {
                team: {
                  include: {
                    brand: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }],
    })

    const liveScores = scoring.map((s) => {
      const snap = buildLastFrameSnapshot(s.frames as unknown as string, s.totalScore ?? 0, s.finalScore ?? undefined)
      const fullName =
        s.teamMember.member?.firstName || s.teamMember.member?.lastName
          ? `${s.teamMember.member?.firstName ?? ""} ${s.teamMember.member?.lastName ?? ""}`.trim()
          : (s.teamMember.member?.name ?? "Player")
      return {
        id: s.id,
        frame: snap.frame,
        roll1: snap.roll1,
        roll2: snap.roll2,
        roll3: snap.roll3,
        frameScore: snap.frameScore,
        totalScore: snap.totalScore,
        isStrike: snap.isStrike,
        isSpare: snap.isSpare,
        member: {
          id: s.teamMember.member?.id ?? s.teamMember.id,
          name: fullName,
          gender: (s.teamMember.member as any)?.gender ?? "",
        },
        match: {
          teams: s.match.teams.map((mt) => ({
            team: {
              id: mt.team.id,
              name: mt.team.name,
              color: (mt.team as any).color ?? "",
              brand: { name: mt.team.brand?.name ?? "" },
            },
          })),
        },
      }
    })

    // Fix relation to SlotTeam.tournamentSlot per schema
    const teamPositions = await prisma.slotTeam.findMany({
      where: {
        tournamentSlot: {
          tournamentId,
        },
      },
      include: {
        team: {
          include: {
            brand: true,
          },
        },
        lane: {
          select: {
            id: true,
            laneNo: true,
          },
        },
      },
      orderBy: [{ positionNo: "asc" }],
    })

    // Return the raw objects; public pages read `{ team, lane: { laneNo }, positionNo }`
    return NextResponse.json({ liveScores, teamPositions })
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

    const tournamentId = params.id
    const { teamPositions } = await request.json()

    for (const position of teamPositions) {
      await prisma.slotTeam.updateMany({
        where: {
          teamId: position.teamId,
          tournamentSlot: {
            tournamentId,
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
