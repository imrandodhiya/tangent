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

    const where = {
      deletedAt: null,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [users, total] = await Promise.all([
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
      users: users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        status: user.status,
        role: user.role.name,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      })),
      pagination: {
        page,
        pageSize: limit, // include pageSize for consistency
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
})

export const POST = withPermission(PERMISSIONS.USERS_CREATE)(async (req) => {
  try {
    const body = await req.json()
    const { firstName, lastName, email, mobile, password, roleId, status = "ACTIVE" } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !roleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser && !existingUser.deletedAt) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      return NextResponse.json({ error: "Invalid role selected" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        mobile: mobile || null,
        passwordHash,
        roleId,
        status,
      },
      include: {
        role: true,
      },
    })

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      status: user.status,
      role: user.role.name,
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
})
