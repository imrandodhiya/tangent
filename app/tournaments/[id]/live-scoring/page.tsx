"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { io, type Socket } from "socket.io-client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface LiveScore {
  id: string
  frame: number
  roll1: number | null
  roll2: number | null
  roll3: number | null
  frameScore: number
  totalScore: number
  isStrike: boolean
  isSpare: boolean
  member: {
    id: string
    name: string
    gender: string
  }
  match: {
    teams: Array<{
      team: {
        id: string
        name: string
        color: string
        brand: {
          name: string
        }
      }
    }>
  }
}

interface TeamPosition {
  team: {
    id: string
    name: string
    color: string
    brand: {
      name: string
    }
  }
  lane: {
    laneNo: number
  }
  positionNo: number
}

interface TeamScores {
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

export default function LiveScoringPage() {
  const params = useParams()
  const tournamentId = params.id as string
  const [socket, setSocket] = useState<Socket | null>(null)
  const [teamScores, setTeamScores] = useState<TeamScores>({})
  const [tournamentName, setTournamentName] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const socketUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    }
    return process.env.NEXT_PUBLIC_SOCKET_URL || ""
  }, [])

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(socketUrl, {
      path: "/api/socket",
    })

    newSocket.on("connect", () => {
      console.log("Connected to socket server")
      newSocket.emit("join-tournament", tournamentId)
    })

    newSocket.on("score-updated", (data: LiveScore) => {
      // Update scores in real-time
      fetchLiveScores()
    })

    setSocket(newSocket)

    // Initial data fetch
    fetchLiveScores()

    return () => {
      newSocket.disconnect()
    }
  }, [tournamentId, socketUrl])

  const fetchLiveScores = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/live-scores`)
      const data = await response.json()

      if (data.liveScores && data.teamPositions) {
        processScoreData(data.liveScores, data.teamPositions)
      }
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching live scores:", error)
      setIsLoading(false)
    }
  }

  const processScoreData = (scores: LiveScore[], positions: TeamPosition[]) => {
    const teamData: TeamScores = {}

    // Group scores by team
    positions.forEach((position) => {
      const teamId = position.team.id
      teamData[teamId] = {
        team: position.team,
        laneNo: position.lane.laneNo,
        position: position.positionNo,
        members: [],
        teamTotal: 0,
        rank: 0,
        strikes: 0,
        spares: 0,
      }
    })

    // Process scores
    scores.forEach((score) => {
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

      // Format last score
      if (score.isStrike) {
        memberData.lastScore = "X"
        teamData[teamId].strikes++
      } else if (score.isSpare) {
        memberData.lastScore = `${score.roll1}-/`
        teamData[teamId].spares++
      } else {
        memberData.lastScore = `${score.roll1 || 0}-${score.roll2 || 0}`
      }
    })

    // Calculate team totals and ranks
    Object.values(teamData).forEach((team) => {
      team.teamTotal = team.members.reduce((sum, member) => sum + member.totalScore, 0)
    })

    // Sort by team total for ranking
    const sortedTeams = Object.values(teamData).sort((a, b) => b.teamTotal - a.teamTotal)
    sortedTeams.forEach((team, index) => {
      team.rank = index + 1
    })

    setTeamScores(teamData)
  }

  const formatLastScore = (lastScore: string) => {
    if (lastScore === "X") return "X"
    if (lastScore.includes("/")) return lastScore
    return lastScore
  }

  const getPositionColor = (position: number) => {
    const colors = [
      "bg-yellow-400",
      "bg-blue-400",
      "bg-green-400",
      "bg-red-400",
      "bg-purple-400",
      "bg-orange-400",
      "bg-pink-400",
      "bg-indigo-400",
      "bg-teal-400",
      "bg-gray-400",
    ]
    return colors[position - 1] || "bg-gray-400"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold">Loading Live Scores...</div>
      </div>
    )
  }

  const sortedTeams = Object.values(teamScores).sort((a, b) => a.position - b.position)
  const rankingData = Object.values(teamScores).sort((a, b) => b.teamTotal - a.teamTotal)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white p-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2">BOWLING TOURNAMENT</h1>
        <h2 className="text-2xl font-semibold">LIVE SCORING</h2>
        <div className="flex items-center justify-end mt-4">
          <Badge variant="secondary" className="bg-red-600 text-white px-4 py-2 text-lg">
            🔴 LIVE SCORE
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Left Column - Teams L1-L5 */}
        <div className="col-span-3 space-y-4">
          {sortedTeams.slice(0, 5).map((teamData) => (
            <Card key={teamData.team.id} className={`${getPositionColor(teamData.position)} p-4 text-black`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">L{teamData.position}</h3>
                <div className="text-right">
                  <div className="font-bold">{teamData.team.name}</div>
                  <div className="text-sm">({teamData.team.brand.name})</div>
                </div>
              </div>

              {teamData.members.map((member, idx) => (
                <div
                  key={member.member.id}
                  className="flex justify-between items-center py-1 border-b border-black/20 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{idx + 1}</span>
                    <span className="text-sm">{member.member.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{member.framesCompleted}</span>
                    <span className="text-sm">{formatLastScore(member.lastScore)}</span>
                    <span className="font-bold text-lg">{member.totalScore}</span>
                  </div>
                </div>
              ))}

              <div className="mt-2 pt-2 border-t border-black/30">
                <div className="flex justify-between items-center font-bold">
                  <span>TOTAL</span>
                  <span className="text-xl">{teamData.teamTotal}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Center Column - Ranking Table */}
        <div className="col-span-6 flex flex-col">
          <Card className="bg-black/50 backdrop-blur-sm p-6 flex-1">
            <h3 className="text-2xl font-bold text-center mb-4 text-green-400">RANKING</h3>
            <div className="overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-green-600 text-white">
                    <th className="p-3 text-left">RANK</th>
                    <th className="p-3 text-left">TEAM</th>
                    <th className="p-3 text-center">SCORE</th>
                    <th className="p-3 text-center">FRAME</th>
                    <th className="p-3 text-center">STRIKE</th>
                    <th className="p-3 text-center">SPARE</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingData.map((team, index) => (
                    <tr
                      key={team.team.id}
                      className={`${index % 2 === 0 ? "bg-white/10" : "bg-white/5"} hover:bg-white/20 transition-colors`}
                    >
                      <td className="p-3 font-bold text-yellow-400">{team.rank}</td>
                      <td className="p-3">
                        <div>
                          <div className="font-semibold">{team.team.name}</div>
                          <div className="text-sm text-gray-300">({team.team.brand.name})</div>
                        </div>
                      </td>
                      <td className="p-3 text-center font-bold text-xl">{team.teamTotal}</td>
                      <td className="p-3 text-center">
                        {Math.max(...team.members.map((m) => m.framesCompleted))}({team.members.length})
                      </td>
                      <td className="p-3 text-center font-bold text-green-400">{team.strikes}</td>
                      <td className="p-3 text-center font-bold text-blue-400">{team.spares}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column - Teams L6-L10 */}
        <div className="col-span-3 space-y-4">
          {sortedTeams.slice(5, 10).map((teamData) => (
            <Card key={teamData.team.id} className={`${getPositionColor(teamData.position)} p-4 text-black`}>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-lg">L{teamData.position}</h3>
                <div className="text-right">
                  <div className="font-bold">{teamData.team.name}</div>
                  <div className="text-sm">({teamData.team.brand.name})</div>
                </div>
              </div>

              {teamData.members.map((member, idx) => (
                <div
                  key={member.member.id}
                  className="flex justify-between items-center py-1 border-b border-black/20 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{idx + 1}</span>
                    <span className="text-sm">{member.member.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{member.framesCompleted}</span>
                    <span className="text-sm">{formatLastScore(member.lastScore)}</span>
                    <span className="font-bold text-lg">{member.totalScore}</span>
                  </div>
                </div>
              ))}

              <div className="mt-2 pt-2 border-t border-black/30">
                <div className="flex justify-between items-center font-bold">
                  <span>TOTAL</span>
                  <span className="text-xl">{teamData.teamTotal}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-4 text-sm text-gray-300">Scroll for details • Live updates every second</div>
    </div>
  )
}
