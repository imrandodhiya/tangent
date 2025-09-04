import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { UserStatus } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, mobile, password, roleId } = await request.json()

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { mobile }],
        deletedAt: null,
      },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or mobile already exists" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Get default role if not provided
    let finalRoleId = roleId
    if (!finalRoleId) {
      const defaultRole = await prisma.role.findFirst({
        where: { name: "Viewer" },
      })
      finalRoleId = defaultRole?.id
    }

    if (!finalRoleId) {
      return NextResponse.json({ error: "No valid role found" }, { status: 400 })
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        mobile,
        passwordHash,
        roleId: finalRoleId,
        status: UserStatus.ACTIVE,
      },
      include: {
        role: true,
      },
    })

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: "User created successfully",
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
