import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const match = await prisma.tournamentMatch.findUnique({
      where: { id },
      include: {
        tournament: true,
        round: true,
        slotTeams: {
          include: {
            team: {
              include: {
                brand: true,
                teamMembers: {
                  include: {
                    member: true,
                  },
                  where: {
                    deletedAt: null,
                  },
                },
              },
            },
            lane: true,
          },
        },
      },
    })

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    return NextResponse.json(match)
  } catch (error) {
    console.error("Error fetching match:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
