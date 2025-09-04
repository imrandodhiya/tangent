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
      ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    }

    const [states, total] = await Promise.all([
      prisma.state.findMany({
        where,
        include: {
          _count: {
            select: { cities: true, users: true, brands: true, members: true, tournaments: true },
          },
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.state.count({ where }),
    ])

    return NextResponse.json({
      states,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching states:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, isDefault } = body

    // Check if state already exists
    const existingState = await prisma.state.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    })

    if (existingState) {
      return NextResponse.json({ error: "State already exists" }, { status: 400 })
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.state.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const state = await prisma.state.create({
      data: {
        name,
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json(state, { status: 201 })
  } catch (error) {
    console.error("Error creating state:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
