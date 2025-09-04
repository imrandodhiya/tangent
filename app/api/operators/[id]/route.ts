import { NextResponse } from "next/server"
import { withPermission } from "@/lib/auth-middleware"
import { PERMISSIONS } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const GET = withPermission(PERMISSIONS.USERS_VIEW)(async (req, { params }) => {
  try {
    const { id } = await params
    const operator = await prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        role: true,
      },
    })

    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 })
    }

    // Verify it's an operator role
    if (!["OPERATOR", "SCORER", "TOURNAMENT_OPERATOR"].includes(operator.role.name)) {
      return NextResponse.json({ error: "User is not an operator" }, { status: 400 })
    }

    return NextResponse.json({
      id: operator.id,
      firstName: operator.firstName,
      lastName: operator.lastName,
      email: operator.email,
      mobile: operator.mobile,
      status: operator.status,
      role: operator.role,
      createdAt: operator.createdAt,
      lastLoginAt: operator.lastLoginAt,
    })
  } catch (error) {
    console.error("Error fetching operator:", error)
    return NextResponse.json({ error: "Failed to fetch operator" }, { status: 500 })
  }
})

export const PUT = withPermission(PERMISSIONS.USERS_UPDATE)(async (req, { params }) => {
  try {
    const { id } = await params
    const body = await req.json()
    const { firstName, lastName, email, mobile, roleId, status, password } = body

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id },
          deletedAt: null,
        },
      })

      if (existingUser) {
        return NextResponse.json({ error: "Email already taken" }, { status: 400 })
      }
    }

    // Verify the role is an operator role if provided
    if (roleId) {
      const role = await prisma.role.findUnique({
        where: { id: roleId },
      })

      if (!role || !["OPERATOR", "SCORER", "TOURNAMENT_OPERATOR"].includes(role.name)) {
        return NextResponse.json({ error: "Invalid operator role" }, { status: 400 })
      }
    }

    const updateData: any = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(mobile && { mobile }),
      ...(roleId && { roleId }),
      ...(status && { status }),
      updatedAt: new Date(),
    }

    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12)
    }

    const operator = await prisma.user.update({
      where: { id },
      data: updateData,
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
    console.error("Error updating operator:", error)
    return NextResponse.json({ error: "Failed to update operator" }, { status: 500 })
  }
})

export const DELETE = withPermission(PERMISSIONS.USERS_DELETE)(async (req, { params }) => {
  try {
    const { id } = await params
    // Soft delete the operator
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "Operator deleted successfully" })
  } catch (error) {
    console.error("Error deleting operator:", error)
    return NextResponse.json({ error: "Failed to delete operator" }, { status: 500 })
  }
})
