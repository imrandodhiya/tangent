"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ArrowLeft, Edit, Users, Trophy, Building, Calendar, Phone, Mail, Trash2, Settings } from "lucide-react"
import { PERMISSIONS } from "@/lib/permissions"

interface TeamMember {
  id: string
  roleInTeam: string
  jerseyNo?: number
  positionNo?: number
  isReplacement: boolean
  member: {
    id: string
    firstName: string
    lastName: string
    gender: string
    mobile: string
    email?: string
    photoUrl?: string
    experienceYears?: number
  }
}

interface Team {
  id: string
  name: string
  baseName: string
  suffix?: string
  logoUrl?: string
  color?: string
  seedNo?: number
  tournament: {
    id: string
    name: string
    status: string
    startDate: string
    endDate: string
  }
  brand: {
    id: string
    name: string
    logoUrl?: string
    primaryColor?: string
    contactName?: string
    contactEmail?: string
  }
  teamMembers: TeamMember[]
  slotTeams: Array<{
    tournamentSlot: {
      id: string
      slotNo: number
      name: string
      scheduledAt?: string
    }
    lane?: {
      id: string
      laneNo: number
      venueName?: string
    }
  }>
}

export default function TeamDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [memberFormData, setMemberFormData] = useState({
    roleInTeam: "PLAYER",
    jerseyNo: "",
    positionNo: "",
    isReplacement: false,
  })

  useEffect(() => {
    if (params.id) {
      fetchTeam(params.id as string)
    }
  }, [params.id])

  const fetchTeam = async (id: string) => {
    try {
      const response = await fetch(`/api/teams/${id}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data)
      } else {
        router.push("/teams")
      }
    } catch (error) {
      console.error("Error fetching team:", error)
      router.push("/teams")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/teams/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/teams")
      } else {
        alert("Failed to delete team")
      }
    } catch (error) {
      console.error("Error deleting team:", error)
      alert("An error occurred while deleting the team")
    }
  }

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member)
    setMemberFormData({
      roleInTeam: member.roleInTeam,
      jerseyNo: member.jerseyNo?.toString() || "",
      positionNo: member.positionNo?.toString() || "",
      isReplacement: member.isReplacement,
    })
  }

  const handleUpdateMember = async () => {
    if (!editingMember) return

    try {
      const response = await fetch(`/api/teams/${params.id}/members/${editingMember.member.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...memberFormData,
          jerseyNo: memberFormData.jerseyNo ? Number.parseInt(memberFormData.jerseyNo) : null,
          positionNo: memberFormData.positionNo ? Number.parseInt(memberFormData.positionNo) : null,
        }),
      })

      if (response.ok) {
        await fetchTeam(params.id as string)
        setEditingMember(null)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update member")
      }
    } catch (error) {
      console.error("Error updating member:", error)
      alert("An error occurred while updating the member")
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the team?")) return

    try {
      const response = await fetch(`/api/teams/${params.id}/members/${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchTeam(params.id as string)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to remove member")
      }
    } catch (error) {
      console.error("Error removing member:", error)
      alert("An error occurred while removing the member")
    }
  }

  const getGenderDistribution = (members: TeamMember[]) => {
    const male = members.filter((tm) => tm.member.gender === "MALE").length
    const female = members.filter((tm) => tm.member.gender === "FEMALE").length
    return { male, female }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "CAPTAIN":
        return "bg-yellow-100 text-yellow-800"
      case "COACH":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={[PERMISSIONS.TEAMS_VIEW]}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!team) {
    return (
      <AuthGuard requiredPermissions={[PERMISSIONS.TEAMS_VIEW]}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Team not found</h1>
            <Link href="/teams">
              <Button>Back to Teams</Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const { male, female } = getGenderDistribution(team.teamMembers)

  return (
    <AuthGuard requiredPermissions={[PERMISSIONS.TEAMS_VIEW]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/teams">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Teams
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
                {team.seedNo && <Badge variant="outline">Seed #{team.seedNo}</Badge>}
                {team.color && (
                  <div
                    className="w-6 h-6 rounded border-2 border-gray-300"
                    style={{ backgroundColor: team.color }}
                    title={`Team Color: ${team.color}`}
                  />
                )}
              </div>
              <p className="text-gray-600">
                {team.tournament.name} • {team.brand.name}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/teams/${team.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Team
              </Button>
            </Link>
            <Button variant="destructive" onClick={handleDeleteTeam}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <Tabs defaultValue={searchParams.get("tab") || "overview"} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{team.teamMembers.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {male}M, {female}F
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tournament</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{team.tournament.name}</div>
                  <p className="text-xs text-muted-foreground">{team.tournament.status}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Brand</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{team.brand.name}</div>
                  <p className="text-xs text-muted-foreground">{team.brand.contactName || "No contact"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Scheduled Slots</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{team.slotTeams.length}</div>
                  <p className="text-xs text-muted-foreground">tournament slots</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Team Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Base Name:</span> {team.baseName}
                    </div>
                    {team.suffix && (
                      <div>
                        <span className="font-medium">Suffix:</span> {team.suffix}
                      </div>
                    )}
                    {team.seedNo && (
                      <div>
                        <span className="font-medium">Seed Number:</span> #{team.seedNo}
                      </div>
                    )}
                    {team.color && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Team Color:</span>
                        <div className="w-4 h-4 rounded border" style={{ backgroundColor: team.color }} />
                        <span className="text-xs text-gray-500">{team.color}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {new Date(team.tournament.startDate).toLocaleDateString()} -{" "}
                      {new Date(team.tournament.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Brand Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {team.brand.contactName && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{team.brand.contactName}</span>
                    </div>
                  )}
                  {team.brand.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${team.brand.contactEmail}`} className="text-sm text-blue-600 hover:underline">
                        {team.brand.contactEmail}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members ({team.teamMembers.length})</CardTitle>
                  <CardDescription>Players, captains, and coaches</CardDescription>
                </div>
                <Link href={`/teams/${team.id}/members/add`}>
                  <Button>
                    <Users className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {team.teamMembers.map((teamMember) => (
                    <div key={teamMember.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={teamMember.member.photoUrl || "/placeholder.svg"} />
                          <AvatarFallback>
                            {teamMember.member.firstName[0]}
                            {teamMember.member.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {teamMember.member.firstName} {teamMember.member.lastName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge className={getRoleColor(teamMember.roleInTeam)}>{teamMember.roleInTeam}</Badge>
                            <span>•</span>
                            <span>{teamMember.member.gender}</span>
                            {teamMember.jerseyNo && (
                              <>
                                <span>•</span>
                                <span>#{teamMember.jerseyNo}</span>
                              </>
                            )}
                            {teamMember.member.experienceYears && (
                              <>
                                <span>•</span>
                                <span>{teamMember.member.experienceYears} years exp.</span>
                              </>
                            )}
                            {teamMember.isReplacement && <Badge variant="outline">Replacement</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {teamMember.member.mobile}
                          </div>
                          {teamMember.member.email && (
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-4 w-4" />
                              {teamMember.member.email}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditMember(teamMember)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleRemoveMember(teamMember.member.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {team.teamMembers.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members</h3>
                      <p className="text-gray-600 mb-4">Start by adding players to this team</p>
                      <Link href={`/teams/${team.id}/members/add`}>
                        <Button>
                          <Users className="h-4 w-4 mr-2" />
                          Add First Member
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Schedule</CardTitle>
                <CardDescription>Assigned slots and lane assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {team.slotTeams.map((slotTeam, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">
                          Slot {slotTeam.tournamentSlot.slotNo}: {slotTeam.tournamentSlot.name}
                        </h3>
                        {slotTeam.lane && (
                          <p className="text-sm text-gray-600">
                            Lane {slotTeam.lane.laneNo}
                            {slotTeam.lane.venueName && ` at ${slotTeam.lane.venueName}`}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        {slotTeam.tournamentSlot.scheduledAt ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(slotTeam.tournamentSlot.scheduledAt).toLocaleString()}
                          </div>
                        ) : (
                          <span>Not scheduled</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {team.slotTeams.length === 0 && (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No scheduled slots</h3>
                      <p className="text-gray-600">This team has not been assigned to any tournament slots yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Member Dialog */}
        <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>Update member role and team-specific information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role in Team</Label>
                <Select
                  value={memberFormData.roleInTeam}
                  onValueChange={(value) => setMemberFormData((prev) => ({ ...prev, roleInTeam: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLAYER">Player</SelectItem>
                    <SelectItem value="CAPTAIN">Captain</SelectItem>
                    <SelectItem value="COACH">Coach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jerseyNo">Jersey Number</Label>
                  <Input
                    id="jerseyNo"
                    type="number"
                    min="1"
                    max="99"
                    value={memberFormData.jerseyNo}
                    onChange={(e) => setMemberFormData((prev) => ({ ...prev, jerseyNo: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionNo">Position Number</Label>
                  <Input
                    id="positionNo"
                    type="number"
                    min="1"
                    value={memberFormData.positionNo}
                    onChange={(e) => setMemberFormData((prev) => ({ ...prev, positionNo: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Replacement Player</Label>
                  <p className="text-sm text-gray-600">Mark as replacement for another player</p>
                </div>
                <Switch
                  checked={memberFormData.isReplacement}
                  onCheckedChange={(checked) => setMemberFormData((prev) => ({ ...prev, isReplacement: checked }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingMember(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateMember}>Update Member</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
