import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const lane = await prisma.lane.findUnique({
      where: {
        id,
        deletedAt: null,
      },
    })

    if (!lane) {
      return NextResponse.json({ error: "Lane not found" }, { status: 404 })
    }

    return NextResponse.json(lane)
  } catch (error) {
    console.error("Error fetching lane:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { laneNo, venueName, isActive, notes } = body

    // Check if another lane with the same number exists
    const existingLane = await prisma.lane.findFirst({
      where: {
        laneNo,
        id: { not: id },
        deletedAt: null,
      },
    })

    if (existingLane) {
      return NextResponse.json({ error: "Lane number already exists" }, { status: 400 })
    }

    const lane = await prisma.lane.update({
      where: { id },
      data: {
        laneNo,
        venueName: venueName || null,
        isActive: isActive !== false,
        notes: notes || null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(lane)
  } catch (error) {
    console.error("Error updating lane:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    // Check if lane has dependencies (slot teams)
    const slotTeamsCount = await prisma.slotTeam.count({
      where: { laneId: id },
    })

    if (slotTeamsCount > 0) {
      return NextResponse.json({ error: "Cannot delete lane with existing tournament assignments" }, { status: 400 })
    }

    // Soft delete the lane
    await prisma.lane.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Lane deleted successfully" })
  } catch (error) {
    console.error("Error deleting lane:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
