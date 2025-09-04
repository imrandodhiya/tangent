import { NextResponse } from "next/server"
import { withPermission } from "@/lib/auth-middleware"
import { PERMISSIONS } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const GET = withPermission(PERMISSIONS.USERS_VIEW)(async (req, { params }) => {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      role: user.role,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
  }
})

export const PUT = withPermission(PERMISSIONS.USERS_UPDATE)(async (req, { params }) => {
  try {
    const { id } = await params
    const body = await req.json()
    const { firstName, lastName, email, roleId, status, password } = body

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

    const updateData: any = {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(roleId && { roleId }),
      ...(status && { status }),
      updatedAt: new Date(),
    }

    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    })

    return NextResponse.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      status: user.status,
      role: user.role.name,
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
})

export const DELETE = withPermission(PERMISSIONS.USERS_DELETE)(async (req, { params }) => {
  try {
    const { id } = await params
    // Soft delete the user
    await prisma.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
})
