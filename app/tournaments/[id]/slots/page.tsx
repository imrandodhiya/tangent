"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Users, MapPin, Clock, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Lane {
  id: string
  laneNo: number
  name: string
}

interface Team {
  id: string
  name: string
  brand: {
    id: string
    name: string
  }
  teamMembers: Array<{
    member: {
      id: string
      name: string
    }
  }>
}

interface SlotTeam {
  id: string
  positionNo: number
  seed: number | null
  team: Team
  lane: Lane | null
}

interface TournamentSlot {
  id: string
  slotNo: number
  name: string
  scheduledAt: string | null
  status: string
  tournamentRound: {
    id: string
    roundNo: number
    name: string
  }
  slotTeams: SlotTeam[]
}

export default function TournamentSlotsPage() {
  const params = useParams()
  const tournamentId = params.id as string
  const { toast } = useToast()

  const [slots, setSlots] = useState<TournamentSlot[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [lanes, setLanes] = useState<Lane[]>([])
  const [loading, setLoading] = useState(true)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TournamentSlot | null>(null)
  const [assignForm, setAssignForm] = useState({
    teamId: "",
    laneId: "",
    positionNo: 1,
    seed: "",
  })

  useEffect(() => {
    fetchSlots()
    fetchTeams()
    fetchLanes()
  }, [tournamentId])

  const fetchSlots = async () => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/slots`)
      if (response.ok) {
        const data = await response.json()
        setSlots(data)
      }
    } catch (error) {
      console.error("Error fetching slots:", error)
      toast({
        title: "Error",
        description: "Failed to fetch tournament slots",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch(`/api/teams?tournamentId=${tournamentId}`)
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  const fetchLanes = async () => {
    try {
      const response = await fetch("/api/lanes")
      if (response.ok) {
        const data = await response.json()
        setLanes(data)
      }
    } catch (error) {
      console.error("Error fetching lanes:", error)
    }
  }

  const handleAssignTeam = async () => {
    if (!selectedSlot || !assignForm.teamId) return

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/slots/${selectedSlot.id}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: assignForm.teamId,
          laneId: assignForm.laneId || undefined,
          positionNo: assignForm.positionNo,
          seed: assignForm.seed ? Number.parseInt(assignForm.seed) : undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Team assigned to slot successfully",
        })
        setAssignDialogOpen(false)
        setAssignForm({ teamId: "", laneId: "", positionNo: 1, seed: "" })
        fetchSlots()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to assign team",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error assigning team:", error)
      toast({
        title: "Error",
        description: "Failed to assign team to slot",
        variant: "destructive",
      })
    }
  }

  const handleRemoveTeam = async (slotId: string, teamId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/slots/${slotId}/teams?teamId=${teamId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Team removed from slot successfully",
        })
        fetchSlots()
      } else {
        toast({
          title: "Error",
          description: "Failed to remove team from slot",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing team:", error)
      toast({
        title: "Error",
        description: "Failed to remove team from slot",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "live":
        return "bg-green-100 text-green-800"
      case "completed":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const groupedSlots = slots.reduce(
    (acc, slot) => {
      const roundKey = `Round ${slot.tournamentRound.roundNo}`
      if (!acc[roundKey]) {
        acc[roundKey] = []
      }
      acc[roundKey].push(slot)
      return acc
    },
    {} as Record<string, TournamentSlot[]>,
  )

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tournament Slots & Lane Assignment</h1>
          <p className="text-muted-foreground">Manage team assignments to tournament slots and lanes</p>
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(groupedSlots).map(([roundName, roundSlots]) => (
          <div key={roundName}>
            <h2 className="text-2xl font-semibold mb-4">{roundName}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roundSlots.map((slot) => (
                <Card key={slot.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{slot.name}</CardTitle>
                        <CardDescription>Slot #{slot.slotNo}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(slot.status)}>{slot.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {slot.scheduledAt && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {new Date(slot.scheduledAt).toLocaleString()}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Assigned Teams ({slot.slotTeams.length})</span>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedSlot(slot)
                              setAssignDialogOpen(true)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                        </div>

                        {slot.slotTeams.length > 0 ? (
                          <div className="space-y-2">
                            {slot.slotTeams.map((slotTeam) => (
                              <div
                                key={slotTeam.id}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  <div>
                                    <div className="font-medium text-sm">{slotTeam.team.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {slotTeam.team.brand.name} • Position {slotTeam.positionNo}
                                      {slotTeam.seed && ` • Seed ${slotTeam.seed}`}
                                    </div>
                                    {slotTeam.lane && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        Lane {slotTeam.lane.laneNo}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveTeam(slot.id, slotTeam.team.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No teams assigned</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Team to Slot</DialogTitle>
            <DialogDescription>
              Assign a team to {selectedSlot?.name} in {selectedSlot?.tournamentRound.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="team">Team</Label>
              <Select
                value={assignForm.teamId}
                onValueChange={(value) => setAssignForm({ ...assignForm, teamId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name} ({team.brand.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="lane">Lane (Optional)</Label>
              <Select
                value={assignForm.laneId}
                onValueChange={(value) => setAssignForm({ ...assignForm, laneId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a lane" />
                </SelectTrigger>
                <SelectContent>
                  {lanes.map((lane) => (
                    <SelectItem key={lane.id} value={lane.id}>
                      Lane {lane.laneNo} - {lane.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="position">Position Number</Label>
              <Input
                id="position"
                type="number"
                min="1"
                value={assignForm.positionNo}
                onChange={(e) => setAssignForm({ ...assignForm, positionNo: Number.parseInt(e.target.value) || 1 })}
              />
            </div>

            <div>
              <Label htmlFor="seed">Seed (Optional)</Label>
              <Input
                id="seed"
                type="number"
                min="1"
                value={assignForm.seed}
                onChange={(e) => setAssignForm({ ...assignForm, seed: e.target.value })}
                placeholder="Enter seed number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTeam} disabled={!assignForm.teamId}>
              Assign Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
