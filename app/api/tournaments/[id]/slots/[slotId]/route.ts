import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { emitToTournament } from "@/lib/websocket-server"

export async function PUT(request: NextRequest, { params }: { params: { id: string; slotId: string } }) {
  try {
    const { id, slotId } = params
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { roundNo, matchNo, slotNo, name } = await request.json()

    // Find the tournament round
    const round = await prisma.tournamentRound.findFirst({
      where: { tournamentId: id, roundNo, deletedAt: null },
    })
    if (!round) {
      return NextResponse.json({ error: `Round ${roundNo} not found for tournament` }, { status: 404 })
    }

    // Update the slot
    const updatedSlot = await prisma.tournamentSlot.update({
      where: { id: slotId },
      data: {
        name: name,
        tournamentRoundId: round.id,
        slotNo: slotNo,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      },
      include: {
        tournamentRound: true,
        slotTeams: {
          where: { deletedAt: null },
          include: {
            team: { include: { brand: true } },
            lane: true,
          },
        },
      },
    })

    const laneNoCompat = updatedSlot.slotTeams.find((st) => st.lane)?.lane?.laneNo ?? null

    try {
      emitToTournament(id, "slots-updated", {
        tournamentId: id,
        slotId: updatedSlot.id,
        roundNo: updatedSlot.tournamentRound.roundNo,
        slotNo: updatedSlot.slotNo,
        laneNo: laneNoCompat,
        teamCount: updatedSlot.slotTeams.length,
      })
    } catch (error) {
      console.error("Error emitting tournament slots update:", error)
    }

    return NextResponse.json({
      ...updatedSlot,
      roundNo: updatedSlot.tournamentRound.roundNo,
      matchNo: matchNo || 1,
      laneNo: laneNoCompat,
    })
  } catch (error) {
    console.error("Error updating tournament slot:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; slotId: string } }) {
  try {
    const { id, slotId } = params
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Soft delete the slot
    await prisma.tournamentSlot.update({
      where: { id: slotId },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    })

    try {
      emitToTournament(id, "slot-deleted", {
        tournamentId: id,
        slotId: slotId,
      })
    } catch (error) {
      console.error("Error emitting slot deletion:", error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting tournament slot:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
