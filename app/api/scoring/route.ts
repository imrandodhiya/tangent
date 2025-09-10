import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BowlingScorer } from "@/lib/bowling-scoring"
import { emitToTournament } from "@/lib/websocket-server"

async function ensureOperatorOrAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  })
  const role = user?.role?.name
  return !!role && ["OPERATOR", "SCORER", "TOURNAMENT_OPERATOR", "ADMIN"].includes(role)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Enforce operator/admin roles
    const allowed = await ensureOperatorOrAdmin(session.user.id)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { matchId, teamMemberId, gameNumber, frames, handicap, tournamentId: bodyTournamentId } = body

    const calculatedFrames = BowlingScorer.calculateRunningTotal(frames)
    const totalScore = calculatedFrames[9]?.runningTotal || 0
    const finalScore = totalScore + (handicap || 0)

    const scoring = await prisma.scoring.upsert({
      where: {
        matchId_teamMemberId_gameNumber: {
          matchId,
          teamMemberId,
          gameNumber,
        },
      },
      update: {
        frames: JSON.stringify(calculatedFrames),
        totalScore,
        handicap: handicap || 0,
        finalScore,
        updatedAt: new Date(),
      },
      create: {
        matchId,
        teamMemberId,
        gameNumber,
        frames: JSON.stringify(calculatedFrames),
        totalScore,
        handicap: handicap || 0,
        finalScore,
      },
    })

    try {
      let tournamentId = bodyTournamentId as string | undefined
      if (!tournamentId) {
        try {
          // Attempt both direct and nested tournament relations depending on schema
          // @ts-ignore
          const match = await prisma.match.findUnique({
            where: { id: matchId },
            select: {
              tournamentId: true,
              tournamentRound: { select: { tournamentId: true } },
            },
          })
          tournamentId =
            (match?.tournamentId as string | undefined) ||
            // @ts-ignore
            (match?.tournamentRound?.tournamentId as string | undefined)
        } catch {
          // ignore failed lookup
        }
      }

      if (tournamentId) {
        emitToTournament(tournamentId, "score-updated", {
          matchId,
          teamMemberId,
          gameNumber,
          finalScore,
        })
      }
    } catch {
      // do not block response on emit errors
    }

    return NextResponse.json(scoring)
  } catch (error) {
    console.error("Error saving score:", error)
    return NextResponse.json({ error: "Failed to save score" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Enforce operator/admin roles for reading detailed scoring
    const allowed = await ensureOperatorOrAdmin(session.user.id)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get("matchId")
    const teamMemberId = searchParams.get("teamMemberId")

    if (!matchId) {
      return NextResponse.json({ error: "Match ID required" }, { status: 400 })
    }

    const where: any = { matchId }
    if (teamMemberId) {
      where.teamMemberId = teamMemberId
    }

    const scores = await prisma.scoring.findMany({
      where,
      include: {
        teamMember: {
          include: {
            member: true,
            team: true,
          },
        },
        match: true,
      },
      orderBy: [{ gameNumber: "asc" }, { teamMember: { member: { lastName: "asc" } } }],
    })

    return NextResponse.json(scores)
  } catch (error) {
    console.error("Error fetching scores:", error)
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 })
  }
}
