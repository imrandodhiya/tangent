import { NextResponse } from "next/server"
import { withPermission } from "@/lib/auth-middleware"
import { PERMISSIONS } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export const GET = withPermission(PERMISSIONS.SYSTEM_ADMIN)(async (req, { params }) => {
  try {
    const { key } = await params
    const setting = await prisma.setting.findUnique({
      where: { key },
    })

    if (!setting) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 })
    }

    return NextResponse.json(setting)
  } catch (error) {
    console.error("Error fetching setting:", error)
    return NextResponse.json({ error: "Failed to fetch setting" }, { status: 500 })
  }
})

export const PUT = withPermission(PERMISSIONS.SYSTEM_ADMIN)(async (req, { params }) => {
  try {
    const body = await req.json()
    const { value, description, type } = body

    const { key } = await params

    const setting = await prisma.setting.update({
      where: { key },
      data: {
        value: value?.toString() || "",
        ...(description !== undefined && { description }),
        ...(type && { type }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error("Error updating setting:", error)
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 })
  }
})

export const DELETE = withPermission(PERMISSIONS.SYSTEM_ADMIN)(async (req, { params }) => {
  try {
    const { key } = await params

    await prisma.setting.delete({
      where: { key },
    })

    return NextResponse.json({ message: "Setting deleted successfully" })
  } catch (error) {
    console.error("Error deleting setting:", error)
    return NextResponse.json({ error: "Failed to delete setting" }, { status: 500 })
  }
})
