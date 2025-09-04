"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, Users, MapPin } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Team {
  id: string
  name: string
  color: string
  brand: {
    name: string
  }
}

interface Lane {
  id: string
  laneNo: number
}

interface TeamPosition {
  teamId: string
  laneId: string
  position: number
}

export default function TeamPositionsPage() {
  const params = useParams()
  const tournamentId = params.id as string
  const [teams, setTeams] = useState<Team[]>([])
  const [lanes, setLanes] = useState<Lane[]>([])
  const [positions, setPositions] = useState<TeamPosition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [tournamentId])

  const fetchData = async () => {
    try {
      const [teamsRes, lanesRes, positionsRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/teams`),
        fetch("/api/lanes"),
        fetch(`/api/tournaments/${tournamentId}/live-scores`),
      ])

      const teamsData = await teamsRes.json()
      const lanesData = await lanesRes.json()
      const positionsData = await positionsRes.json()

      setTeams(teamsData.teams || [])
      setLanes(lanesData.lanes || [])

      // Initialize positions from existing data or create empty positions
      const existingPositions =
        positionsData.teamPositions?.map((tp: any) => ({
          teamId: tp.team.id,
          laneId: tp.lane?.id || "",
          position: tp.positionNo || 1,
        })) || []

      // Ensure all teams have positions
      const allPositions =
        teamsData.teams?.map((team: Team, index: number) => {
          const existing = existingPositions.find((p: TeamPosition) => p.teamId === team.id)
          return (
            existing || {
              teamId: team.id,
              laneId: lanesData.lanes?.[0]?.id || "",
              position: index + 1,
            }
          )
        }) || []

      setPositions(allPositions)
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load team positions data",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const updatePosition = (teamId: string, field: "laneId" | "position", value: string | number) => {
    setPositions((prev) => prev.map((pos) => (pos.teamId === teamId ? { ...pos, [field]: value } : pos)))
  }

  const savePositions = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/live-scores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamPositions: positions.map((pos) => ({
            teamId: pos.teamId,
            laneId: pos.laneId,
            position: pos.position,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save positions")
      }

      toast({
        title: "Success",
        description: "Team positions saved successfully",
      })
    } catch (error) {
      console.error("Error saving positions:", error)
      toast({
        title: "Error",
        description: "Failed to save team positions",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getPositionColor = (position: number) => {
    const colors = [
      "bg-yellow-100 border-yellow-300",
      "bg-blue-100 border-blue-300",
      "bg-green-100 border-green-300",
      "bg-red-100 border-red-300",
      "bg-purple-100 border-purple-300",
      "bg-orange-100 border-orange-300",
      "bg-pink-100 border-pink-300",
      "bg-indigo-100 border-indigo-300",
      "bg-teal-100 border-teal-300",
      "bg-gray-100 border-gray-300",
    ]
    return colors[position - 1] || "bg-gray-100 border-gray-300"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold">Loading team positions...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            Team Positions Setup
          </h1>
          <p className="text-gray-600 mt-2">Configure team positions and lane assignments for live scoring display</p>
        </div>
        <Button onClick={savePositions} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Positions"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Position Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Position Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {teams.map((team) => {
              const position = positions.find((p) => p.teamId === team.id)
              return (
                <div key={team.id} className={`p-4 rounded-lg border-2 ${getPositionColor(position?.position || 1)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{team.name}</h3>
                      <Badge variant="outline">{team.brand.name}</Badge>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-400"
                      style={{ backgroundColor: team.color }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Position (L1-L10)</label>
                      <Select
                        value={position?.position.toString() || "1"}
                        onValueChange={(value) => updatePosition(team.id, "position", Number.parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              L{num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Lane Assignment</label>
                      <Select
                        value={position?.laneId || ""}
                        onValueChange={(value) => updatePosition(team.id, "laneId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select lane" />
                        </SelectTrigger>
                        <SelectContent>
                          {lanes.map((lane) => (
                            <SelectItem key={lane.id} value={lane.id}>
                              Lane {lane.laneNo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Live Scoring Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Live Scoring Layout Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-blue-900 to-purple-900 p-4 rounded-lg text-white min-h-[600px]">
              <h3 className="text-center text-xl font-bold mb-4">LIVE SCORING LAYOUT</h3>

              <div className="grid grid-cols-3 gap-4 h-full">
                {/* Left Column */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-center">LEFT SIDE (L1-L5)</h4>
                  {positions
                    .filter((p) => p.position <= 5)
                    .sort((a, b) => a.position - b.position)
                    .map((pos) => {
                      const team = teams.find((t) => t.id === pos.teamId)
                      return (
                        <div
                          key={pos.teamId}
                          className={`p-2 rounded text-black text-xs ${getPositionColor(pos.position).replace("border-", "border-2 border-")}`}
                        >
                          <div className="font-bold">
                            L{pos.position} - {team?.name}
                          </div>
                          <div className="text-xs">({team?.brand.name})</div>
                        </div>
                      )
                    })}
                </div>

                {/* Center - Ranking */}
                <div className="bg-black/30 p-2 rounded">
                  <h4 className="text-center font-bold text-green-400 mb-2">RANKING</h4>
                  <div className="text-xs space-y-1">
                    <div className="grid grid-cols-4 gap-1 font-bold">
                      <span>RANK</span>
                      <span>TEAM</span>
                      <span>SCORE</span>
                      <span>FRAME</span>
                    </div>
                    {teams.slice(0, 8).map((team, idx) => (
                      <div key={team.id} className="grid grid-cols-4 gap-1 text-xs">
                        <span>{idx + 1}</span>
                        <span className="truncate">{team.name}</span>
                        <span>0</span>
                        <span>0</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-center">RIGHT SIDE (L6-L10)</h4>
                  {positions
                    .filter((p) => p.position > 5)
                    .sort((a, b) => a.position - b.position)
                    .map((pos) => {
                      const team = teams.find((t) => t.id === pos.teamId)
                      return (
                        <div
                          key={pos.teamId}
                          className={`p-2 rounded text-black text-xs ${getPositionColor(pos.position).replace("border-", "border-2 border-")}`}
                        >
                          <div className="font-bold">
                            L{pos.position} - {team?.name}
                          </div>
                          <div className="text-xs">({team?.brand.name})</div>
                        </div>
                      )
                    })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
