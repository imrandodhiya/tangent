import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const state = await prisma.state.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            cities: true,
            users: true,
            brands: true,
            members: true,
            tournaments: true,
          },
        },
      },
    })

    if (!state) {
      return NextResponse.json({ error: "State not found" }, { status: 404 })
    }

    return NextResponse.json(state)
  } catch (error) {
    console.error("Error fetching state:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, isDefault } = body

    // Check if another state with the same name exists
    const existingState = await prisma.state.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        id: { not: id },
        deletedAt: null,
      },
    })

    if (existingState) {
      return NextResponse.json({ error: "State name already exists" }, { status: 400 })
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.state.updateMany({
        where: {
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      })
    }

    const state = await prisma.state.update({
      where: { id },
      data: {
        name,
        isDefault: isDefault || false,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(state)
  } catch (error) {
    console.error("Error updating state:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    // Check if state has dependencies
    const state = await prisma.state.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            cities: true,
            users: true,
            brands: true,
            members: true,
            tournaments: true,
          },
        },
      },
    })

    if (!state) {
      return NextResponse.json({ error: "State not found" }, { status: 404 })
    }

    const totalDependencies = Object.values(state._count).reduce((sum, count) => sum + count, 0)

    if (totalDependencies > 0) {
      return NextResponse.json(
        { error: "Cannot delete state with existing cities, users, brands, members, or tournaments" },
        { status: 400 },
      )
    }

    // Soft delete the state
    await prisma.state.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "State deleted successfully" })
  } catch (error) {
    console.error("Error deleting state:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
