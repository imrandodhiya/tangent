import { NextResponse } from "next/server"
import { withPermission } from "@/lib/auth-middleware"
import { PERMISSIONS } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export const GET = withPermission(PERMISSIONS.SYSTEM_ADMIN)(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")

    const where = category ? { category } : {}

    const settings = await prisma.setting.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    })

    // Group settings by category
    const groupedSettings = settings.reduce(
      (acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = []
        }
        acc[setting.category].push(setting)
        return acc
      },
      {} as Record<string, typeof settings>,
    )

    return NextResponse.json(groupedSettings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
})

export const POST = withPermission(PERMISSIONS.SYSTEM_ADMIN)(async (req) => {
  try {
    const body = await req.json()
    const { key, value, category, description, type = "string" } = body

    if (!key || !category) {
      return NextResponse.json({ error: "Key and category are required" }, { status: 400 })
    }

    // Check if setting already exists
    const existingSetting = await prisma.setting.findUnique({
      where: { key },
    })

    if (existingSetting) {
      return NextResponse.json({ error: "Setting with this key already exists" }, { status: 400 })
    }

    const setting = await prisma.setting.create({
      data: {
        key,
        value: value?.toString() || "",
        category,
        description: description || null,
        type,
      },
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error("Error creating setting:", error)
    return NextResponse.json({ error: "Failed to create setting" }, { status: 500 })
  }
})
