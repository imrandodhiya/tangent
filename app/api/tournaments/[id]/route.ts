import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const tournament = await prisma.tournament.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        state: true,
        city: true,
        rounds: {
          where: { deletedAt: null },
          include: {
            tournamentMatches: {
              where: { deletedAt: null },
              orderBy: { matchNo: "asc" },
            },
          },
          orderBy: { roundNo: "asc" },
        },
        teams: {
          where: { deletedAt: null },
          include: {
            brand: true,
            teamMembers: {
              where: { deletedAt: null },
              include: {
                member: true,
              },
            },
          },
        },
        tournamentBrands: {
          where: { deletedAt: null },
          include: {
            brand: true,
          },
        },
      },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    return NextResponse.json(tournament)
  } catch (error) {
    console.error("Error fetching tournament:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        stateId: data.stateId,
        cityId: data.cityId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        visibility: data.visibility,
        status: data.status,
        brandsCount: data.brandsCount,
        teamsPerBrand: data.teamsPerBrand,
        playersPerTeam: data.playersPerTeam,
        malePerTeam: data.malePerTeam,
        femalePerTeam: data.femalePerTeam,
        lanesTotal: data.lanesTotal,
        framesPerGame: data.framesPerGame,
        handicapBaseScore: data.handicapBaseScore,
        handicapPercent: data.handicapPercent,
        femaleAdjustmentPins: data.femaleAdjustmentPins,
        allowManualOverride: data.allowManualOverride,
        requireDualApproval: data.requireDualApproval,
        laneRotationEnabled: data.laneRotationEnabled,
        youtubeLiveUrl: data.youtubeLiveUrl,
        updatedBy: session.user.id,
      },
      include: {
        state: true,
        city: true,
      },
    })

    return NextResponse.json(tournament)
  } catch (error) {
    console.error("Error updating tournament:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await prisma.tournament.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    })

    return NextResponse.json({ message: "Tournament deleted successfully" })
  } catch (error) {
    console.error("Error deleting tournament:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
