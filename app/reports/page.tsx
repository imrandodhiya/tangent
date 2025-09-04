"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Trophy, Users, Target, TrendingUp, Download } from "lucide-react"

interface TournamentAnalytics {
  id: string
  name: string
  status: string
  totalTeams: number
  totalMembers: number
  completedMatches: number
  totalMatches: number
  totalGames: number
  averageScore: number
  highGame: number
  startDate: string
  endDate: string
}

interface MemberAnalytics {
  id: string
  name: string
  average: number
  currentAverage: number
  highGame: number
  highSeries: number
  lowGame: number
  totalGames: number
  tournaments: number
  recentScores: number[]
  scoringTrend: Array<{ game: number; score: number; average: number }>
}

interface TeamAnalytics {
  id: string
  name: string
  tournament: string
  wins: number
  losses: number
  winPercentage: number
  totalMatches: number
  completedMatches: number
  teamAverage: number
  highTeamGame: number
  memberCount: number
  members: Array<{
    id: string
    name: string
    average: number
    currentAverage: number
    gamesPlayed: number
    highGame: number
  }>
}

export default function ReportsPage() {
  const [tournaments, setTournaments] = useState<TournamentAnalytics[]>([])
  const [members, setMembers] = useState<MemberAnalytics[]>([])
  const [teams, setTeams] = useState<TeamAnalytics[]>([])
  const [selectedTournament, setSelectedTournament] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [selectedTournament])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const tournamentParam = selectedTournament !== "all" ? `?tournamentId=${selectedTournament}` : ""

      const [tournamentsRes, membersRes, teamsRes] = await Promise.all([
        fetch(`/api/analytics/tournaments${tournamentParam}`),
        fetch(`/api/analytics/members${tournamentParam}`),
        fetch(`/api/analytics/teams${tournamentParam}`),
      ])

      const [tournamentsData, membersData, teamsData] = await Promise.all([
        tournamentsRes.json(),
        membersRes.json(),
        teamsRes.json(),
      ])

      setTournaments(tournamentsData)
      setMembers(membersData)
      setTeams(teamsData)
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = () => {
    // Implementation for exporting reports
    console.log("Exporting report...")
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Tournament performance and statistics</p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedTournament} onValueChange={setSelectedTournament}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select tournament" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tournaments</SelectItem>
              {tournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={exportReport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tournaments.length}</div>
                <p className="text-xs text-muted-foreground">
                  {tournaments.filter((t) => t.status === "ACTIVE").length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teams.length}</div>
                <p className="text-xs text-muted-foreground">
                  {tournaments.reduce((sum, t) => sum + t.totalMembers, 0)} members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Games Played</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tournaments.reduce((sum, t) => sum + t.totalGames, 0)}</div>
                <p className="text-xs text-muted-foreground">
                  {tournaments.reduce((sum, t) => sum + t.completedMatches, 0)} matches completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tournaments.length > 0
                    ? Math.round(tournaments.reduce((sum, t) => sum + t.averageScore, 0) / tournaments.length)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  High: {tournaments.length > 0 ? Math.max(...tournaments.map((t) => t.highGame)) : 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tournaments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="completedMatches" fill="#8884d8" name="Completed" />
                    <Bar dataKey="totalMatches" fill="#82ca9d" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={teams.slice(0, 5).map((team, index) => ({
                        name: team.name,
                        value: team.winPercentage,
                        fill: COLORS[index % COLORS.length],
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {teams.slice(0, 5).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tournaments" className="space-y-6">
          <div className="grid gap-6">
            {tournaments.map((tournament) => (
              <Card key={tournament.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{tournament.name}</CardTitle>
                    <Badge variant={tournament.status === "ACTIVE" ? "default" : "secondary"}>
                      {tournament.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{tournament.totalTeams}</div>
                      <p className="text-sm text-muted-foreground">Teams</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{tournament.totalMembers}</div>
                      <p className="text-sm text-muted-foreground">Members</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{tournament.averageScore}</div>
                      <p className="text-sm text-muted-foreground">Avg Score</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{tournament.highGame}</div>
                      <p className="text-sm text-muted-foreground">High Game</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <div className="grid gap-6">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{team.name}</CardTitle>
                    <Badge variant="outline">{team.tournament}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{team.wins}</div>
                      <p className="text-sm text-muted-foreground">Wins</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{team.losses}</div>
                      <p className="text-sm text-muted-foreground">Losses</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{team.winPercentage}%</div>
                      <p className="text-sm text-muted-foreground">Win Rate</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{team.teamAverage}</div>
                      <p className="text-sm text-muted-foreground">Team Avg</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{team.highTeamGame}</div>
                      <p className="text-sm text-muted-foreground">High Game</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Team Members</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {team.members.map((member) => (
                        <div key={member.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="font-medium">{member.name}</span>
                          <div className="text-sm text-muted-foreground">
                            Avg: {member.currentAverage} | High: {member.highGame}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <div className="grid gap-6">
            {members.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <CardTitle>{member.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div>
                      <div className="text-2xl font-bold">{member.currentAverage}</div>
                      <p className="text-sm text-muted-foreground">Current Avg</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{member.highGame}</div>
                      <p className="text-sm text-muted-foreground">High Game</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{member.highSeries}</div>
                      <p className="text-sm text-muted-foreground">High Series</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{member.totalGames}</div>
                      <p className="text-sm text-muted-foreground">Games Played</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{member.tournaments}</div>
                      <p className="text-sm text-muted-foreground">Tournaments</p>
                    </div>
                  </div>

                  {member.scoringTrend.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Scoring Trend</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={member.scoringTrend.slice(-20)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="game" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="score" stroke="#8884d8" name="Score" />
                          <Line type="monotone" dataKey="average" stroke="#82ca9d" name="Running Avg" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
