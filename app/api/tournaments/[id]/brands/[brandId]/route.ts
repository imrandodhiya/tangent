import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest, { params }: { params: { id: string; brandId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    const { id, brandId } = await params

    const tournamentBrand = await prisma.tournamentBrand.updateMany({
      where: {
        tournamentId: id,
        brandId: brandId,
        deletedAt: null,
      },
      data: {
        numberOfTeams: data.numberOfTeams,
        updatedBy: session.user.id,
      },
    })

    if (tournamentBrand.count === 0) {
      return NextResponse.json({ error: "Tournament brand assignment not found" }, { status: 404 })
    }

    // Return updated assignment
    const updatedAssignment = await prisma.tournamentBrand.findFirst({
      where: {
        tournamentId: id,
        brandId: brandId,
        deletedAt: null,
      },
      include: {
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
      },
    })

    return NextResponse.json(updatedAssignment)
  } catch (error) {
    console.error("Error updating tournament brand:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string; brandId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, brandId } = await params

    // Soft delete the tournament brand assignment
    const result = await prisma.tournamentBrand.updateMany({
      where: {
        tournamentId: id,
        brandId: brandId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: "Tournament brand assignment not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Brand assignment removed successfully" })
  } catch (error) {
    console.error("Error deleting tournament brand:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
