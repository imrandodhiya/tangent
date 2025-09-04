import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const operatorRoles = await prisma.role.findMany({
      where: {
        name: {
          in: ["OPERATOR", "SCORER", "TOURNAMENT_OPERATOR"],
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(operatorRoles)
  } catch (error) {
    console.error("Error fetching operator roles:", error)
    return NextResponse.json({ error: "Failed to fetch operator roles" }, { status: 500 })
  }
}
