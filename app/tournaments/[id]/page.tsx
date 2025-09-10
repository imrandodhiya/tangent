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
  BarChart3,
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
  noOfRounds: number
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
    lane?: { laneNo: number }
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
  const [pendingAssignments, setPendingAssignments] = useState<
    Array<{ brandId: string; brandName: string; teamIds: string[]; teamNames: string[]; teamAssignments?: any[] }>
  >([])

  const [teamLaneAssignments, setTeamLaneAssignments] = useState<{
    [teamId: string]: number | null
  }>({})

  const isCreateMode = !editingSlot

  const resetSlotDialogState = () => {
    setSelectedBrandId("")
    setBrandTeams([])
    setPendingAssignments([])
    setTeamLaneAssignments({}) // Reset team lane assignments
    setSlotFormData({
      roundNo: 1,
      matchNo: 1,
      slotNo: 1,
      name: "",
      laneNo: null,
      teamIds: [],
    })
  }

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

  const openCreateSlotDialog = (roundNo: number, matchNo: number, slotNo: number, name?: string) => {
    setEditingSlot(null)
    // reset only brand selection state; but set the targeted slot coordinates explicitly
    setSelectedBrandId("")
    setBrandTeams([])
    setPendingAssignments([])
    setSlotFormData((prev) => ({
      ...prev,
      roundNo,
      matchNo,
      slotNo,
      name: name ?? prev.name ?? "",
      laneNo: null,
      teamIds: [],
    }))
    setSlotDialogOpen(true)
  }

  const openSlotDialog = (slot?: TournamentSlot) => {
    if (slot) {
      setEditingSlot(slot)
      setPendingAssignments([]) // disable multi-brand staging in edit mode
      setSlotFormData({
        roundNo: slot.roundNo,
        matchNo: slot.matchNo,
        slotNo: slot.slotNo,
        name: slot.name,
        laneNo: slot.laneNo,
        teamIds: slot.slotTeams.map((st) => st.team.id),
      })

      const initialTeamLanes: { [teamId: string]: number | null } = {}
      slot.slotTeams.forEach((st) => {
        initialTeamLanes[st.team.id] = st.lane?.laneNo || null
      })
      setTeamLaneAssignments(initialTeamLanes)

      if (slot.slotTeams.length > 0) {
        const firstTeamBrand = slot.slotTeams[0].team.brand.name
        const brand = availableBrands.find((b) => b.name === firstTeamBrand)
        if (brand) {
          setSelectedBrandId(brand.id)
          fetchTeamsByBrand(brand.id)
        } else {
          setSelectedBrandId("")
          setBrandTeams([])
        }
      } else {
        setSelectedBrandId("")
        setBrandTeams([])
      }
      setSlotDialogOpen(true)
    } else {
      // default create when opened without context
      openCreateSlotDialog(1, 1, 1, "Round 1 M1 Slot 1")
    }
  }

  const handleTeamSelection = (teamId: string, checked: boolean) => {
    setSlotFormData((prev) => ({
      ...prev,
      teamIds: checked ? [...prev.teamIds, teamId] : prev.teamIds.filter((id) => id !== teamId),
    }))
  }

  const handleBrandSelection = (brandId: string) => {
    setSelectedBrandId(brandId)
    setSlotFormData((prev) => ({
      ...prev,
      teamIds: isCreateMode ? [] : prev.teamIds, // preserve in edit
    }))
    if (brandId) {
      fetchTeamsByBrand(brandId)
    } else {
      setBrandTeams([])
    }
  }

  const handleTeamLaneAssignment = (teamId: string, laneNo: number | null) => {
    setTeamLaneAssignments((prev) => ({
      ...prev,
      [teamId]: laneNo,
    }))
  }

  const addBrandTeamsWithLanes = () => {
    if (!selectedBrandId || slotFormData.teamIds.length === 0) return
    const brandMeta = tournamentBrands.find((tb) => tb.brandId === selectedBrandId)
    const chosenTeams = brandTeams.filter((t) => slotFormData.teamIds.includes(t.id))

    // Create team assignments with individual lane assignments
    const teamAssignments = chosenTeams.map((team) => ({
      teamId: team.id,
      teamName: team.name,
      laneNo: teamLaneAssignments[team.id] || null,
    }))

    setPendingAssignments((prev) => [
      ...prev,
      {
        brandId: selectedBrandId,
        brandName: brandMeta?.brand.name ?? "Brand",
        teamIds: [...slotFormData.teamIds],
        teamNames: chosenTeams.map((t) => t.name),
        teamAssignments, // Added team assignments with lane info
      },
    ])
    // reset current brand selection for next addition
    setSelectedBrandId("")
    setBrandTeams([])
    setSlotFormData((prev) => ({ ...prev, teamIds: [] }))
    const clearedAssignments = { ...teamLaneAssignments }
    slotFormData.teamIds.forEach((teamId) => {
      delete clearedAssignments[teamId]
    })
    setTeamLaneAssignments(clearedAssignments)
  }

  const removePendingAssignment = (idx: number) => {
    setPendingAssignments((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleCreateSlot = async () => {
    try {
      const url = editingSlot
        ? `/api/tournaments/${params.id}/slots/${editingSlot.id}`
        : `/api/tournaments/${params.id}/slots`

      const method = editingSlot ? "PUT" : "POST"

      if (editingSlot) {
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roundNo: slotFormData.roundNo,
            matchNo: slotFormData.matchNo,
            slotNo: slotFormData.slotNo,
            name: slotFormData.name || undefined,
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          alert(error.error || "Failed to update slot")
          return
        }

        // Update individual team lane assignments
        const updatePromises = slotFormData.teamIds.map(async (teamId) => {
          const laneNo = teamLaneAssignments[teamId]
          let laneId: string | null = null

          if (laneNo) {
            const lane = await fetch(`/api/lanes?laneNo=${laneNo}`).then((r) => r.json())
            if (lane && lane.length > 0) {
              laneId = lane[0].id
            }
          }

          return fetch(`/api/tournaments/${params.id}/slots/${editingSlot.id}/teams`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teamId,
              laneId,
              positionNo: slotFormData.teamIds.indexOf(teamId) + 1,
            }),
          })
        })

        await Promise.all(updatePromises)
      } else {
        const allTeamAssignments = pendingAssignments.flatMap(
          (assignment) =>
            assignment.teamAssignments ||
            assignment.teamIds.map((teamId) => ({
              teamId,
              teamName: assignment.teamNames[assignment.teamIds.indexOf(teamId)],
              laneNo: null,
            })),
        )

        if (allTeamAssignments.length === 0) {
          alert("Select at least one team to assign to this slot")
          return
        }

        // Create the slot first
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roundNo: slotFormData.roundNo,
            matchNo: slotFormData.matchNo,
            slotNo: slotFormData.slotNo,
            name: slotFormData.name || undefined,
            laneNo: null, // No slot-level lane assignment
            teamIds: [], // Will add teams individually
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          alert(error.error || "Failed to create slot")
          return
        }

        const createdSlot = await response.json()

        // Add teams individually with their lane assignments
        const teamPromises = allTeamAssignments.map(async (teamAssignment, index) => {
          let laneId: string | null = null

          if (teamAssignment.laneNo) {
            const laneResponse = await fetch(`/api/lanes?laneNo=${teamAssignment.laneNo}`)
            if (laneResponse.ok) {
              const lanes = await laneResponse.json()
              if (lanes && lanes.length > 0) {
                laneId = lanes[0].id
              }
            }
          }

          return fetch(`/api/tournaments/${params.id}/slots/${createdSlot.id}/teams`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              teamId: teamAssignment.teamId,
              laneId,
              positionNo: index + 1,
              seed: index + 1,
            }),
          })
        })

        await Promise.all(teamPromises)
      }

      await fetchTournamentSlots(params.id as string)
      setSlotDialogOpen(false)
      setEditingSlot(null)
      resetSlotDialogState()
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
                  <CardTitle className="text-balance">Tournament Structure</CardTitle>
                  <CardDescription>Manage rounds, matches, slots, and team assignments</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  <Button onClick={() => openCreateSlotDialog(1, 1, 1, "Round 1 M1 Slot 1")}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Slot
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{tournament?.teams.length || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Teams</div>
                    </div>
                    <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-secondary">{tournament?.lanesTotal || 0}</div>
                      <div className="text-sm text-muted-foreground">Available Lanes</div>
                    </div>
                    <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-accent">{tournamentSlots.length}</div>
                      <div className="text-sm text-muted-foreground">Created Slots</div>
                    </div>
                    <div className="bg-muted border rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold">{tournament?.noOfRounds || 3}</div>
                      <div className="text-sm text-muted-foreground">Total Rounds</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {Array.from({ length: tournament?.noOfRounds || 3 }, (_, roundIndex) => {
                      const roundNo = roundIndex + 1
                      const roundSlots = tournamentSlots.filter((slot) => slot.roundNo === roundNo)
                      const roundName = roundNo === (tournament?.noOfRounds || 3) ? "Finals" : `Round ${roundNo}`

                      // Dynamic match count based on round
                      const matchCount = roundNo === 1 ? 2 : 1
                      const slotsPerMatch = roundNo === 1 ? 6 : roundNo === 2 ? 4 : 2

                      return (
                        <div key={roundNo} className="border-2 border-primary/20 rounded-xl p-6 bg-card">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                                {roundNo}
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-balance">{roundName}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {matchCount} {matchCount === 1 ? "Match" : "Matches"} • {slotsPerMatch} Slots per
                                  Match
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={roundNo === (tournament?.noOfRounds || 3) ? "destructive" : "secondary"}
                              className="px-3 py-1"
                            >
                              {roundNo === (tournament?.noOfRounds || 3) ? "Knockout" : "Round Robin"}
                            </Badge>
                          </div>

                          <div className="space-y-6">
                            {Array.from({ length: matchCount }, (_, matchIndex) => {
                              const matchNo = matchIndex + 1
                              const matchSlots = roundSlots.filter((slot) => slot.matchNo === matchNo)

                              return (
                                <div key={matchNo} className="bg-muted/50 rounded-lg p-4 border border-border/50">
                                  <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-semibold text-lg flex items-center gap-2">
                                      <div className="w-8 h-8 rounded bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">
                                        M{matchNo}
                                      </div>
                                      Match {matchNo}
                                    </h4>
                                    <div className="text-sm text-muted-foreground">
                                      {matchSlots.length}/{slotsPerMatch} slots created
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Array.from({ length: slotsPerMatch }, (_, slotIndex) => {
                                      const slotNo = slotIndex + 1
                                      const existingSlot = matchSlots.find((slot) => slot.slotNo === slotNo)

                                      return (
                                        <div
                                          key={slotNo}
                                          className="bg-background border-2 border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                                        >
                                          <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                              <div className="w-6 h-6 rounded bg-accent text-accent-foreground flex items-center justify-center text-xs font-bold">
                                                {slotNo}
                                              </div>
                                              <span className="font-medium">Slot {slotNo}</span>
                                            </div>
                                          </div>

                                          {existingSlot ? (
                                            <div className="space-y-3">
                                              <div className="text-sm font-medium text-balance">
                                                {existingSlot.name}
                                              </div>
                                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Users className="h-3 w-3" />
                                                {existingSlot.slotTeams.length} teams assigned
                                              </div>

                                              <div className="space-y-1 max-h-20 overflow-y-auto">
                                                {existingSlot.slotTeams.slice(0, 4).map((st) => (
                                                  <div
                                                    key={st.id}
                                                    className="flex items-center justify-between text-xs p-1 rounded bg-muted/50"
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <div className="w-2 h-2 rounded-full bg-secondary"></div>
                                                      <span className="font-medium">{st.team.name}</span>
                                                      <span className="text-muted-foreground">
                                                        ({st.team.brand.name})
                                                      </span>
                                                    </div>
                                                    {st.lane && (
                                                      <Badge
                                                        variant="outline"
                                                        className="bg-primary/10 text-primary border-primary/30 text-xs px-1 py-0"
                                                      >
                                                        L{st.lane.laneNo}
                                                      </Badge>
                                                    )}
                                                  </div>
                                                ))}
                                                {existingSlot.slotTeams.length > 4 && (
                                                  <div className="text-xs text-muted-foreground text-center py-1">
                                                    +{existingSlot.slotTeams.length - 4} more teams
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
                                                Edit Slot
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="text-center py-6">
                                              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                                                <Plus className="h-5 w-5 text-muted-foreground" />
                                              </div>
                                              <div className="text-sm text-muted-foreground mb-3">Empty Slot</div>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full bg-transparent"
                                                onClick={() => {
                                                  openCreateSlotDialog(
                                                    roundNo,
                                                    matchNo,
                                                    slotNo,
                                                    `${roundName} M${matchNo} Slot ${slotNo}`,
                                                  )
                                                }}
                                              >
                                                <Plus className="h-3 w-3 mr-1" />
                                                Create Slot
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>

                          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                            <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Lane Distribution - {roundName}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                              {Array.from({ length: tournament?.lanesTotal || 8 }, (_, i) => {
                                const laneNo = i + 1
                                const slotsOnLane = roundSlots.filter((slot) => slot.laneNo === laneNo).length
                                const isActive = slotsOnLane > 0

                                return (
                                  <div
                                    key={laneNo}
                                    className={`p-2 rounded text-center text-sm border ${
                                      isActive
                                        ? "bg-secondary/10 border-secondary/30 text-secondary"
                                        : "bg-muted border-border text-muted-foreground"
                                    }`}
                                  >
                                    <div className="font-bold">L{laneNo}</div>
                                    <div className="text-xs">{slotsOnLane} slots</div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
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
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSlot ? "Edit Slot" : "Create Slot"}</DialogTitle>
            <DialogDescription>
              {editingSlot
                ? "Update teams and individual lane assignments for this slot"
                : "Add multiple brands and their teams with individual lane assignments to this slot"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Auto-detected info */}
            <div className="rounded border p-3 text-sm">
              <div className="font-medium mb-1">Slot Info</div>
              <div className="text-muted-foreground">
                Round {slotFormData.roundNo} · Match {slotFormData.matchNo} · Slot {slotFormData.slotNo}
              </div>
              {editingSlot && slotFormData.name ? (
                <div className="mt-1 text-xs text-muted-foreground">Name: {slotFormData.name}</div>
              ) : null}
            </div>

            {/* Brand/Teams selection */}
            <div className="space-y-3">
              <Label>{editingSlot ? "Select Brand (edit one at a time)" : "Select Brand"}</Label>
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

              {/* Teams list for selected brand with individual lane assignments */}
              {selectedBrandId && (
                <>
                  {brandTeams.length > 0 ? (
                    <div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {editingSlot
                          ? "Edit teams and their individual lane assignments"
                          : "Pick teams and assign individual lanes, then click 'Add brand & teams'"}
                      </div>
                      <div className="space-y-3 max-h-64 overflow-y-auto border rounded p-3">
                        {brandTeams.map((team) => (
                          <div
                            key={team.id}
                            className="flex items-center justify-between space-x-3 p-2 bg-gray-50 rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={team.id}
                                checked={slotFormData.teamIds.includes(team.id)}
                                onCheckedChange={(checked) => handleTeamSelection(team.id, checked as boolean)}
                              />
                              <Label htmlFor={team.id} className="text-sm font-normal cursor-pointer">
                                {team.name}
                              </Label>
                            </div>

                            {slotFormData.teamIds.includes(team.id) && (
                              <div className="flex items-center space-x-2">
                                <Label className="text-xs text-muted-foreground">Lane:</Label>
                                <Select
                                  value={teamLaneAssignments[team.id]?.toString() || ""}
                                  onValueChange={(value) =>
                                    handleTeamLaneAssignment(team.id, value ? Number.parseInt(value) : null)
                                  }
                                >
                                  <SelectTrigger className="w-20 h-8">
                                    <SelectValue placeholder="--" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {Array.from({ length: tournament?.lanesTotal || 8 }, (_, i) => (
                                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                                        {i + 1}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {!editingSlot && (
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">{slotFormData.teamIds.length} team(s) selected</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={addBrandTeamsWithLanes}
                            disabled={slotFormData.teamIds.length === 0}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add brand & teams
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>No teams found for this brand.</p>
                      <p className="text-xs">Make sure teams are created for the selected brand.</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {!editingSlot && pendingAssignments.length > 0 && (
              <div className="rounded border p-3">
                <div className="font-medium mb-2">Staged brand/team assignments</div>
                <div className="space-y-3">
                  {pendingAssignments.map((p, idx) => (
                    <div key={`${p.brandId}-${idx}`} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{p.brandName}</div>
                        <Button variant="ghost" size="sm" onClick={() => removePendingAssignment(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1 pl-4">
                        {p.teamAssignments ? (
                          p.teamAssignments.map((ta: any, teamIdx: number) => (
                            <div key={teamIdx} className="flex justify-between text-xs text-muted-foreground">
                              <span>{ta.teamName}</span>
                              <span>{ta.laneNo ? `Lane ${ta.laneNo}` : "No lane"}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-muted-foreground">
                            {p.teamNames.slice(0, 5).join(", ")}
                            {p.teamNames.length > 5 ? ` +${p.teamNames.length - 5} more` : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSlotDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSlot}
              disabled={isCreateMode ? pendingAssignments.length === 0 : slotFormData.teamIds.length === 0}
            >
              {editingSlot ? "Update Slot" : "Create Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthGuard>
  )
}
