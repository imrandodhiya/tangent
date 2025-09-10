"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowDown, ArrowUp, Save } from "lucide-react"
import { useRouter } from "next/navigation"

type Setting = { key: string; value: string; category: string; description?: string; type?: string }

const DEFAULT_PAGES = [
  { key: "scoreboard", label: "Scoreboard (public)", path: "/scoreboard/[tournamentId]" },
  { key: "live-scoring", label: "Live Scoring (public)", path: "/tournaments/[id]/live-scoring" },
  { key: "teams", label: "Teams", path: "/teams" },
  { key: "brands", label: "Brands", path: "/brands" },
]

export default function DisplayPrioritySettings() {
  const router = useRouter()
  const [order, setOrder] = useState<string[]>(DEFAULT_PAGES.map((p) => p.key))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Load existing order if present
    ;(async () => {
      try {
        const res = await fetch("/api/settings?category=display", { cache: "no-store" })
        if (!res.ok) return
        const grouped = (await res.json()) as Record<string, Setting[]>
        const list = grouped?.display?.find((s) => s.key === "display.page_order")?.value
        if (list) {
          const parsed = JSON.parse(list) as string[]
          if (Array.isArray(parsed) && parsed.length) setOrder(parsed)
        }
      } catch {}
    })()
  }, [])

  const pages = useMemo(
    () => order.map((k) => DEFAULT_PAGES.find((p) => p.key === k)).filter(Boolean) as typeof DEFAULT_PAGES,
    [order],
  )

  function move(idx: number, dir: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev]
      const to = idx + dir
      if (to < 0 || to >= next.length) return prev
      const tmp = next[idx]
      next[idx] = next[to]
      next[to] = tmp
      return next
    })
  }

  async function onSave() {
    setSaving(true)
    try {
      const payload = {
        key: "display.page_order",
        value: JSON.stringify(order),
        category: "display",
        description: "Ordered list of page keys to show by priority",
        type: "json",
      }
      // Upsert (requires admin permission)
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "Failed to save settings")
      } else {
        router.refresh()
      }
    } catch (e) {
      alert("An error occurred while saving")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Display Page Priority</CardTitle>
          <CardDescription>Set which pages should show first on displays (1 = highest priority)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {pages.map((p, idx) => (
              <div key={p.key} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <div className="font-medium">
                    {idx + 1}. {p.label}
                  </div>
                  <div className="text-xs text-muted-foreground">{p.path}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => move(idx, -1)} aria-label="Move up">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => move(idx, +1)} aria-label="Move down">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-end">
            <Button onClick={onSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Priority"}
            </Button>
          </div>

          <div className="pt-2">
            <Label htmlFor="json" className="text-xs">
              Current value (JSON)
            </Label>
            <Input id="json" readOnly value={JSON.stringify(order)} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
