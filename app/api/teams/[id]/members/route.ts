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
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        teamId: id,
        deletedAt: null,
      },
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
            brandId: true,
          },
        },
      },
      orderBy: [{ roleInTeam: "asc" }, { member: { firstName: "asc" } }],
    })

    return NextResponse.json(teamMembers)
  } catch (error) {
    console.error("Error fetching team members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Get team details for validation
    const team = await prisma.team.findFirst({
      where: { id, deletedAt: null },
      include: {
        tournament: {
          select: {
            playersPerTeam: true,
            malePerTeam: true,
            femalePerTeam: true,
          },
        },
        teamMembers: {
          where: { deletedAt: null },
          include: {
            member: { select: { gender: true } },
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 })
    }

    // Check if member is already in this team
    const existingMember = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        memberId: data.memberId,
        deletedAt: null,
      },
    })

    if (existingMember) {
      return NextResponse.json({ error: "Member is already in this team" }, { status: 400 })
    }

    // Get member details for gender validation
    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
      select: { gender: true },
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    // Validate team size limits
    const currentMembers = team.teamMembers.length
    if (currentMembers >= team.tournament.playersPerTeam) {
      return NextResponse.json({ error: "Team is already at maximum capacity" }, { status: 400 })
    }

    // Validate gender distribution
    const currentMale = team.teamMembers.filter((tm) => tm.member.gender === "MALE").length
    const currentFemale = team.teamMembers.filter((tm) => tm.member.gender === "FEMALE").length

    if (member.gender === "MALE" && currentMale >= team.tournament.malePerTeam) {
      return NextResponse.json({ error: "Team already has maximum number of male players" }, { status: 400 })
    }

    if (member.gender === "FEMALE" && currentFemale >= team.tournament.femalePerTeam) {
      return NextResponse.json({ error: "Team already has maximum number of female players" }, { status: 400 })
    }

    // Check jersey number uniqueness if provided
    if (data.jerseyNo) {
      const existingJersey = await prisma.teamMember.findFirst({
        where: {
          teamId: id,
          jerseyNo: data.jerseyNo,
          deletedAt: null,
        },
      })

      if (existingJersey) {
        return NextResponse.json({ error: "Jersey number is already taken" }, { status: 400 })
      }
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        teamId: id,
        memberId: data.memberId,
        roleInTeam: data.roleInTeam || "PLAYER",
        jerseyNo: data.jerseyNo,
        positionNo: data.positionNo,
        isReplacement: data.isReplacement || false,
        replacementOfMemberId: data.isReplacement && data.replacementOfMemberId ? data.replacementOfMemberId : null,
        createdBy: session.user.id,
      },
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
    })

    return NextResponse.json(teamMember, { status: 201 })
  } catch (error) {
    console.error("Error adding team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
