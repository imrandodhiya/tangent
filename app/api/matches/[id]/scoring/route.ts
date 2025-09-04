import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const matchId = id

    // Get match details with teams and members
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true,
        homeTeam: {
          include: {
            teamMembers: {
              include: {
                member: true,
              },
            },
          },
        },
        awayTeam: {
          include: {
            teamMembers: {
              include: {
                member: true,
              },
            },
          },
        },
        scoring: {
          include: {
            teamMember: {
              include: {
                member: true,
                team: true,
              },
            },
          },
        },
      },
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    return NextResponse.json(match)
  } catch (error) {
    console.error("Error fetching match scoring:", error)
    return NextResponse.json({ error: "Failed to fetch match scoring" }, { status: 500 })
  }
}
