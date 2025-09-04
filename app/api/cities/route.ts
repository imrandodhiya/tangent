import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const stateId = searchParams.get("stateId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(
      searchParams.get("pageSize") || searchParams.get("per_page") || searchParams.get("perPage") || "10",
    )
    const search = (searchParams.get("search") || searchParams.get("q") || "").trim()

    const where = {
      deletedAt: null,
      ...(stateId && stateId !== "all" && { stateId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { pincode: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [cities, total] = await Promise.all([
      prisma.city.findMany({
        where,
        include: {
          state: true,
          _count: {
            select: { users: true, brands: true, members: true, tournaments: true },
          },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.city.count({ where }),
    ])

    return NextResponse.json({
      cities,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching cities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, stateId, pincode, isActive, isDefault } = body

    // Check if city already exists in the same state
    const existingCity = await prisma.city.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        stateId,
        deletedAt: null,
      },
    })

    if (existingCity) {
      return NextResponse.json({ error: "City already exists in this state" }, { status: 400 })
    }

    // If this is set as default, unset other defaults in the same state
    if (isDefault) {
      await prisma.city.updateMany({
        where: {
          stateId,
          isDefault: true,
        },
        data: { isDefault: false },
      })
    }

    const city = await prisma.city.create({
      data: {
        name,
        stateId,
        pincode: pincode || null,
        isActive: isActive !== false,
        isDefault: isDefault || false,
      },
      include: {
        state: true,
      },
    })

    return NextResponse.json(city, { status: 201 })
  } catch (error) {
    console.error("Error creating city:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
