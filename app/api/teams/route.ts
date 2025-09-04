import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get("tournamentId")
    const brandId = searchParams.get("brandId")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(
      searchParams.get("pageSize") || searchParams.get("per_page") || searchParams.get("perPage") || "10",
    )
    const search = (searchParams.get("search") || searchParams.get("q") || "").trim()

    const where = {
      deletedAt: null,
      ...(tournamentId && tournamentId !== "all" && { tournamentId }),
      ...(brandId && brandId !== "all" && { brandId }),
      ...(search && { name: { contains: search, mode: "insensitive" as const } }),
    }

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          tournament: { select: { name: true, status: true } },
          brand: true,
          teamMembers: {
            where: { deletedAt: null },
            include: { member: true },
            orderBy: { roleInTeam: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.team.count({ where }),
    ])

    return NextResponse.json({
      teams,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching teams:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()

    // Check if team name is unique within tournament
    const existingTeam = await prisma.team.findFirst({
      where: {
        tournamentId: data.tournamentId,
        name: data.name,
        deletedAt: null,
      },
    })

    if (existingTeam) {
      return NextResponse.json({ error: "Team name must be unique within tournament" }, { status: 400 })
    }

    const team = await prisma.team.create({
      data: {
        tournamentId: data.tournamentId,
        brandId: data.brandId,
        name: data.name,
        baseName: data.baseName || data.name,
        suffix: data.suffix,
        logoUrl: data.logoUrl,
        color: data.color,
        seedNo: data.seedNo,
        createdBy: session.user.id,
      },
      include: {
        tournament: true,
        brand: true,
      },
    })

    return NextResponse.json(team, { status: 201 })
  } catch (error) {
    console.error("Error creating team:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
