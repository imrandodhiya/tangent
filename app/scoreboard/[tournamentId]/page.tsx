"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type LiveScore = {
  id: string
  frame: number
  roll1: number | null
  roll2: number | null
  roll3: number | null
  frameScore: number
  totalScore: number
  isStrike: boolean
  isSpare: boolean
  member: { id: string; name: string; gender: string }
  match: {
    teams: Array<{
      team: { id: string; name: string; color: string; brand: { name: string } }
    }>
  }
}

type TeamPosition = {
  team: { id: string; name: string; color: string; brand: { name: string } }
  lane: { laneNo: number }
  positionNo: number
}

type TeamRow = {
  laneNo: number
  teamId: string
  teamName: string
  brandName: string
  rows: Array<{
    idx: number
    memberId: string
    memberName: string
    lastScore: string
    framesCompleted: number
    totalScore: number
  }>
  teamTotal: number
}

function formatLast(score: LiveScore): string {
  if (score.isStrike) return "X"
  if (score.isSpare) return `${score.roll1 ?? 0}-/`
  return `${score.roll1 ?? 0}-${score.roll2 ?? 0}`
}

export default function ScoreboardPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [scores, setScores] = useState<LiveScore[]>([])
  const [positions, setPositions] = useState<TeamPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false) // track polling fallback

  const socketUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    }
    return process.env.NEXT_PUBLIC_SOCKET_URL || ""
  }, [])

  // Fetch initial snapshot + subscribe to socket updates
  useEffect(() => {
    const s = io(socketUrl, { path: "/api/socket" })
    s.on("connect", () => {
      s.emit("join-tournament", tournamentId)
      setPolling(false) // stop polling on connect
    })
    s.on("connect_error", () => setPolling(true)) // start polling when socket fails
    s.on("disconnect", () => setPolling(true)) // start polling when disconnected
    s.on("score-updated", () => void fetchSnapshot())
    s.on("slots-updated", () => void fetchSnapshot())
    setSocket(s)
    void fetchSnapshot()
    return () => s.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketUrl, tournamentId])

  useEffect(() => {
    if (!polling) return
    const id = setInterval(() => void fetchSnapshot(), 3000)
    return () => clearInterval(id)
  }, [polling])

  async function fetchSnapshot() {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/live-scores`, { cache: "no-store" })
      const data = await res.json()
      if (data?.liveScores) setScores(data.liveScores)
      if (data?.teamPositions) setPositions(data.teamPositions)
    } catch (e) {
      console.error("[v0] live-scores fetch error:", e)
    } finally {
      setLoading(false)
    }
  }

  // Build per-lane table data
  const laneTables: TeamRow[] = useMemo(() => {
    const byTeam: Record<string, TeamRow> = {}
    for (const p of positions) {
      byTeam[p.team.id] = {
        laneNo: p.lane.laneNo,
        teamId: p.team.id,
        teamName: p.team.name,
        brandName: p.team.brand.name,
        rows: [],
        teamTotal: 0,
      }
    }
    for (const sc of scores) {
      const tid = sc.match.teams[0]?.team.id
      const table = tid ? byTeam[tid] : undefined
      if (!table) continue
      const key = sc.member.id
      let row = table.rows.find((r) => r.memberId === key)
      if (!row) {
        row = {
          idx: table.rows.length + 1,
          memberId: key,
          memberName: sc.member.name,
          lastScore: "",
          framesCompleted: 0,
          totalScore: 0,
        }
        table.rows.push(row)
      }
      row.lastScore = formatLast(sc)
      row.framesCompleted = Math.max(row.framesCompleted, sc.frame)
      row.totalScore = Math.max(row.totalScore, sc.totalScore)
    }
    for (const t of Object.values(byTeam)) {
      t.teamTotal = t.rows.reduce((a, b) => a + b.totalScore, 0)
    }
    return Object.values(byTeam).sort((a, b) => a.laneNo - b.laneNo)
  }, [positions, scores])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-xl font-semibold">Loading live leaderboard…</div>
      </div>
    )
  }

  // Colors: primary blue, neutrals white/black/gray, accent teal
  // Header bar + two side columns of lanes; center is media area
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Top banner */}
      <header className="w-full bg-sky-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-bold text-lg tracking-wide">DESIGN INCREDI-BOWL</div>
          </div>
          <div className="px-4 py-1.5 rounded bg-cyan-500 font-extrabold tracking-wide">LIVE LEADERBOARD</div>
        </div>
      </header>

      {/* Main layout */}
      <div className="mx-auto max-w-[1400px] px-4 py-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left lanes */}
          <aside className="col-span-3 space-y-4">
            {laneTables
              .filter((_, i) => i % 2 === 0)
              .map((t) => (
                <LaneTable key={t.teamId} table={t} />
              ))}
          </aside>

          {/* Center media */}
          <main className="col-span-6 relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
            <Image src="/score.png" alt="Leaderboard background" fill className="object-cover opacity-95" priority />
          </main>

          {/* Right lanes */}
          <aside className="col-span-3 space-y-4">
            {laneTables
              .filter((_, i) => i % 2 === 1)
              .map((t) => (
                <LaneTable key={t.teamId} table={t} />
              ))}
          </aside>
        </div>
      </div>

      {/* Bottom sponsor bar (simple placeholder) */}
      <footer className="w-full bg-slate-100 border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-2 text-center text-sm text-slate-600">
          Conceptualized and Organized by Tangent Networking Services
        </div>
      </footer>
    </div>
  )
}

function LaneTable({ table }: { table: TeamRow }) {
  return (
    <Card className="border-sky-700">
      <div className="bg-sky-700 text-white px-3 py-2 flex items-center justify-between">
        <div className="font-bold">LANE {table.laneNo}</div>
        <div className="text-right">
          <div className="font-bold leading-tight">{table.teamName}</div>
          <div className="text-xs opacity-90">({table.brandName})</div>
        </div>
      </div>
      <div className="divide-y">
        {table.rows.map((r) => (
          <div key={r.memberId} className="px-3 py-1.5 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 text-slate-500">{r.idx}</span>
              <span className="font-medium">{r.memberName}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500">{r.framesCompleted}</span>
              <span className={cn("font-semibold", r.lastScore === "X" ? "text-emerald-600" : "text-slate-700")}>
                {r.lastScore}
              </span>
              <span className="font-bold">{r.totalScore}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-slate-50 px-3 py-2 flex items-center justify-between border-t">
        <span className="font-semibold">TOTAL</span>
        <span className="text-lg font-extrabold text-slate-900">{table.teamTotal}</span>
      </div>
    </Card>
  )
}
