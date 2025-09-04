"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { ArrowLeft, Calculator, Users, Clock } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Match {
  id: string
  name: string
  scheduledAt: string | null
  status: string
  round: {
    id: string
    name: string
    roundNo: number
  }
  slotTeams: Array<{
    id: string
    team: {
      id: string
      name: string
      brand: {
        name: string
      }
    }
    lane: {
      id: string
      laneNo: number
    } | null
  }>
}

interface Tournament {
  id: string
  name: string
  status: string
}

export default function TournamentMatchesPage({ params }: { params: { tournamentId: string } }) {
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchTournamentAndMatches()
  }, [params.tournamentId])

  const fetchTournamentAndMatches = async () => {
    try {
      // Fetch tournament details
      const tournamentResponse = await fetch(`/api/tournaments/${params.tournamentId}`)
      if (tournamentResponse.ok) {
        const tournamentData = await tournamentResponse.json()
        setTournament(tournamentData)
      }

      // Fetch matches
      const matchesResponse = await fetch(`/api/tournaments/${params.tournamentId}/matches`)
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json()
        setMatches(matchesData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load tournament matches",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "secondary"
      case "LIVE":
        return "default"
      case "COMPLETED":
        return "outline"
      default:
        return "secondary"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthGuard requiredPermissions={[PERMISSIONS.SCORING_APPROVE]}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/scoring">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scoring
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{tournament?.name} - Matches</h1>
            <p className="text-gray-600 dark:text-gray-400">Select a match to enter scores</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <Card key={match.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    {match.name}
                  </span>
                  <Badge variant={getStatusColor(match.status)}>{match.status}</Badge>
                </CardTitle>
                <div className="text-sm text-gray-600">
                  {match.round.name} (Round {match.round.roundNo})
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {match.scheduledAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {new Date(match.scheduledAt).toLocaleString()}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4" />
                      Teams ({match.slotTeams.length})
                    </div>
                    {match.slotTeams.map((slotTeam) => (
                      <div key={slotTeam.id} className="flex items-center justify-between text-sm">
                        <span>
                          {slotTeam.team.name} ({slotTeam.team.brand.name})
                        </span>
                        {slotTeam.lane && <Badge variant="outline">Lane {slotTeam.lane.laneNo}</Badge>}
                      </div>
                    ))}
                  </div>

                  <Link href={`/scoring/${params.tournamentId}/matches/${match.id}`} className="block">
                    <Button className="w-full" size="sm">
                      <Calculator className="h-4 w-4 mr-2" />
                      Enter Scores
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {matches.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calculator className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No matches found</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                This tournament doesn't have any matches set up yet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  )
}
