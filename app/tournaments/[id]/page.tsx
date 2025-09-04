"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthGuard } from "@/components/auth/auth-guard"
import {
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Target,
} from "lucide-react"
import { TournamentStatus, type TournamentVisibility } from "@prisma/client"
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
import { Checkbox } from "@/components/ui/checkbox"

interface Tournament {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  status: TournamentStatus
  visibility: TournamentVisibility
  state: { name: string }
  city: { name: string }
  brandsCount: number
  teamsPerBrand: number
  playersPerTeam: number
  malePerTeam: number
  femalePerTeam: number
  lanesTotal: number
  framesPerGame: number
  handicapBaseScore: number | null
  handicapPercent: number | null
  femaleAdjustmentPins: number | null
  allowManualOverride: boolean
  requireDualApproval: boolean
  laneRotationEnabled: boolean
  youtubeLiveUrl: string | null
  rounds: Array<{
    id: string
    roundNo: number
    name: string
    isKnockout: boolean
    tournamentMatches: Array<{
      id: string
      matchNo: number
      name: string
      scheduledAt: string | null
      laneNo: number | null
      team1: { id: string; name: string; brand: { name: string } } | null
      team2: { id: string; name: string; brand: { name: string } } | null
    }>
  }>
  teams: Array<{
    id: string
    name: string
    brand: { name: string }
    teamMembers: Array<{
      member: { firstName: string; lastName: string }
    }>
  }>
  tournamentBrands: Array<{
    brand: { name: string }
    numberOfTeams: number
  }>
}

interface Brand {
  id: string
  name: string
  logoUrl?: string
  primaryColor?: string
  contactName?: string
  contactEmail?: string
}

interface TournamentBrand {
  id: string
  brandId: string
  numberOfTeams: number
  brand: Brand
}

interface TournamentSlot {
  id: string
  tournamentId: string
  roundNo: number
  matchNo: number
  slotNo: number
  name: string
  laneNo: number | null
  slotTeams: Array<{
    id: string
    team: {
      id: string
      name: string
      brand: { name: string }
    }
  }>
}

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [tournamentBrands, setTournamentBrands] = useState<TournamentBrand[]>([])
  const [availableBrands, setAvailableBrands] = useState<Brand[]>([])
  const [tournamentSlots, setTournamentSlots] = useState<TournamentSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [brandDialogOpen, setBrandDialogOpen] = useState(false)
  const [slotDialogOpen, setSlotDialogOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<TournamentBrand | null>(null)
  const [editingSlot, setEditingSlot] = useState<TournamentSlot | null>(null)
  const [brandFormData, setBrandFormData] = useState({
    brandId: "",
    numberOfTeams: 1,
  })
  const [slotFormData, setSlotFormData] = useState({
    roundNo: 1,
    matchNo: 1,
    slotNo: 1,
    name: "",
    laneNo: null as number | null,
    teamIds: [] as string[],
  })
  const [laneAssignments, setLaneAssignments] = useState<{
    [key: string]: { laneNo?: number; team1Id?: string; team2Id?: string }
  }>({})
  const [savingAssignments, setSavingAssignments] = useState(false)
  const [selectedBrandId, setSelectedBrandId] = useState<string>("")
  const [brandTeams, setBrandTeams] = useState<
    Array<{
      id: string
      name: string
      brand: { name: string }
    }>
  >([])

  useEffect(() => {
    if (params.id) {
      fetchTournament(params.id as string)
      fetchTournamentBrands(params.id as string)
      fetchAvailableBrands()
      fetchTournamentSlots(params.id as string)
    }
  }, [params.id])

  const fetchTournament = async (id: string) => {
    try {
      const response = await fetch(`/api/tournaments/${id}`)
      if (response.ok) {
        const data = await response.json()
        setTournament(data)
      } else {
        router.push("/tournaments")
      }
    } catch (error) {
      console.error("Error fetching tournament:", error)
      router.push("/tournaments")
    } finally {
      setLoading(false)
    }
  }

  const fetchTournamentBrands = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/brands`)
      if (response.ok) {
        const data = await response.json()
        setTournamentBrands(data)
      }
    } catch (error) {
      console.error("Error fetching tournament brands:", error)
    }
  }

  const fetchAvailableBrands = async () => {
    try {
      const response = await fetch("/api/brands?pageSize=1000") // Fetch large number to get all brands
      if (response.ok) {
        const data = await response.json()
        setAvailableBrands(data.brands || [])
      }
    } catch (error) {
      console.error("Error fetching brands:", error)
    }
  }

  const fetchTournamentSlots = async (tournamentId: string) => {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/slots`)
      if (response.ok) {
        const data = await response.json()
        setTournamentSlots(data)
      }
    } catch (error) {
      console.error("Error fetching tournament slots:", error)
    }
  }

  const fetchTeamsByBrand = async (brandId: string) => {
    try {
      const response = await fetch(`/api/teams?brandId=${brandId}&pageSize=100`)
      if (response.ok) {
        const data = await response.json()
        setBrandTeams(data.teams || [])
      }
    } catch (error) {
      console.error("Error fetching teams by brand:", error)
      setBrandTeams([])
    }
  }

  const handleAddBrand = async () => {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/brands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(brandFormData),
      })

      if (response.ok) {
        await fetchTournamentBrands(params.id as string)
        setBrandDialogOpen(false)
        setBrandFormData({ brandId: "", numberOfTeams: 1 })
      } else {
        const error = await response.json()
        alert(error.error || "Failed to add brand")
      }
    } catch (error) {
      console.error("Error adding brand:", error)
      alert("An error occurred while adding the brand")
    }
  }

  const handleUpdateBrand = async () => {
    if (!editingBrand) return

    try {
      const response = await fetch(`/api/tournaments/${params.id}/brands/${editingBrand.brandId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ numberOfTeams: brandFormData.numberOfTeams }),
      })

      if (response.ok) {
        await fetchTournamentBrands(params.id as string)
        setBrandDialogOpen(false)
        setEditingBrand(null)
        setBrandFormData({ brandId: "", numberOfTeams: 1 })
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update brand")
      }
    } catch (error) {
      console.error("Error updating brand:", error)
      alert("An error occurred while updating the brand")
    }
  }

  const handleRemoveBrand = async (brandId: string) => {
    if (!confirm("Are you sure you want to remove this brand from the tournament?")) return

    try {
      const response = await fetch(`/api/tournaments/${params.id}/brands/${brandId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchTournamentBrands(params.id as string)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to remove brand")
      }
    } catch (error) {
      console.error("Error removing brand:", error)
      alert("An error occurred while removing the brand")
    }
  }

  const handleCreateSlot = async () => {
    try {
      const url = editingSlot
        ? `/api/tournaments/${params.id}/slots/${editingSlot.id}`
        : `/api/tournaments/${params.id}/slots`

      const method = editingSlot ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(slotFormData),
      })

      if (response.ok) {
        await fetchTournamentSlots(params.id as string)
        setSlotDialogOpen(false)
        setEditingSlot(null)
        setSelectedBrandId("")
        setBrandTeams([])
        setSlotFormData({
          roundNo: 1,
          matchNo: 1,
          slotNo: 1,
          name: "",
          laneNo: null,
          teamIds: [],
        })
      } else {
        const error = await response.json()
        alert(error.error || `Failed to ${editingSlot ? "update" : "create"} slot`)
      }
    } catch (error) {
      console.error(`Error ${editingSlot ? "updating" : "creating"} slot:`, error)
      alert(`An error occurred while ${editingSlot ? "updating" : "creating"} the slot`)
    }
  }

  const openEditDialog = (tournamentBrand: TournamentBrand) => {
    setEditingBrand(tournamentBrand)
    setBrandFormData({
      brandId: tournamentBrand.brandId,
      numberOfTeams: tournamentBrand.numberOfTeams,
    })
    setBrandDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingBrand(null)
    setBrandFormData({ brandId: "", numberOfTeams: 1 })
    setBrandDialogOpen(true)
  }

  const openSlotDialog = (slot?: TournamentSlot) => {
    if (slot) {
      setEditingSlot(slot)
      setSlotFormData({
        roundNo: slot.roundNo,
        matchNo: slot.matchNo,
        slotNo: slot.slotNo,
        name: slot.name,
        laneNo: slot.laneNo,
        teamIds: slot.slotTeams.map((st) => st.team.id),
      })
      // Find the brand of the first team to pre-select
      if (slot.slotTeams.length > 0) {
        const firstTeamBrand = slot.slotTeams[0].team.brand.name
        const brand = availableBrands.find((b) => b.name === firstTeamBrand)
        if (brand) {
          setSelectedBrandId(brand.id)
          fetchTeamsByBrand(brand.id)
        }
      }
    } else {
      setEditingSlot(null)
      setSelectedBrandId("")
      setBrandTeams([])
      setSlotFormData({
        roundNo: 1,
        matchNo: 1,
        slotNo: 1,
        name: "",
        laneNo: null,
        teamIds: [],
      })
    }
    setSlotDialogOpen(true)
  }

  const handleTeamSelection = (teamId: string, checked: boolean) => {
    setSlotFormData((prev) => ({
      ...prev,
      teamIds: checked ? [...prev.teamIds, teamId] : prev.teamIds.filter((id) => id !== teamId),
    }))
  }

  const handleBrandSelection = (brandId: string) => {
    setSelectedBrandId(brandId)
    setSlotFormData((prev) => ({ ...prev, teamIds: [] })) // Clear selected teams
    if (brandId) {
      fetchTeamsByBrand(brandId)
    } else {
      setBrandTeams([])
    }
  }

  const getStatusColor = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.DRAFT:
        return "bg-gray-100 text-gray-800"
      case TournamentStatus.ACTIVE:
        return "bg-green-100 text-green-800"
      case TournamentStatus.COMPLETED:
        return "bg-blue-100 text-blue-800"
      case TournamentStatus.CANCELLED:
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: TournamentStatus) => {
    switch (status) {
      case TournamentStatus.DRAFT:
        return <Pause className="h-4 w-4" />
      case TournamentStatus.ACTIVE:
        return <Play className="h-4 w-4" />
      case TournamentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4" />
      case TournamentStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />
      default:
        return <Pause className="h-4 w-4" />
    }
  }

  const handleLaneAssignment = (matchId: string, field: "laneNo" | "team1Id" | "team2Id", value: string) => {
    setLaneAssignments((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [field]: field === "laneNo" ? Number.parseInt(value) : value,
      },
    }))
  }

  const saveLaneAssignments = async () => {
    setSavingAssignments(true)
    try {
      const response = await fetch(`/api/tournaments/${params.id}/matches/assign-lanes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assignments: laneAssignments }),
      })

      if (response.ok) {
        await fetchTournament(params.id as string)
        setLaneAssignments({})
        alert("Lane assignments saved successfully!")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to save lane assignments")
      }
    } catch (error) {
      console.error("Error saving lane assignments:", error)
      alert("An error occurred while saving lane assignments")
    } finally {
      setSavingAssignments(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={["tournament.view"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!tournament) {
    return (
      <AuthGuard requiredPermissions={["tournament.view"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tournament not found</h1>
            <Link href="/tournaments">
              <Button>Back to Tournaments</Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredPermissions={["tournament.view"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/tournaments">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tournaments
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
                <Badge className={getStatusColor(tournament.status)}>
                  {getStatusIcon(tournament.status)}
                  <span className="ml-1">{tournament.status}</span>
                </Badge>
              </div>
              {tournament.description && <p className="text-gray-600">{tournament.description}</p>}
            </div>
          </div>
          <Link href={`/tournaments/${tournament.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Tournament
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="brands">Brand Assignment</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="rounds">Rounds & Matches</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tournament.teams.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Target: {tournament.brandsCount * tournament.teamsPerBrand}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rounds</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tournament.rounds.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {tournament.rounds.reduce((acc, round) => acc + round.tournamentMatches.length, 0)} matches
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Duration</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.ceil(
                      (new Date(tournament.endDate).getTime() - new Date(tournament.startDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Lanes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{tournament.lanesTotal}</div>
                  <p className="text-xs text-muted-foreground">bowling lanes</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                      {new Date(tournament.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {tournament.city.name}, {tournament.state.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Visibility:</span> {tournament.visibility}
                    </div>
                    <div>
                      <span className="font-medium">Players per Team:</span> {tournament.playersPerTeam}
                    </div>
                    <div>
                      <span className="font-medium">Male per Team:</span> {tournament.malePerTeam}
                    </div>
                    <div>
                      <span className="font-medium">Female per Team:</span> {tournament.femalePerTeam}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Participating Brands</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tournament.tournamentBrands.map((tb, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{tb.brand.name}</span>
                        <span className="text-sm text-gray-600">{tb.numberOfTeams} teams</span>
                        {tb.brand.contactName && (
                          <p className="text-xs text-gray-500">Contact: {tb.brand.contactName}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="brands" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Brand Assignment</CardTitle>
                  <CardDescription>Assign brands to participate in this tournament</CardDescription>
                </div>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Brand
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {tournamentBrands.map((tb) => (
                    <div key={tb.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                          <Target className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{tb.brand.name}</h3>
                          <p className="text-sm text-gray-600">{tb.numberOfTeams} teams assigned</p>
                          {tb.brand.contactName && (
                            <p className="text-xs text-gray-500">Contact: {tb.brand.contactName}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(tb)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleRemoveBrand(tb.brandId)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {tournamentBrands.length === 0 && (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No brands assigned</h3>
                      <p className="text-gray-600 mb-4">Start by assigning brands to participate in this tournament</p>
                      <Button onClick={openAddDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Brand
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teams ({tournament.teams.length})</CardTitle>
                <CardDescription>All teams participating in this tournament</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {tournament.teams.map((team) => (
                    <div key={team.id} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{team.name}</h3>
                        <p className="text-sm text-gray-600">{team.brand.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{team.teamMembers.length} members</p>
                        <p className="text-xs text-gray-600">
                          {team.teamMembers.map((tm) => `${tm.member.firstName} ${tm.member.lastName}`).join(", ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rounds" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Rounds & Matches</CardTitle>
                  <CardDescription>Tournament structure with slot-wise team and lane assignments</CardDescription>
                </div>
                <Button onClick={openSlotDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Slot
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Tournament Structure Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{tournament?.teams.length || 0}</div>
                      <div className="text-sm text-blue-800">Total Teams</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{tournament?.lanesTotal || 0}</div>
                      <div className="text-sm text-blue-800">Available Lanes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{tournamentSlots.length}</div>
                      <div className="text-sm text-blue-800">Created Slots</div>
                    </div>
                  </div>

                  {/* Slot Management by Round */}
                  {[1, 2, 3].map((roundNo) => {
                    const roundSlots = tournamentSlots.filter((slot) => slot.roundNo === roundNo)
                    const roundName = roundNo === 3 ? "Finals" : `Round ${roundNo}`

                    return (
                      <div key={roundNo} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold">{roundName}</h3>
                          <Badge variant={roundNo === 3 ? "destructive" : "secondary"}>
                            {roundNo === 3 ? "Knockout" : "Round Robin"}
                          </Badge>
                        </div>

                        {/* Matches for this round */}
                        {roundNo < 3 ? (
                          [1, 2].map((matchNo) => {
                            const matchSlots = roundSlots.filter((slot) => slot.matchNo === matchNo)
                            const expectedSlots = roundNo === 1 ? 6 : 4

                            return (
                              <div key={matchNo} className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <h4 className="font-medium mb-3">Match {matchNo}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {Array.from({ length: expectedSlots }, (_, slotIndex) => {
                                    const slotNo = slotIndex + 1
                                    const existingSlot = matchSlots.find((slot) => slot.slotNo === slotNo)

                                    return (
                                      <div key={slotNo} className="border rounded-lg p-3 bg-white">
                                        <div className="flex justify-between items-center mb-2">
                                          <span className="font-medium">Slot {slotNo}</span>
                                          {existingSlot?.laneNo && (
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                              Lane {existingSlot.laneNo}
                                            </Badge>
                                          )}
                                        </div>

                                        {existingSlot ? (
                                          <div className="space-y-2">
                                            <div className="text-sm font-medium">{existingSlot.name}</div>
                                            <div className="text-xs text-gray-600">
                                              {existingSlot.slotTeams.length} teams assigned
                                            </div>
                                            <div className="space-y-1">
                                              {existingSlot.slotTeams.slice(0, 3).map((st) => (
                                                <div key={st.id} className="text-xs text-gray-700">
                                                  {st.team.name} ({st.team.brand.name})
                                                </div>
                                              ))}
                                              {existingSlot.slotTeams.length > 3 && (
                                                <div className="text-xs text-gray-500">
                                                  +{existingSlot.slotTeams.length - 3} more teams
                                                </div>
                                              )}
                                            </div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="w-full bg-transparent"
                                              onClick={() => openSlotDialog(existingSlot)}
                                            >
                                              <Edit className="h-3 w-3 mr-1" />
                                              Edit
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="text-center py-4">
                                            <div className="text-sm text-gray-500 mb-2">Empty Slot</div>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                setSlotFormData((prev) => ({
                                                  ...prev,
                                                  roundNo,
                                                  matchNo,
                                                  slotNo,
                                                  name: `${roundName} M${matchNo} Slot ${slotNo}`,
                                                }))
                                                openSlotDialog()
                                              }}
                                            >
                                              <Plus className="h-3 w-3 mr-1" />
                                              Create
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          // Finals - only 2 slots
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map((slotNo) => {
                              const existingSlot = roundSlots.find((slot) => slot.slotNo === slotNo)

                              return (
                                <div key={slotNo} className="border rounded-lg p-4 bg-gray-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium">Finals Slot {slotNo}</span>
                                    {existingSlot?.laneNo && (
                                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                        Lane {existingSlot.laneNo}
                                      </Badge>
                                    )}
                                  </div>

                                  {existingSlot ? (
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium">{existingSlot.name}</div>
                                      <div className="text-xs text-gray-600">
                                        {existingSlot.slotTeams.length} teams assigned
                                      </div>
                                      <div className="space-y-1">
                                        {existingSlot.slotTeams.map((st) => (
                                          <div key={st.id} className="text-xs text-gray-700">
                                            {st.team.name} ({st.team.brand.name})
                                          </div>
                                        ))}
                                      </div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full bg-transparent"
                                        onClick={() => openSlotDialog(existingSlot)}
                                      >
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="text-center py-4">
                                      <div className="text-sm text-gray-500 mb-2">Empty Slot</div>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setSlotFormData((prev) => ({
                                            ...prev,
                                            roundNo,
                                            matchNo: 1,
                                            slotNo,
                                            name: `Finals Slot ${slotNo}`,
                                          }))
                                          openSlotDialog()
                                        }}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Create
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {/* Lane Distribution Summary for this round */}
                        <div className="mt-4 p-3 bg-blue-50 rounded">
                          <h4 className="font-medium text-blue-900 mb-2">Lane Distribution - {roundName}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            {Array.from({ length: tournament?.lanesTotal || 8 }, (_, i) => {
                              const laneNo = i + 1
                              const slotsOnLane = roundSlots.filter((slot) => slot.laneNo === laneNo).length
                              return (
                                <div key={laneNo} className="flex justify-between p-2 bg-white rounded">
                                  <span>Lane {laneNo}:</span>
                                  <span className="font-medium">{slotsOnLane} slots</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Additional TabsContent sections can be added here */}
        </Tabs>
      </div>

      {/* Brand Assignment Dialog */}
      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Edit Brand" : "Add Brand"}</DialogTitle>
            <DialogDescription>
              {editingBrand ? "Update the brand assignment" : "Assign a brand to participate in this tournament"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="brand" className="text-right">
                Brand
              </Label>
              <Select
                value={brandFormData.brandId}
                onValueChange={(value) => setBrandFormData((prev) => ({ ...prev, brandId: value }))}
                disabled={!!editingBrand}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {availableBrands
                    .filter(
                      (brand) =>
                        !tournamentBrands.some((tb) => tb.brandId === brand.id) || brand.id === brandFormData.brandId,
                    )
                    .map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="numberOfTeams" className="text-right">
                Teams
              </Label>
              <Input
                id="numberOfTeams"
                type="number"
                min="1"
                max="10"
                value={brandFormData.numberOfTeams}
                onChange={(e) =>
                  setBrandFormData((prev) => ({ ...prev, numberOfTeams: Number.parseInt(e.target.value) || 1 }))
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBrandDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingBrand ? handleUpdateBrand : handleAddBrand}>
              {editingBrand ? "Update" : "Add"} Brand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Slot Management Dialog */}
      <Dialog open={slotDialogOpen} onOpenChange={setSlotDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Slot" : "Create Slot"}</DialogTitle>
            <DialogDescription>
              {editingSlot ? "Update slot configuration" : "Configure slot with brand, teams, and lane assignment"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Slot Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="slotName">Slot Name</Label>
                <Input
                  id="slotName"
                  value={slotFormData.name}
                  onChange={(e) => setSlotFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter slot name"
                />
              </div>
              <div>
                <Label htmlFor="laneNo">Lane Assignment</Label>
                <Select
                  value={slotFormData.laneNo?.toString() || ""}
                  onValueChange={(value) =>
                    setSlotFormData((prev) => ({ ...prev, laneNo: value ? Number.parseInt(value) : null }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lane" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: tournament?.lanesTotal || 8 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Lane {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Round and Match Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="roundNo">Round</Label>
                <Select
                  value={slotFormData.roundNo.toString()}
                  onValueChange={(value) => setSlotFormData((prev) => ({ ...prev, roundNo: Number.parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Round 1</SelectItem>
                    <SelectItem value="2">Round 2</SelectItem>
                    <SelectItem value="3">Finals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="matchNo">Match</Label>
                <Select
                  value={slotFormData.matchNo.toString()}
                  onValueChange={(value) => setSlotFormData((prev) => ({ ...prev, matchNo: Number.parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Match 1</SelectItem>
                    <SelectItem value="2">Match 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="slotNo">Slot Number</Label>
                <Input
                  id="slotNo"
                  type="number"
                  min="1"
                  value={slotFormData.slotNo}
                  onChange={(e) =>
                    setSlotFormData((prev) => ({ ...prev, slotNo: Number.parseInt(e.target.value) || 1 }))
                  }
                />
              </div>
            </div>

            {/* Brand Selection */}
            <div>
              <Label htmlFor="brandSelect">Select Brand</Label>
              <Select value={selectedBrandId} onValueChange={handleBrandSelection}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a brand to see its teams" />
                </SelectTrigger>
                <SelectContent>
                  {tournamentBrands.map((tb) => (
                    <SelectItem key={tb.brandId} value={tb.brandId}>
                      {tb.brand.name} ({tb.numberOfTeams} teams)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Selection */}
            {selectedBrandId && brandTeams.length > 0 && (
              <div>
                <Label>Select Teams (up to 8 teams per slot)</Label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded p-3 mt-2">
                  {brandTeams.map((team) => (
                    <div key={team.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={team.id}
                        checked={slotFormData.teamIds.includes(team.id)}
                        onCheckedChange={(checked) => handleTeamSelection(team.id, checked as boolean)}
                        disabled={!slotFormData.teamIds.includes(team.id) && slotFormData.teamIds.length >= 8}
                      />
                      <Label htmlFor={team.id} className="text-sm font-normal cursor-pointer">
                        {team.name}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{slotFormData.teamIds.length} of 8 teams selected</p>
              </div>
            )}

            {selectedBrandId && brandTeams.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>No teams found for this brand.</p>
                <p className="text-xs">Make sure teams are created for the selected brand.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSlot}
              disabled={!slotFormData.name || !selectedBrandId || slotFormData.teamIds.length === 0}
            >
              {editingSlot ? "Update" : "Create"} Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}
