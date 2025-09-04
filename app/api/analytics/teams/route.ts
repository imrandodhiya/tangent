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

    const teams = await prisma.team.findMany({
      where: tournamentId ? { tournamentId } : {},
      include: {
        tournament: true,
        teamMembers: {
          include: {
            member: true,
            scoring: true,
          },
        },
        homeMatches: {
          include: {
            scoring: true,
          },
        },
        awayMatches: {
          include: {
            scoring: true,
          },
        },
      },
    })

    const analytics = teams.map((team) => {
      const allMatches = [...team.homeMatches, ...team.awayMatches]
      const completedMatches = allMatches.filter((match) => match.status === "COMPLETED")

      // Calculate team scores for each match
      const teamMatchScores = completedMatches.map((match) => {
        const teamScores = match.scoring.filter((score) => team.teamMembers.some((tm) => tm.id === score.teamMemberId))
        return teamScores.reduce((sum, score) => sum + score.finalScore, 0)
      })

      const wins = completedMatches.filter((match) => {
        const teamScore = match.scoring
          .filter((score) => team.teamMembers.some((tm) => tm.id === score.teamMemberId))
          .reduce((sum, score) => sum + score.finalScore, 0)

        const opponentScore = match.scoring
          .filter((score) => !team.teamMembers.some((tm) => tm.id === score.teamMemberId))
          .reduce((sum, score) => sum + score.finalScore, 0)

        return teamScore > opponentScore
      }).length

      const memberStats = team.teamMembers.map((tm) => {
        const memberScores = tm.scoring.map((s) => s.totalScore)
        return {
          id: tm.member.id,
          name: `${tm.member.firstName} ${tm.member.lastName}`,
          average: tm.member.average,
          currentAverage:
            memberScores.length > 0
              ? Math.round(memberScores.reduce((sum, score) => sum + score, 0) / memberScores.length)
              : 0,
          gamesPlayed: memberScores.length,
          highGame: memberScores.length > 0 ? Math.max(...memberScores) : 0,
        }
      })

      return {
        id: team.id,
        name: team.name,
        tournament: team.tournament.name,
        wins,
        losses: completedMatches.length - wins,
        winPercentage: completedMatches.length > 0 ? Math.round((wins / completedMatches.length) * 100) : 0,
        totalMatches: allMatches.length,
        completedMatches: completedMatches.length,
        teamAverage:
          teamMatchScores.length > 0
            ? Math.round(teamMatchScores.reduce((sum, score) => sum + score, 0) / teamMatchScores.length)
            : 0,
        highTeamGame: teamMatchScores.length > 0 ? Math.max(...teamMatchScores) : 0,
        memberCount: team.teamMembers.length,
        members: memberStats,
      }
    })

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching team analytics:", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
