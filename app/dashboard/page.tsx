"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Trophy, Users, Target, Plus, TrendingUp, Activity, Clock, Star } from "lucide-react"

interface DashboardStats {
  activeTournaments: number
  totalTeams: number
  ongoingMatches: number
  upcomingMatches: number
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    activeTournaments: 0,
    totalTeams: 0,
    ongoingMatches: 0,
    upcomingMatches: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, fetch dashboard stats from API
    // For now, using mock data
    setTimeout(() => {
      setStats({
        activeTournaments: 1,
        totalTeams: 24,
        ongoingMatches: 1,
        upcomingMatches: 130,
      })
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <AuthGuard>
        <div className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome back, {session?.user?.name || "System Administrator"}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
              Here's what's happening with your tournaments
            </p>
          </div>
          <Link href="/tournaments/create">
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Tournament
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Active Tournaments</CardTitle>
              <div className="p-2 bg-blue-600 rounded-lg">
                <Trophy className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.activeTournaments}</div>
              {/* <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +2 from last month
              </p> */}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Teams</CardTitle>
              <div className="p-2 bg-green-600 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.totalTeams}</div>
              <p className="text-sm text-green-600 dark:text-green-400 mt-1">Across all tournaments</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Ongoing Matches
              </CardTitle>
              <div className="p-2 bg-orange-600 rounded-lg">
                <Activity className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.ongoingMatches}</div>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">Live scoring in progress</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Upcoming Matches
              </CardTitle>
              <div className="p-2 bg-purple-600 rounded-lg">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.upcomingMatches}</div>
              <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">Next 3 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/tournaments/create">
                <Button className="w-full justify-start h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="h-5 w-5 mr-3" />
                  Create New Tournament
                </Button>
              </Link>
              <Link href="/tournaments">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-transparent"
                >
                  <Trophy className="h-5 w-5 mr-3" />
                  View All Tournaments
                </Button>
              </Link>
              <Link href="/teams">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 hover:bg-green-50 dark:hover:bg-green-900/20 bg-transparent"
                >
                  <Users className="h-5 w-5 mr-3" />
                  Manage Teams
                </Button>
              </Link>
              <Link href="/reports">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 hover:bg-purple-50 dark:hover:bg-purple-900/20 bg-transparent"
                >
                  <Target className="h-5 w-5 mr-3" />
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Design IncrediBowl Season 3 started
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">New team registered</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Match scores updated</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">6 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
