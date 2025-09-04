"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { Calculator, Trophy } from "lucide-react"
import Link from "next/link"

interface Tournament {
  id: string
  name: string
  status: string
  startDate: string
  endDate: string
}

export default function ScoringPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveTournaments()
  }, [])

  const fetchActiveTournaments = async () => {
    try {
      const response = await fetch("/api/tournaments?status=ACTIVE")
      if (response.ok) {
        const data = await response.json()
        setTournaments(data)
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error)
    } finally {
      setLoading(false)
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Score Entry</h1>
            <p className="text-gray-600 dark:text-gray-400">Enter and manage tournament scores</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                  {tournament.name}
                </CardTitle>
                <CardDescription>
                  {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                  {new Date(tournament.endDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Badge variant="default">{tournament.status}</Badge>
                  <div className="flex gap-2">
                    <Link href={`/scoring/${tournament.id}/matches`} className="flex-1">
                      <Button className="w-full" size="sm">
                        <Calculator className="h-4 w-4 mr-2" />
                        Enter Scores
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {tournaments.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calculator className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No active tournaments</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                There are no active tournaments available for score entry
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  )
}
