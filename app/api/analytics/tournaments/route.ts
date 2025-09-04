import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get("tournamentId")

    // Tournament overview stats
    const tournaments = await prisma.tournament.findMany({
      where: tournamentId ? { id: tournamentId } : {},
      include: {
        teams: {
          include: {
            teamMembers: {
              include: {
                member: true,
                scoring: true,
              },
            },
          },
        },
        matches: {
          include: {
            scoring: true,
          },
        },
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
    })

    const analytics = tournaments.map((tournament) => {
      const totalMembers = tournament.teams.reduce((sum, team) => sum + team.teamMembers.length, 0)
      const completedMatches = tournament.matches.filter((match) => match.status === "COMPLETED").length
      const totalGames = tournament.matches.reduce((sum, match) => {
        return sum + match.scoring.length
      }, 0)

      // Calculate average scores
      const allScores = tournament.teams.flatMap((team) =>
        team.teamMembers.flatMap((tm) => tm.scoring.map((s) => s.finalScore)),
      )
      const averageScore =
        allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0

      // High game and series
      const highGame = allScores.length > 0 ? Math.max(...allScores) : 0

      return {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status,
        totalTeams: tournament._count.teams,
        totalMembers,
        completedMatches,
        totalMatches: tournament.matches.length,
        totalGames,
        averageScore: Math.round(averageScore),
        highGame,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
      }
    })

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching tournament analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
