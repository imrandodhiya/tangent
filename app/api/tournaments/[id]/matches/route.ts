import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const matches = await prisma.tournamentMatch.findMany({
      where: {
        tournament: {
          id,
        },
      },
      include: {
        round: true,
        slotTeams: {
          include: {
            team: {
              include: {
                brand: true,
              },
            },
            lane: true,
          },
        },
      },
      orderBy: [{ round: { roundNo: "asc" } }, { name: "asc" }],
    })

    return NextResponse.json(matches)
  } catch (error) {
    console.error("Error fetching tournament matches:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
