import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Users, Target, BarChart3 } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Bowling Tournament Management System</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Complete tournament management from setup to scoring, with real-time leaderboards and comprehensive
            reporting.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
              <CardTitle>Tournaments</CardTitle>
              <CardDescription>Create and manage bowling tournaments with custom rules and formats</CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <CardTitle>Teams & Players</CardTitle>
              <CardDescription>
                Organize teams, manage player registrations and track member performance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Target className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <CardTitle>Live Scoring</CardTitle>
              <CardDescription>
                Real-time frame-by-frame scoring with automatic calculations and handicaps
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-purple-500 mx-auto mb-2" />
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Comprehensive reports, leaderboards and performance analytics</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="text-center">
          <Link href="/auth/login">
            <Button size="lg" className="mr-4">
              Get Started
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              View Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
