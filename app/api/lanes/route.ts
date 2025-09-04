import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(
      searchParams.get("pageSize") || searchParams.get("per_page") || searchParams.get("perPage") || "10",
    )
    const search = (searchParams.get("search") || searchParams.get("q") || "").trim()

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { venueName: { contains: search, mode: "insensitive" as const } },
          // allow numeric search for laneNo
          { laneNo: !Number.isNaN(Number(search)) ? Number(search) : undefined } as any,
        ].filter(Boolean),
      }),
    }

    const [lanes, total] = await Promise.all([
      prisma.lane.findMany({
        where,
        orderBy: { laneNo: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lane.count({ where }),
    ])

    return NextResponse.json({
      lanes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching lanes:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { laneNo, venueName, isActive, notes } = body

    // Check if lane number already exists
    const existingLane = await prisma.lane.findFirst({
      where: {
        laneNo,
        deletedAt: null,
      },
    })

    if (existingLane) {
      return NextResponse.json({ error: "Lane number already exists" }, { status: 400 })
    }

    const lane = await prisma.lane.create({
      data: {
        laneNo,
        venueName: venueName || null,
        isActive: isActive !== false,
        notes: notes || null,
      },
    })

    return NextResponse.json(lane, { status: 201 })
  } catch (error) {
    console.error("Error creating lane:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
