"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ArrowLeft, Plus, Settings, Trash2, Target } from "lucide-react"

interface Tournament {
  id: string
  name: string
  status: string
  startDate: string
}

interface Lane {
  id: string
  laneNo: number
  venueName: string | null
}

interface LaneAssignment {
  id: string
  lane: Lane
  tournament: Tournament
  createdAt: string
}

interface Operator {
  id: string
  firstName: string
  lastName: string
  email: string
  role: { name: string }
}

export default function OperatorLanesPage() {
  const params = useParams()
  const [operator, setOperator] = useState<Operator | null>(null)
  const [assignments, setAssignments] = useState<LaneAssignment[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [lanes, setLanes] = useState<Lane[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState("")
  const [selectedLanes, setSelectedLanes] = useState<string[]>([])

  useEffect(() => {
    if (params.id) {
      fetchOperator(params.id as string)
      fetchAssignments(params.id as string)
      fetchTournaments()
    }
  }, [params.id])

  useEffect(() => {
    if (selectedTournament) {
      fetchLanes(selectedTournament)
    }
  }, [selectedTournament])

  const fetchOperator = async (id: string) => {
    try {
      const response = await fetch(`/api/operators/${id}`)
      if (response.ok) {
        const data = await response.json()
        setOperator(data)
      }
    } catch (error) {
      console.error("Error fetching operator:", error)
    }
  }

  const fetchAssignments = async (operatorId: string) => {
    try {
      const response = await fetch(`/api/operators/${operatorId}/lanes`)
      if (response.ok) {
        const data = await response.json()
        setAssignments(data)
      }
    } catch (error) {
      console.error("Error fetching assignments:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTournaments = async () => {
    try {
      const response = await fetch("/api/tournaments?status=ACTIVE")
      if (response.ok) {
        const data = await response.json()
        setTournaments(data.tournaments || [])
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error)
    }
  }

  const fetchLanes = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/lanes`)
      if (response.ok) {
        const data = await response.json()
        setLanes(data)
      }
    } catch (error) {
      console.error("Error fetching lanes:", error)
    }
  }

  const handleAssignLanes = async () => {
    try {
      const response = await fetch(`/api/operators/${params.id}/lanes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tournamentId: selectedTournament,
          laneIds: selectedLanes,
        }),
      })

      if (response.ok) {
        await fetchAssignments(params.id as string)
        setDialogOpen(false)
        setSelectedTournament("")
        setSelectedLanes([])
      } else {
        const error = await response.json()
        alert(error.error || "Failed to assign lanes")
      }
    } catch (error) {
      console.error("Error assigning lanes:", error)
      alert("An error occurred while assigning lanes")
    }
  }

  const handleRemoveAssignment = async (laneId: string, tournamentId: string) => {
    if (!confirm("Are you sure you want to remove this lane assignment?")) return

    try {
      const response = await fetch(`/api/operators/${params.id}/lanes?laneId=${laneId}&tournamentId=${tournamentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchAssignments(params.id as string)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to remove assignment")
      }
    } catch (error) {
      console.error("Error removing assignment:", error)
      alert("An error occurred while removing the assignment")
    }
  }

  const toggleLaneSelection = (laneId: string) => {
    setSelectedLanes((prev) => (prev.includes(laneId) ? prev.filter((id) => id !== laneId) : [...prev, laneId]))
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={["user.view"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!operator) {
    return (
      <AuthGuard requiredPermissions={["user.view"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Operator not found</h1>
            <Link href="/operators">
              <Button>Back to Operators</Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredPermissions={["user.view"]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/operators">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Operators
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {operator.firstName} {operator.lastName} - Lane Assignments
              </h1>
              <p className="text-gray-600 mt-2">
                Manage lane assignments for scoring operations • {operator.role.name}
              </p>
            </div>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Assign Lanes
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Lane Assignments ({assignments.length})</CardTitle>
            <CardDescription>Lanes assigned to this operator for scoring entry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        Lane {assignment.lane.laneNo}
                        {assignment.lane.venueName && ` - ${assignment.lane.venueName}`}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{assignment.tournament.name}</span>
                        <span>•</span>
                        <Badge variant="outline">{assignment.tournament.status}</Badge>
                        <span>•</span>
                        <span>Assigned {new Date(assignment.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/scoring/${assignment.tournament.id}/matches`}>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Score Entry
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveAssignment(assignment.lane.id, assignment.tournament.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No lane assignments</h3>
                  <p className="text-gray-600 mb-4">This operator has not been assigned to any lanes yet</p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign First Lane
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Assign Lanes to Operator</DialogTitle>
              <DialogDescription>
                Select a tournament and assign specific lanes for scoring operations
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tournament</label>
                <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tournament" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournaments.map((tournament) => (
                      <SelectItem key={tournament.id} value={tournament.id}>
                        {tournament.name} ({tournament.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedTournament && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lanes</label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {lanes.map((lane) => (
                      <div key={lane.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={lane.id}
                          checked={selectedLanes.includes(lane.id)}
                          onCheckedChange={() => toggleLaneSelection(lane.id)}
                        />
                        <label htmlFor={lane.id} className="text-sm">
                          Lane {lane.laneNo}
                          {lane.venueName && ` - ${lane.venueName}`}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignLanes} disabled={!selectedTournament || selectedLanes.length === 0}>
                Assign Lanes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
