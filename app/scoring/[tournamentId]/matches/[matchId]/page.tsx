"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { ArrowLeft, Save, Users } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Frame {
  roll1: number | null
  roll2: number | null
  roll3?: number | null
  isStrike: boolean
  isSpare: boolean
  runningTotal: number
}

interface TeamMember {
  id: string
  member: {
    id: string
    firstName: string
    lastName: string
  }
  team: {
    id: string
    name: string
    brand: {
      name: string
    }
  }
  role: string
}

interface Match {
  id: string
  name: string
  tournament: {
    id: string
    name: string
  }
  slotTeams: Array<{
    team: {
      teamMembers: TeamMember[]
    }
  }>
}

export default function MatchScoringPage({ params }: { params: { tournamentId: string; matchId: string } }) {
  const [match, setMatch] = useState<Match | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<TeamMember | null>(null)
  const [gameNumber, setGameNumber] = useState(1)
  const [frames, setFrames] = useState<Frame[]>(
    Array(10)
      .fill(null)
      .map(() => ({
        roll1: null,
        roll2: null,
        roll3: null,
        isStrike: false,
        isSpare: false,
        runningTotal: 0,
      })),
  )
  const [handicap, setHandicap] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchMatch()
  }, [params.matchId])

  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerScores()
    }
  }, [selectedPlayer, gameNumber])

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${params.matchId}`)
      if (response.ok) {
        const data = await response.json()
        setMatch(data)
        // Auto-select first player if available
        const firstPlayer = data.slotTeams[0]?.team?.teamMembers?.[0]
        if (firstPlayer) {
          setSelectedPlayer(firstPlayer)
        }
      }
    } catch (error) {
      console.error("Error fetching match:", error)
      toast({
        title: "Error",
        description: "Failed to load match details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPlayerScores = async () => {
    if (!selectedPlayer) return

    try {
      const response = await fetch(
        `/api/scoring?matchId=${params.matchId}&teamMemberId=${selectedPlayer.id}&gameNumber=${gameNumber}`,
      )
      if (response.ok) {
        const scores = await response.json()
        if (scores.length > 0) {
          const score = scores[0]
          setFrames(JSON.parse(score.frames))
          setHandicap(score.handicap || 0)
        } else {
          // Reset frames for new entry
          setFrames(
            Array(10)
              .fill(null)
              .map(() => ({
                roll1: null,
                roll2: null,
                roll3: null,
                isStrike: false,
                isSpare: false,
                runningTotal: 0,
              })),
          )
          setHandicap(0)
        }
      }
    } catch (error) {
      console.error("Error fetching player scores:", error)
    }
  }

  const updateFrame = (frameIndex: number, roll: "roll1" | "roll2" | "roll3", value: string) => {
    const numValue = value === "" ? null : Number.parseInt(value)
    if (numValue !== null && (numValue < 0 || numValue > 10)) return

    const newFrames = [...frames]
    newFrames[frameIndex] = { ...newFrames[frameIndex], [roll]: numValue }

    // Calculate strike/spare for regular frames (0-8)
    if (frameIndex < 9) {
      const frame = newFrames[frameIndex]
      frame.isStrike = frame.roll1 === 10
      frame.isSpare =
        !frame.isStrike && frame.roll1 !== null && frame.roll2 !== null && frame.roll1 + frame.roll2 === 10

      // If strike, clear roll2
      if (frame.isStrike) {
        frame.roll2 = null
      }
    }

    setFrames(newFrames)
  }

  const saveScore = async () => {
    if (!selectedPlayer) return

    setSaving(true)
    try {
      const response = await fetch("/api/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: params.matchId,
          teamMemberId: selectedPlayer.id,
          gameNumber,
          frames,
          handicap,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save score")
      }

      toast({
        title: "Success",
        description: "Score saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save score",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getTotalScore = () => {
    const lastFrame = frames[9]
    return (lastFrame?.runningTotal || 0) + handicap
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!match) {
    return <div>Match not found</div>
  }

  const allPlayers = match.slotTeams.flatMap((slotTeam) => slotTeam.team.teamMembers)

  return (
    <AuthGuard requiredPermissions={[PERMISSIONS.SCORING_APPROVE]}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/scoring/${params.tournamentId}/matches`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Matches
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{match.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">{match.tournament.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Player Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Players
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {allPlayers.map((player) => (
                <Button
                  key={player.id}
                  variant={selectedPlayer?.id === player.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className="text-left">
                    <div className="font-medium">
                      {player.member.firstName} {player.member.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {player.team.name} ({player.team.brand.name})
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Score Entry */}
          <div className="lg:col-span-3">
            {selectedPlayer && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Score Entry - {selectedPlayer.member.firstName} {selectedPlayer.member.lastName}
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <Tabs
                      value={gameNumber.toString()}
                      onValueChange={(value) => setGameNumber(Number.parseInt(value))}
                    >
                      <TabsList>
                        <TabsTrigger value="1">Game 1</TabsTrigger>
                        <TabsTrigger value="2">Game 2</TabsTrigger>
                        <TabsTrigger value="3">Game 3</TabsTrigger>
                      </TabsList>
                    </Tabs>
                    <Badge variant="secondary">Total: {getTotalScore()}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Frames */}
                  <div className="grid grid-cols-10 gap-2">
                    {frames.map((frame, index) => (
                      <div key={index} className="border rounded p-2">
                        <div className="text-xs font-medium mb-2">Frame {index + 1}</div>
                        <div className="space-y-1">
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            placeholder="R1"
                            value={frame.roll1 ?? ""}
                            onChange={(e) => updateFrame(index, "roll1", e.target.value)}
                            className="h-8 text-xs"
                          />
                          {(index < 9 ? !frame.isStrike : true) && (
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              placeholder="R2"
                              value={frame.roll2 ?? ""}
                              onChange={(e) => updateFrame(index, "roll2", e.target.value)}
                              className="h-8 text-xs"
                            />
                          )}
                          {index === 9 && (frame.isStrike || frame.isSpare) && (
                            <Input
                              type="number"
                              min="0"
                              max="10"
                              placeholder="R3"
                              value={frame.roll3 ?? ""}
                              onChange={(e) => updateFrame(index, "roll3", e.target.value)}
                              className="h-8 text-xs"
                            />
                          )}
                        </div>
                        <div className="text-xs mt-1 text-center font-medium">{frame.runningTotal}</div>
                      </div>
                    ))}
                  </div>

                  {/* Handicap */}
                  <div className="flex items-center gap-4">
                    <Label htmlFor="handicap">Handicap:</Label>
                    <Input
                      id="handicap"
                      type="number"
                      min="0"
                      value={handicap}
                      onChange={(e) => setHandicap(Number.parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                  </div>

                  {/* Save Button */}
                  <Button onClick={saveScore} disabled={saving} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Score"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
