"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BowlingScorer, type Frame, type BowlingGame } from "@/lib/bowling-scoring"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TeamMember {
  id: string
  member: {
    id: string
    firstName: string
    lastName: string
    average: number
  }
  team: {
    id: string
    name: string
  }
}

interface Match {
  id: string
  tournament: {
    name: string
    gamesPerMatch: number
  }
  homeTeam: {
    id: string
    name: string
    teamMembers: TeamMember[]
  }
  awayTeam: {
    id: string
    name: string
    teamMembers: TeamMember[]
  }
  scoring: any[]
}

export default function MatchScoringPage() {
  const params = useParams()
  const { toast } = useToast()
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [games, setGames] = useState<Record<string, BowlingGame[]>>({})
  const [currentGame, setCurrentGame] = useState(1)

  useEffect(() => {
    fetchMatch()
  }, [params.id])

  const fetchMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${params.id}/scoring`)
      if (!response.ok) throw new Error("Failed to fetch match")

      const matchData = await response.json()
      setMatch(matchData)

      // Initialize games for each team member
      const initialGames: Record<string, BowlingGame[]> = {}
      ;[...matchData.homeTeam.teamMembers, ...matchData.awayTeam.teamMembers].forEach((tm) => {
        initialGames[tm.id] = Array.from({ length: matchData.tournament.gamesPerMatch }, () => {
          const game = BowlingScorer.createEmptyGame()
          game.handicap = BowlingScorer.calculateHandicap(tm.member.average)
          return game
        })
      })

      // Load existing scores
      matchData.scoring.forEach((score: any) => {
        const teamMemberId = score.teamMemberId
        const gameIndex = score.gameNumber - 1
        if (initialGames[teamMemberId] && initialGames[teamMemberId][gameIndex]) {
          initialGames[teamMemberId][gameIndex] = {
            frames: JSON.parse(score.frames),
            totalScore: score.totalScore,
            handicap: score.handicap,
            finalScore: score.finalScore,
          }
        }
      })

      setGames(initialGames)
    } catch (error) {
      console.error("Error fetching match:", error)
      toast({
        title: "Error",
        description: "Failed to load match data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateFrame = (
    teamMemberId: string,
    gameIndex: number,
    frameIndex: number,
    roll: "roll1" | "roll2" | "roll3",
    value: string,
  ) => {
    const numValue = value === "" ? null : Number.parseInt(value)

    if (numValue !== null && (numValue < 0 || numValue > 10)) return

    setGames((prev) => {
      const newGames = { ...prev }
      const game = { ...newGames[teamMemberId][gameIndex] }
      const frames = [...game.frames]
      const frame = { ...frames[frameIndex] }

      // Update the roll
      frame[roll] = numValue

      // Calculate strike/spare flags
      if (frameIndex < 9) {
        frame.isStrike = frame.roll1 === 10
        frame.isSpare =
          !frame.isStrike && frame.roll1 !== null && frame.roll2 !== null && frame.roll1 + frame.roll2 === 10
      } else {
        // 10th frame logic
        frame.isStrike = frame.roll1 === 10
        frame.isSpare =
          !frame.isStrike && frame.roll1 !== null && frame.roll2 !== null && frame.roll1 + frame.roll2 === 10
      }

      frames[frameIndex] = frame

      // Recalculate all scores
      const calculatedFrames = BowlingScorer.calculateRunningTotal(frames)
      const totalScore = calculatedFrames[9]?.runningTotal || 0

      game.frames = calculatedFrames
      game.totalScore = totalScore
      game.finalScore = totalScore + game.handicap

      newGames[teamMemberId][gameIndex] = game
      return newGames
    })
  }

  const saveScore = async (teamMemberId: string, gameIndex: number) => {
    setSaving(true)
    try {
      const game = games[teamMemberId][gameIndex]

      const response = await fetch("/api/scoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: params.id,
          teamMemberId,
          gameNumber: gameIndex + 1,
          frames: game.frames,
          handicap: game.handicap,
        }),
      })

      if (!response.ok) throw new Error("Failed to save score")

      toast({
        title: "Success",
        description: "Score saved successfully",
      })
    } catch (error) {
      console.error("Error saving score:", error)
      toast({
        title: "Error",
        description: "Failed to save score",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!match) {
    return <div>Match not found</div>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{match.tournament.name}</h1>
          <p className="text-muted-foreground">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {Array.from({ length: match.tournament.gamesPerMatch }, (_, i) => (
            <Button
              key={i + 1}
              variant={currentGame === i + 1 ? "default" : "outline"}
              onClick={() => setCurrentGame(i + 1)}
            >
              Game {i + 1}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Home Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {match.homeTeam.name}
              <Badge variant="secondary">Home</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {match.homeTeam.teamMembers.map((tm) => (
              <ScoringCard
                key={tm.id}
                teamMember={tm}
                game={games[tm.id]?.[currentGame - 1]}
                gameNumber={currentGame}
                onFrameUpdate={(frameIndex, roll, value) =>
                  updateFrame(tm.id, currentGame - 1, frameIndex, roll, value)
                }
                onSave={() => saveScore(tm.id, currentGame - 1)}
                saving={saving}
              />
            ))}
          </CardContent>
        </Card>

        {/* Away Team */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {match.awayTeam.name}
              <Badge variant="outline">Away</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {match.awayTeam.teamMembers.map((tm) => (
              <ScoringCard
                key={tm.id}
                teamMember={tm}
                game={games[tm.id]?.[currentGame - 1]}
                gameNumber={currentGame}
                onFrameUpdate={(frameIndex, roll, value) =>
                  updateFrame(tm.id, currentGame - 1, frameIndex, roll, value)
                }
                onSave={() => saveScore(tm.id, currentGame - 1)}
                saving={saving}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface ScoringCardProps {
  teamMember: TeamMember
  game?: BowlingGame
  gameNumber: number
  onFrameUpdate: (frameIndex: number, roll: "roll1" | "roll2" | "roll3", value: string) => void
  onSave: () => void
  saving: boolean
}

function ScoringCard({ teamMember, game, gameNumber, onFrameUpdate, onSave, saving }: ScoringCardProps) {
  if (!game) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              {teamMember.member.firstName} {teamMember.member.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">
              Avg: {teamMember.member.average} | Handicap: {game.handicap}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{game.finalScore}</div>
            <div className="text-sm text-muted-foreground">
              {game.totalScore} + {game.handicap}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-10 gap-1 mb-4">
          {game.frames.map((frame, frameIndex) => (
            <FrameInput
              key={frameIndex}
              frame={frame}
              frameIndex={frameIndex}
              onUpdate={(roll, value) => onFrameUpdate(frameIndex, roll, value)}
            />
          ))}
        </div>

        <Button onClick={onSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Game {gameNumber}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

interface FrameInputProps {
  frame: Frame
  frameIndex: number
  onUpdate: (roll: "roll1" | "roll2" | "roll3", value: string) => void
}

function FrameInput({ frame, frameIndex, onUpdate }: FrameInputProps) {
  const is10thFrame = frameIndex === 9

  return (
    <div className="border rounded p-1">
      <div className="text-xs text-center mb-1">{frameIndex + 1}</div>

      <div className="space-y-1">
        <div className="flex gap-1">
          <Input
            type="number"
            min="0"
            max="10"
            value={frame.roll1 ?? ""}
            onChange={(e) => onUpdate("roll1", e.target.value)}
            className="h-6 text-xs p-1"
            placeholder="0"
          />

          {(!frame.isStrike || is10thFrame) && (
            <Input
              type="number"
              min="0"
              max="10"
              value={frame.roll2 ?? ""}
              onChange={(e) => onUpdate("roll2", e.target.value)}
              className="h-6 text-xs p-1"
              placeholder="0"
            />
          )}
        </div>

        {is10thFrame && (frame.isStrike || frame.isSpare) && (
          <Input
            type="number"
            min="0"
            max="10"
            value={frame.roll3 ?? ""}
            onChange={(e) => onUpdate("roll3", e.target.value)}
            className="h-6 text-xs p-1"
            placeholder="0"
          />
        )}

        <div className="text-xs text-center font-semibold">{frame.runningTotal ?? "-"}</div>
      </div>
    </div>
  )
}
