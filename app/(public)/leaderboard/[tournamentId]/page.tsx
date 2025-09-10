"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import Image from "next/image"

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
  match: { teams: Array<{ team: { id: string; name: string; color: string; brand: { name: string } } }> }
}

type TeamPosition = {
  team: { id: string; name: string; color: string; brand: { name: string } }
  lane: { laneNo: number }
  positionNo: number
}

type TeamScores = {
  [teamId: string]: {
    team: TeamPosition["team"]
    laneNo: number
    position: number
    members: Array<{
      member: LiveScore["member"]
      scores: LiveScore[]
      totalScore: number
      framesCompleted: number
      lastScore: string
    }>
    teamTotal: number
    rank: number
    strikes: number
    spares: number
  }
}

export const dynamic = "force-dynamic"

export default function PublicLeaderboardPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [teamScores, setTeamScores] = useState<TeamScores>({})
  const [isLoading, setIsLoading] = useState(true)
  const [polling, setPolling] = useState(false) // track polling fallback

  const socketUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    }
    return process.env.NEXT_PUBLIC_SOCKET_URL || ""
  }, [])

  useEffect(() => {
    // initialize socket.io connection
    const s = io(socketUrl, { path: "/api/socket" })
    s.on("connect", () => {
      s.emit("join-tournament", tournamentId)
      setPolling(false) // connected, stop polling
    })
    s.on("connect_error", () => {
      setPolling(true) // fallback to polling if connect fails
    })
    s.on("disconnect", () => {
      setPolling(true) // resume polling when disconnected
    })
    s.on("score-updated", () => {
      void fetchLiveScores()
    })
    s.on("slots-updated", () => {
      void fetchLiveScores()
    })
    setSocket(s)

    // initial fetch
    void fetchLiveScores()

    return () => {
      s.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketUrl, tournamentId])

  useEffect(() => {
    if (!polling) return
    const id = setInterval(() => {
      void fetchLiveScores()
    }, 3000)
    return () => clearInterval(id)
  }, [polling])

  async function fetchLiveScores() {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/live-scores`, { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to fetch live scores")
      const data = await res.json()
      if (data.liveScores && data.teamPositions) {
        processScoreData(data.liveScores as LiveScore[], data.teamPositions as TeamPosition[])
      }
      setIsLoading(false)
    } catch (e) {
      console.error("[v0] live-scores error:", (e as Error).message)
      setIsLoading(false)
    }
  }

  function processScoreData(scores: LiveScore[], positions: TeamPosition[]) {
    const teamData: TeamScores = {}

    positions.forEach((pos) => {
      const tid = pos.team.id
      teamData[tid] = {
        team: pos.team,
        laneNo: pos.lane.laneNo,
        position: pos.positionNo,
        members: [],
        teamTotal: 0,
        rank: 0,
        strikes: 0,
        spares: 0,
      }
    })

    scores.forEach((score) => {
      // assume first team is the scoring team (adjust if your API provides team id directly)
      const teamId = score.match.teams[0]?.team.id
      if (!teamId || !teamData[teamId]) return

      let memberData = teamData[teamId].members.find((m) => m.member.id === score.member.id)
      if (!memberData) {
        memberData = {
          member: score.member,
          scores: [],
          totalScore: 0,
          framesCompleted: 0,
          lastScore: "",
        }
        teamData[teamId].members.push(memberData)
      }
      memberData.scores.push(score)
      memberData.totalScore = Math.max(memberData.totalScore, score.totalScore)
      memberData.framesCompleted = Math.max(memberData.framesCompleted, score.frame)

      if (score.isStrike) {
        memberData.lastScore = "X"
        teamData[teamId].strikes++
      } else if (score.isSpare) {
        memberData.lastScore = `${score.roll1 ?? 0}-/`
        teamData[teamId].spares++
      } else {
        memberData.lastScore = `${score.roll1 ?? 0}-${score.roll2 ?? 0}`
      }
    })

    Object.values(teamData).forEach((t) => {
      t.teamTotal = t.members.reduce((sum, m) => sum + m.totalScore, 0)
    })

    const byTotal = Object.values(teamData).sort((a, b) => b.teamTotal - a.teamTotal)
    byTotal.forEach((t, i) => (t.rank = i + 1))

    setTeamScores(teamData)
  }

  const sortedByLane = useMemo(() => Object.values(teamScores).sort((a, b) => a.position - b.position), [teamScores])
  const ranking = useMemo(() => Object.values(teamScores).sort((a, b) => b.teamTotal - a.teamTotal), [teamScores])

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900 text-white">
        <div className="text-2xl font-semibold">Loading live leaderboard…</div>
      </div>
    )
  }

  return (
    <div className="relative min-h-full bg-slate-900 text-white">
      {/* Top banner - "LIVE LEADERBOARD" */}
      <header className="relative z-10 mx-auto w-full max-w-[1600px] px-4">
        <div className="mt-3 flex items-center justify-between rounded-md bg-sky-700 px-6 py-3 shadow">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold tracking-wide opacity-80">LIVE</span>
            <span className="text-lg font-bold">LEADERBOARD</span>
          </div>
          <div className="text-sm opacity-80">Updates in real time</div>
        </div>
      </header>

      {/* Main grid */}
      <div className="mx-auto mt-3 grid w-full max-w-[1600px] grid-cols-12 gap-4 px-4 pb-6">
        {/* Left lanes */}
        <aside className="col-span-12 md:col-span-3 space-y-4">
          {sortedByLane.slice(0, 5).map((t) => (
            <LaneCard key={t.team.id} title={`LANE ${t.position}`} teamName={t.team.name} brand={t.team.brand.name}>
              {t.members.map((m, idx) => (
                <Row
                  key={m.member.id}
                  idx={idx + 1}
                  name={m.member.name}
                  frame={m.framesCompleted}
                  last={m.lastScore}
                  total={m.totalScore}
                />
              ))}
              <TotalRow total={t.teamTotal} />
            </LaneCard>
          ))}
        </aside>

        {/* Center video/photo area with ranking overlay */}
        <section className="relative col-span-12 md:col-span-6">
          {/* Center hero image (design reference) */}
          <div className="relative h-[48vh] w-full overflow-hidden rounded-md border border-white/10">
            <Image
              src="/score.png"
              alt="Live event"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
            />
          </div>

          {/* Ranking table */}
          <div className="mt-4 overflow-hidden rounded-md border border-emerald-500/30 bg-black/50">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-600 text-left text-sm uppercase tracking-wide">
                  <th className="p-3">Rank</th>
                  <th className="p-3">Team</th>
                  <th className="p-3 text-center">Score</th>
                  <th className="p-3 text-center">Frame</th>
                  <th className="p-3 text-center">Strikes</th>
                  <th className="p-3 text-center">Spares</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((t, i) => (
                  <tr key={t.team.id} className={i % 2 === 0 ? "bg-white/5" : "bg-white/10"}>
                    <td className="p-3 font-bold text-amber-400">{t.rank}</td>
                    <td className="p-3">
                      <div className="font-semibold">{t.team.name}</div>
                      <div className="text-xs opacity-70">({t.team.brand.name})</div>
                    </td>
                    <td className="p-3 text-center text-lg font-bold">{t.teamTotal}</td>
                    <td className="p-3 text-center">
                      {Math.max(...t.members.map((m) => m.framesCompleted))} ({t.members.length})
                    </td>
                    <td className="p-3 text-center text-emerald-400 font-semibold">{t.strikes}</td>
                    <td className="p-3 text-center text-sky-400 font-semibold">{t.spares}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right lanes */}
        <aside className="col-span-12 md:col-span-3 space-y-4">
          {sortedByLane.slice(5, 10).map((t) => (
            <LaneCard key={t.team.id} title={`LANE ${t.position}`} teamName={t.team.name} brand={t.team.brand.name}>
              {t.members.map((m, idx) => (
                <Row
                  key={m.member.id}
                  idx={idx + 1}
                  name={m.member.name}
                  frame={m.framesCompleted}
                  last={m.lastScore}
                  total={m.totalScore}
                />
              ))}
              <TotalRow total={t.teamTotal} />
            </LaneCard>
          ))}
        </aside>
      </div>

      {/* Footer strip */}
      <footer className="border-t border-white/10 py-2 text-center text-xs opacity-80">
        Conceptualized & Organized • Live leaderboard
      </footer>
    </div>
  )
}

function LaneCard({
  title,
  teamName,
  brand,
  children,
}: {
  title: string
  teamName: string
  brand: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-md bg-[#0D2C54] p-3 shadow">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-bold tracking-wide text-white/90">{title}</div>
        <div className="text-right">
          <div className="text-sm font-semibold">{teamName}</div>
          <div className="text-[11px] opacity-75">({brand})</div>
        </div>
      </div>
      <div className="divide-y divide-white/10">{children}</div>
    </div>
  )
}

function Row({
  idx,
  name,
  frame,
  last,
  total,
}: {
  idx: number
  name: string
  frame: number
  last: string
  total: number
}) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-white/10 text-xs font-bold">
          {idx}
        </span>
        <span>{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="tabular-nums opacity-80">{frame}</span>
        <span className="tabular-nums">{last}</span>
        <span className="min-w-[2ch] text-right text-base font-bold">{total}</span>
      </div>
    </div>
  )
}

function TotalRow({ total }: { total: number }) {
  return (
    <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-2">
      <span className="text-sm font-bold">TOTAL</span>
      <span className="text-lg font-extrabold">{total}</span>
    </div>
  )
}
