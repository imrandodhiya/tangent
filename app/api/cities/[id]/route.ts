import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const city = await prisma.city.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        state: true,
        _count: {
          select: {
            users: true,
            brands: true,
            members: true,
            tournaments: true,
          },
        },
      },
    })

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 })
    }

    return NextResponse.json(city)
  } catch (error) {
    console.error("Error fetching city:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, stateId, pincode, isActive, isDefault } = body

    // Check if another city with the same name exists in the same state
    const existingCity = await prisma.city.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        stateId,
        id: { not: id },
        deletedAt: null,
      },
    })

    if (existingCity) {
      return NextResponse.json({ error: "City name already exists in this state" }, { status: 400 })
    }

    // If this is set as default, unset other defaults in the same state
    if (isDefault) {
      await prisma.city.updateMany({
        where: {
          stateId,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      })
    }

    const city = await prisma.city.update({
      where: { id },
      data: {
        name,
        stateId,
        pincode: pincode || null,
        isActive: isActive !== false,
        isDefault: isDefault || false,
        updatedAt: new Date(),
      },
      include: {
        state: true,
      },
    })

    return NextResponse.json(city)
  } catch (error) {
    console.error("Error updating city:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    // Check if city has dependencies
    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            brands: true,
            members: true,
            tournaments: true,
          },
        },
      },
    })

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 })
    }

    const totalDependencies = Object.values(city._count).reduce((sum, count) => sum + count, 0)

    if (totalDependencies > 0) {
      return NextResponse.json(
        { error: "Cannot delete city with existing users, brands, members, or tournaments" },
        { status: 400 },
      )
    }

    // Soft delete the city
    await prisma.city.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "City deleted successfully" })
  } catch (error) {
    console.error("Error deleting city:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
