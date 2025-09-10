import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const brand = await prisma.brand.findFirst({
      where: { id, deletedAt: null },
      include: {
        state: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
        members: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            mobile: true,
            email: true,
          },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        },
        teams: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
                startDate: true,
              },
            },
            teamMembers: {
              where: { deletedAt: null },
              select: {
                member: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: [{ name: "asc" }],
        },
        tournamentBrands: {
          where: { deletedAt: null },
          select: {
            numberOfTeams: true,
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
                startDate: true,
              },
            },
          },
          orderBy: [{ tournament: { startDate: "desc" } }],
        },
      },
    })
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    return NextResponse.json(brand)
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch brand" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = params
    const body = await req.json().catch(() => ({}) as any)

    const {
      name,
      code,
      isActive,
      description,
      logoUrl,
      primaryColor,
      secondaryColor,
      contactName,
      contactEmail,
      contactPhone,
      website,
      stateId,
      cityId,
      bannerUrl,
      tshirtUrl,
    } = body ?? {}

    if (name !== undefined && !String(name).trim()) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
    }
    if (code !== undefined && !String(code).trim()) {
      return NextResponse.json({ error: "Code cannot be empty" }, { status: 400 })
    }

    const existing = await prisma.brand.findUnique({ where: { id } })
    if (!existing || existing.deletedAt) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 })
    }

    if (code !== undefined) {
      const found = await prisma.brand.findFirst({
        where: {
          id: { not: id },
          deletedAt: null,
          code: { equals: String(code).trim(), mode: "insensitive" as const },
        },
        select: { id: true },
      })
      if (found) return NextResponse.json({ error: "Brand code already exists" }, { status: 409 })
    }

    const updated = await prisma.brand.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(code !== undefined ? { code: String(code).trim() } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(description !== undefined ? { description: description ?? null } : {}),
        ...(logoUrl !== undefined ? { logoUrl: logoUrl ?? null } : {}),
        ...(bannerUrl !== undefined ? { bannerUrl: bannerUrl ?? null } : {}),
        ...(tshirtUrl !== undefined ? { tshirtUrl: tshirtUrl ?? null } : {}),
        ...(primaryColor !== undefined ? { primaryColor: primaryColor ?? null } : {}),
        ...(secondaryColor !== undefined ? { secondaryColor: secondaryColor ?? null } : {}),
        ...(contactName !== undefined ? { contactName: contactName ?? null } : {}),
        ...(contactEmail !== undefined ? { contactEmail: contactEmail ?? null } : {}),
        ...(contactPhone !== undefined ? { contactPhone: contactPhone ?? null } : {}),
        ...(website !== undefined ? { website: website ?? null } : {}),
        ...(stateId !== undefined ? { stateId: stateId ?? null } : {}),
        ...(cityId !== undefined ? { cityId: cityId ?? null } : {}),
        updatedBy: session.user.id,
      },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        tshirtUrl: true,
        primaryColor: true,
        secondaryColor: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        website: true,
        state: { select: { id: true, name: true } },
        city: { select: { id: true, name: true } },
        members: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            mobile: true,
            email: true,
          },
          orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        },
        teams: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            tournament: { select: { id: true, name: true, status: true, startDate: true } },
            teamMembers: {
              where: { deletedAt: null },
              select: { member: { select: { firstName: true, lastName: true } } },
            },
          },
        },
        tournamentBrands: {
          where: { deletedAt: null },
          select: {
            numberOfTeams: true,
            tournament: { select: { id: true, name: true, status: true, startDate: true } },
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating brand:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    await prisma.brand.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    })
    return NextResponse.json({ message: "Brand deleted successfully" })
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete brand" }, { status: 500 })
  }
}
