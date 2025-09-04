import { NextResponse } from "next/server"
import { withPermission } from "@/lib/auth-middleware"
import { PERMISSIONS } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const GET = withPermission(PERMISSIONS.USERS_VIEW)(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSizeAlias = searchParams.get("pageSize") || searchParams.get("per_page")
    const limit = Number.parseInt(pageSizeAlias || searchParams.get("limit") || "10")
    const search = (searchParams.get("search") || searchParams.get("q") || "").trim()

    // Get operator-related roles
    const operatorRoles = await prisma.role.findMany({
      where: {
        name: {
          in: ["OPERATOR", "SCORER", "TOURNAMENT_OPERATOR"],
        },
      },
    })

    const operatorRoleIds = operatorRoles.map((role) => role.id)

    const where = {
      deletedAt: null,
      roleId: { in: operatorRoleIds },
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [operators, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      operators: operators.map((operator) => ({
        id: operator.id,
        firstName: operator.firstName,
        lastName: operator.lastName,
        email: operator.email,
        mobile: operator.mobile,
        status: operator.status,
        role: operator.role,
        createdAt: operator.createdAt,
        lastLoginAt: operator.lastLoginAt,
      })),
      pagination: {
        page,
        pageSize: limit,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching operators:", error)
    return NextResponse.json({ error: "Failed to fetch operators" }, { status: 500 })
  }
})

export const POST = withPermission(PERMISSIONS.USERS_CREATE)(async (req) => {
  try {
    const body = await req.json()
    const { firstName, lastName, email, mobile, password, roleId } = body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Verify the role is an operator role
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role || !["OPERATOR", "SCORER", "TOURNAMENT_OPERATOR"].includes(role.name)) {
      return NextResponse.json({ error: "Invalid operator role" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create operator
    const operator = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        mobile,
        passwordHash,
        roleId,
        status: "ACTIVE",
      },
      include: {
        role: true,
      },
    })

    return NextResponse.json({
      id: operator.id,
      firstName: operator.firstName,
      lastName: operator.lastName,
      email: operator.email,
      mobile: operator.mobile,
      status: operator.status,
      role: operator.role,
      createdAt: operator.createdAt,
    })
  } catch (error) {
    console.error("Error creating operator:", error)
    return NextResponse.json({ error: "Failed to create operator" }, { status: 500 })
  }
})
