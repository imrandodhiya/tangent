import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function DisplayRedirectPage() {
  const setting = await prisma.setting.findUnique({ where: { key: "display.page_order" } })
  let order: string[] = []
  try {
    if (setting?.value) {
      const parsed = JSON.parse(setting.value)
      if (Array.isArray(parsed)) order = parsed.filter(Boolean).map(String)
    }
  } catch {
    // value may be comma-separated text
    order = String(setting?.value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }

  const target = order[0] || "/tournaments"
  redirect(target)
}
