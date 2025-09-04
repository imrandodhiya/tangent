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
    const tournamentBrands = await prisma.tournamentBrand.findMany({
      where: {
        tournamentId: id,
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
      orderBy: {
        createdAt: "asc",
      },
    })

    return NextResponse.json(tournamentBrands)
  } catch (error) {
    console.error("Error fetching tournament brands:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Check if brand is already assigned to this tournament
    const existingAssignment = await prisma.tournamentBrand.findFirst({
      where: {
        tournamentId: id,
        brandId: data.brandId,
        deletedAt: null,
      },
    })

    if (existingAssignment) {
      return NextResponse.json({ error: "Brand is already assigned to this tournament" }, { status: 400 })
    }

    const tournamentBrand = await prisma.tournamentBrand.create({
      data: {
        tournamentId: id,
        brandId: data.brandId,
        numberOfTeams: data.numberOfTeams,
        createdBy: session.user.id,
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

    return NextResponse.json(tournamentBrand, { status: 201 })
  } catch (error) {
    console.error("Error creating tournament brand:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
