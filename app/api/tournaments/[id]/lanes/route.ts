import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth-middleware"
import { prisma } from "@/lib/prisma"

// Get all available lanes for tournament operator assignment
export const GET = withAuth(async (req, { params }) => {
  try {
    const { id } = await params
    const tournamentId = id

    // Verify tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId, deletedAt: null },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    // Get all active lanes - operators can be assigned to any lane for any tournament
    const lanes = await prisma.lane.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      orderBy: { laneNo: "asc" },
      select: {
        id: true,
        laneNo: true,
        venueName: true,
      },
    })

    return NextResponse.json(lanes)
  } catch (error) {
    console.error("Error fetching tournament lanes:", error)
    return NextResponse.json({ error: "Failed to fetch lanes" }, { status: 500 })
  }
})
