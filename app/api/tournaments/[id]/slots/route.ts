import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { emitToTournament } from "@/lib/websocket-server" // add emit utility for realtime

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const slots = await prisma.tournamentSlot.findMany({
      where: { tournamentId: id, deletedAt: null },
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
      orderBy: [{ tournamentRound: { roundNo: "asc" } }, { slotNo: "asc" }],
    })

    // Provide compatibility props expected by existing UI:
    // - roundNo from related tournamentRound
    // - matchNo: default 1 (no match entity tied to slots)
    // - laneNo: first assigned lane's laneNo if any
    const withCompat = slots.map((s) => {
      const laneNo = s.slotTeams.find((st) => st.lane)?.lane?.laneNo ?? null
      return {
        ...s,
        roundNo: s.tournamentRound.roundNo,
        matchNo: 1,
        laneNo,
      }
    })

    return NextResponse.json(withCompat)
  } catch (error) {
    console.error("Error fetching tournament slots:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Accept legacy body fields and map to schema
    const { roundNo, matchNo, slotNo, name, laneNo, teamIds } = await request.json()

    if (!slotNo || !roundNo) {
      return NextResponse.json({ error: "slotNo and roundNo are required" }, { status: 400 })
    }

    // Locate the round for this tournament
    const round = await prisma.tournamentRound.findFirst({
      where: { tournamentId: id, roundNo, deletedAt: null },
    })
    if (!round) {
      return NextResponse.json({ error: `Round ${roundNo} not found for tournament` }, { status: 404 })
    }

    const compositeSlotNo = matchNo ? (matchNo - 1) * 10 + slotNo : slotNo

    // Find existing slot by (tournamentId, roundId, compositeSlotNo)
    const existing = await prisma.tournamentSlot.findFirst({
      where: {
        tournamentId: id,
        tournamentRoundId: round.id,
        slotNo: compositeSlotNo,
        deletedAt: null,
      },
    })

    const slot =
      existing &&
      (await prisma.tournamentSlot.update({
        where: { id: existing.id },
        data: {
          name: name ?? existing.name,
          tournamentRoundId: round.id,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        },
      }))
      console.log("tournamentSlot Name", `Round ${roundNo} M${matchNo || 1} Slot ${slotNo}`)
    const created =
      !existing &&
      (await prisma.tournamentSlot.create({
        data: {
          tournamentId: id,
          tournamentRoundId: round.id,
          slotNo: compositeSlotNo, // Use composite slot number to avoid conflicts
          name: name ?? `Round ${roundNo} M${matchNo || 1} Slot ${slotNo}`,
          createdBy: session.user.id,
        },
      }))

    const finalSlot = slot ?? created!
    // Reset slot teams if teamIds provided
    if (Array.isArray(teamIds)) {
      await prisma.slotTeam.deleteMany({
        where: { tournamentSlotId: finalSlot.id },
      })

      if (teamIds.length > 0) {
        // Optional laneNo -> resolve laneId if present
        let laneId: string | undefined = undefined
        if (laneNo) {
          const lane = await prisma.lane.findFirst({ where: { laneNo } })
          if (lane) laneId = lane.id
        }
        await prisma.slotTeam.createMany({
          data: teamIds.map((teamId: string, idx: number) => ({
            tournamentSlotId: finalSlot.id,
            teamId,
            laneId,
            positionNo: idx + 1,
            seed: idx + 1,
            createdAt: new Date(),
          })),
        })
      }
    }

    const updatedSlot = await prisma.tournamentSlot.findUnique({
      where: { id: finalSlot.id },
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

    if (!updatedSlot) return NextResponse.json({ error: "Slot not found after update" }, { status: 404 })

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
      matchNo: 1,
      laneNo: laneNoCompat,
    })
  } catch (error) {
    console.error("Error creating/updating tournament slot:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
