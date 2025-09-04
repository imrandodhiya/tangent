import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const { id, memberId } = await params

    // Check jersey number uniqueness if provided
    const existingJersey = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        jerseyNo: data.jerseyNo,
        memberId: { not: memberId },
        deletedAt: null,
      },
    })

    if (existingJersey) {
      return NextResponse.json({ error: "Jersey number is already taken" }, { status: 400 })
    }

    const teamMember = await prisma.teamMember.updateMany({
      where: {
        teamId: id,
        memberId,
        deletedAt: null,
      },
      data: {
        roleInTeam: data.roleInTeam,
        jerseyNo: data.jerseyNo,
        positionNo: data.positionNo,
        isReplacement: data.isReplacement,
        replacementOfMemberId: data.replacementOfMemberId,
        updatedBy: session.user.id,
      },
    })

    if (teamMember.count === 0) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    // Return updated team member
    const updatedMember = await prisma.teamMember.findFirst({
      where: {
        teamId: id,
        memberId,
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
          },
        },
      },
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error("Error updating team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, memberId } = await params

    // Soft delete the team member
    const result = await prisma.teamMember.updateMany({
      where: {
        teamId: id,
        memberId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Team member removed successfully" })
  } catch (error) {
    console.error("Error removing team member:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
