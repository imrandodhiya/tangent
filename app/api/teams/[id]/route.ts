import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const team = await prisma.team.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,
            playersPerTeam: true,
            malePerTeam: true,
            femalePerTeam: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            contactName: true,
            contactEmail: true,
          },
        },
        teamMembers: {
          where: { deletedAt: null },
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                gender: true,
                mobile: true,
                email: true,
                photoUrl: true,
                experienceYears: true,
              },
            },
          },
          orderBy: [{ roleInTeam: "asc" }, { member: { firstName: "asc" } }],
        },
        slotTeams: {
          include: {
            tournamentSlot: {
              select: {
                id: true,
                slotNo: true,
                name: true,
                scheduledAt: true,
              },
            },
            lane: {
              select: {
                id: true,
                laneNo: true,
                venueName: true,
              },
            },
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    console.log("Team API - Tournament data from DB:", {
      id: team.tournament.id,
      name: team.tournament.name,
      playersPerTeam: team.tournament.playersPerTeam,
      malePerTeam: team.tournament.malePerTeam,
      femalePerTeam: team.tournament.femalePerTeam,
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error("Error fetching team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Check if team name is unique within tournament (excluding current team)
    if (data.name) {
      const existingTeam = await prisma.team.findFirst({
        where: {
          tournamentId: data.tournamentId,
          name: data.name,
          id: { not: id },
          deletedAt: null,
        },
      })

      if (existingTeam) {
        return NextResponse.json({ error: "Team name must be unique within tournament" }, { status: 400 })
      }
    }

    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.baseName && { baseName: data.baseName }),
        ...(data.suffix !== undefined && { suffix: data.suffix }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.seedNo !== undefined && { seedNo: data.seedNo }),
        updatedBy: session.user.id,
      },
      include: {
        tournament: true,
        brand: true,
        teamMembers: {
          where: { deletedAt: null },
          include: {
            member: true,
          },
        },
      },
    })

    return NextResponse.json(team)
  } catch (error) {
    console.error("Error updating team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Soft delete the team
    await prisma.team.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    })

    return NextResponse.json({ message: "Team deleted successfully" })
  } catch (error) {
    console.error("Error deleting team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
