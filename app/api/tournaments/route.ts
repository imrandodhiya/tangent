import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { TournamentStatus, TournamentVisibility } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(
      searchParams.get("pageSize") || searchParams.get("per_page") || searchParams.get("perPage") || "10",
    )
    const search = (searchParams.get("search") || searchParams.get("q") || "").trim()
    const status = searchParams.get("status") as TournamentStatus | null
    const visibility = searchParams.get("visibility") as TournamentVisibility | null

    const skip = (page - 1) * pageSize

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(status && status !== ("all" as any) && { status }),
      ...(visibility && visibility !== ("all" as any) && { visibility }),
    }

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        include: {
          state: true,
          city: true,
          teams: { where: { deletedAt: null }, select: { id: true } },
          rounds: { where: { deletedAt: null }, select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.tournament.count({ where }),
    ])

    return NextResponse.json({
      tournaments: tournaments.map((t) => ({
        ...t,
        teamsCount: t.teams.length,
        roundsCount: t.rounds.length,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching tournaments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const result = await prisma.$transaction(async (tx) => {
      // Create the tournament
      const tournament = await tx.tournament.create({
        data: {
          name: data.name,
          description: data.description,
          stateId: data.stateId,
          cityId: data.cityId,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          visibility: data.visibility || TournamentVisibility.PUBLIC,
          status: TournamentStatus.DRAFT,
          noOfRounds: data.noOfRounds || 4, // Added noOfRounds field
          brandsCount: data.brandsCount,
          teamsPerBrand: data.teamsPerBrand,
          playersPerTeam: data.playersPerTeam,
          malePerTeam: data.malePerTeam,
          femalePerTeam: data.femalePerTeam,
          lanesTotal: data.lanesTotal,
          framesPerGame: data.framesPerGame || 10,
          handicapBaseScore: data.handicapBaseScore,
          handicapPercent: data.handicapPercent,
          femaleAdjustmentPins: data.femaleAdjustmentPins,
          allowManualOverride: data.allowManualOverride ?? true,
          requireDualApproval: data.requireDualApproval ?? false,
          laneRotationEnabled: data.laneRotationEnabled ?? false,
          youtubeLiveUrl: data.youtubeLiveUrl,
          createdBy: session.user.id,
        },
      })

      // Create tournament rounds if provided
      if (data.rounds && Array.isArray(data.rounds)) {
        const roundsData = data.rounds.map((round: any) => ({
          tournamentId: tournament.id,
          roundNo: round.roundNo,
          name: round.name,
          isKnockout: round.isKnockout ?? true,
          teamsIn: round.teamsIn,
          teamsOut: round.teamsOut,
          teamsAdvancing: round.teamsIn && round.teamsOut ? round.teamsIn - round.teamsOut : undefined,
          matchesCount: round.matchesCount,
          aggregationScope: round.aggregationScope || "ROUND",
          aggregationMetric: round.aggregationMetric || "TEAM_TOTAL",
          createdBy: session.user.id,
        }))

        await tx.tournamentRound.createMany({
          data: roundsData,
        })
      }

      // Return tournament with related data
      return await tx.tournament.findUnique({
        where: { id: tournament.id },
        include: {
          state: true,
          city: true,
          rounds: {
            where: { deletedAt: null },
            orderBy: { roundNo: "asc" },
          },
        },
      })
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error("Error creating tournament:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
