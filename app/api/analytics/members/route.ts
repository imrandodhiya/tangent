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
    const memberId = searchParams.get("memberId")
    const tournamentId = searchParams.get("tournamentId")

    const members = await prisma.member.findMany({
      where: memberId ? { id: memberId } : {},
      include: {
        teamMembers: {
          where: tournamentId ? { team: { tournamentId } } : {},
          include: {
            scoring: {
              orderBy: { createdAt: "asc" },
            },
            team: {
              include: {
                tournament: true,
              },
            },
          },
        },
      },
    })

    const analytics = members.map((member) => {
      const allScores = member.teamMembers.flatMap((tm) => tm.scoring)
      const gameScores = allScores.map((s) => s.totalScore)
      const finalScores = allScores.map((s) => s.finalScore)

      const stats = {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email,
        average: member.average,
        totalGames: gameScores.length,
        currentAverage:
          gameScores.length > 0 ? Math.round(gameScores.reduce((sum, score) => sum + score, 0) / gameScores.length) : 0,
        highGame: gameScores.length > 0 ? Math.max(...gameScores) : 0,
        highSeries: 0, // Calculate 3-game series
        lowGame: gameScores.length > 0 ? Math.min(...gameScores) : 0,
        tournaments: member.teamMembers.length,
        recentScores: gameScores.slice(-10), // Last 10 games
        scoringTrend: [], // Calculate trend
      }

      // Calculate high series (3 consecutive games)
      if (gameScores.length >= 3) {
        let highSeries = 0
        for (let i = 0; i <= gameScores.length - 3; i++) {
          const series = gameScores[i] + gameScores[i + 1] + gameScores[i + 2]
          if (series > highSeries) {
            highSeries = series
          }
        }
        stats.highSeries = highSeries
      }

      // Calculate scoring trend (last 10 games vs previous 10)
      if (gameScores.length >= 10) {
        const recent10 = gameScores.slice(-10)
        const previous10 = gameScores.slice(-20, -10)
        const recentAvg = recent10.reduce((sum, score) => sum + score, 0) / recent10.length
        const previousAvg =
          previous10.length > 0 ? previous10.reduce((sum, score) => sum + score, 0) / previous10.length : recentAvg
        stats.scoringTrend = gameScores.map((score, index) => ({
          game: index + 1,
          score,
          average: gameScores.slice(0, index + 1).reduce((sum, s) => sum + s, 0) / (index + 1),
        }))
      }

      return stats
    })

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching member analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
