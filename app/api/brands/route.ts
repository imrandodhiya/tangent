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
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(
      searchParams.get("pageSize") || searchParams.get("per_page") || searchParams.get("perPage") || "10",
    )
    const search = (searchParams.get("search") || searchParams.get("q") || "").trim()
    const stateId = searchParams.get("stateId")
    const isActive = searchParams.get("isActive")

    const skip = (page - 1) * pageSize

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { contactName: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(stateId && { stateId }),
      ...(isActive !== null && isActive !== "" && { isActive: isActive === "true" }),
    }

    const [brands, total] = await Promise.all([
      prisma.brand.findMany({
        where,
        include: {
          state: true,
          city: true,
          members: { where: { deletedAt: null }, select: { id: true } },
          teams: { where: { deletedAt: null }, select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.brand.count({ where }),
    ])

    return NextResponse.json({
      brands: brands.map((brand) => ({
        ...brand,
        membersCount: brand.members.length,
        teamsCount: brand.teams.length,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("Error fetching brands:", error)
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

    const brand = await prisma.brand.create({
      data: {
        name: data.name,
        description: data.description,
        stateId: data.stateId,
        cityId: data.cityId,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        isActive: data.isActive ?? true,
        createdBy: session.user.id,
      },
      include: {
        state: true,
        city: true,
      },
    })

    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    console.error("Error creating brand:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
