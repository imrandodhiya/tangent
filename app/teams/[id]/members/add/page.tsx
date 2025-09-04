"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ArrowLeft, Save, Search } from "lucide-react"
import { PERMISSIONS } from "@/lib/permissions"

interface Member {
  id: string
  firstName: string
  lastName: string
  gender: string
  mobile: string
  email?: string
  photoUrl?: string
  experienceYears?: number
  brand?: {
    name: string
  }
}

interface Team {
  id: string
  name: string
  tournament: {
    playersPerTeam: number | null
    malePerTeam: number | null
    femalePerTeam: number | null
  }
  brand: {
    id: string
    name: string
  }
  teamMembers: Array<{
    member: {
      gender: string
    }
  }>
}

export default function AddTeamMemberPage() {
  const params = useParams()
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [formData, setFormData] = useState({
    roleInTeam: "PLAYER",
    jerseyNo: "",
    positionNo: "",
    isReplacement: false,
    replacementOfMemberId: "",
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (params.id) {
      fetchTeam(params.id as string)
      fetchMembers()
    }
  }, [params.id])

  useEffect(() => {
    const filtered = members.filter(
      (member) =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.mobile.includes(searchTerm),
    )
    setFilteredMembers(filtered)
  }, [members, searchTerm])

  const fetchTeam = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Team data:", data)
        console.log("Tournament data:", data.tournament)
        console.log("Team members:", data.teamMembers)
        console.log("Tournament quota fields:", {
          playersPerTeam: data.tournament?.playersPerTeam,
          malePerTeam: data.tournament?.malePerTeam,
          femalePerTeam: data.tournament?.femalePerTeam,
          hasQuotaFields: !!(
            data.tournament?.playersPerTeam &&
            data.tournament?.malePerTeam !== null &&
            data.tournament?.femalePerTeam !== null
          ),
        })
        setTeam(data)
      }
    } catch (error) {
      console.error("Error fetching team:", error)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/members")
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedMember) newErrors.member = "Please select a member"
    if (formData.jerseyNo && (Number.parseInt(formData.jerseyNo) < 1 || Number.parseInt(formData.jerseyNo) > 99)) {
      newErrors.jerseyNo = "Jersey number must be between 1 and 99"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !selectedMember) return

    setLoading(true)
    try {
      const response = await fetch(`/api/teams/${params.id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberId: selectedMember.id,
          ...formData,
          jerseyNo: formData.jerseyNo ? Number.parseInt(formData.jerseyNo) : null,
          positionNo: formData.positionNo ? Number.parseInt(formData.positionNo) : null,
        }),
      })

      if (response.ok) {
        router.push(`/teams/${params.id}?tab=members`)
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || "Failed to add team member" })
      }
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  const getGenderDistribution = () => {
    if (!team) return { male: 0, female: 0 }
    console.log("Calculating gender distribution for team:", team)
    console.log("Team members:", team.teamMembers)

    const male = team.teamMembers.filter((tm) => {
      console.log("Team member:", tm, "Gender:", tm.member?.gender)
      return tm.member?.gender === "MALE"
    }).length
    const female = team.teamMembers.filter((tm) => tm.member?.gender === "FEMALE").length

    console.log("Gender distribution - Male:", male, "Female:", female)
    console.log("Tournament limits - Male:", team.tournament?.malePerTeam, "Female:", team.tournament?.femalePerTeam)

    return { male, female }
  }

  const canAddGender = (gender: string) => {
    if (!team) return false
    if (!team.tournament) {
      console.error("Tournament data missing from team")
      return false
    }
    console.log("Tournament data Imran:", team.tournament)
    const malePerTeam = team.tournament.malePerTeam ?? 0
    const femalePerTeam = team.tournament.femalePerTeam ?? 0

    // If quota fields are null or 0, allow adding (no restrictions)
    if (malePerTeam === 0 && femalePerTeam === 0) {
      console.log("No gender quotas set, allowing all members")
      return true
    }

    const { male, female } = getGenderDistribution()
    console.log(
      `Checking if can add ${gender}. Current: Male ${male}/${malePerTeam}, Female ${female}/${femalePerTeam}`,
    )

    if (gender === "MALE") {
      const canAdd = malePerTeam === 0 || male < malePerTeam
      console.log(`Can add male: ${canAdd}`)
      return canAdd
    } else if (gender === "FEMALE") {
      const canAdd = femalePerTeam === 0 || female < femalePerTeam
      console.log(`Can add female: ${canAdd}`)
      return canAdd
    }
    return true
  }

  if (!team) {
    return (
      <AuthGuard requiredPermissions={[PERMISSIONS.TEAMS_EDIT]}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const { male, female } = getGenderDistribution()
  const playersPerTeam = team.tournament?.playersPerTeam ?? 0
  const malePerTeam = team.tournament?.malePerTeam ?? 0
  const femalePerTeam = team.tournament?.femalePerTeam ?? 0

  return (
    <AuthGuard requiredPermissions={[PERMISSIONS.TEAMS_EDIT]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/teams/${params.id}?tab=members`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Add Team Member</h1>
            <p className="text-gray-600 mt-2">Add a player to {team.name}</p>
          </div>
        </div>

        {(playersPerTeam === 0 || (malePerTeam === 0 && femalePerTeam === 0)) && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Tournament Configuration Missing</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    The tournament's team composition settings are not configured. Please update the tournament settings
                    to set the number of players per team and gender quotas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Member Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Member</CardTitle>
              <CardDescription>
                Choose a member to add to the team ({team.teamMembers.length}/{playersPerTeam || "∞"} players)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Members</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or mobile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredMembers.map((member) => {
                  const canAdd = canAddGender(member.gender)
                  return (
                    <div
                      key={member.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedMember?.id === member.id
                          ? "border-blue-500 bg-blue-50"
                          : canAdd
                            ? "hover:bg-gray-50"
                            : "opacity-50 cursor-not-allowed"
                      }`}
                      onClick={() => canAdd && setSelectedMember(member)}
                    >
                      <Avatar>
                        <AvatarImage src={member.photoUrl || "/placeholder.svg"} />
                        <AvatarFallback>
                          {member.firstName[0]}
                          {member.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold">
                          {member.firstName} {member.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Badge variant="outline">{member.gender}</Badge>
                          <span>•</span>
                          <span>{member.mobile}</span>
                          {member.experienceYears && (
                            <>
                              <span>•</span>
                              <span>{member.experienceYears} years</span>
                            </>
                          )}
                        </div>
                        {member.brand && <p className="text-xs text-gray-500">{member.brand.name}</p>}
                      </div>
                      {!canAdd && (malePerTeam > 0 || femalePerTeam > 0) && (
                        <Badge variant="destructive">
                          {member.gender === "MALE" ? "Male quota full" : "Female quota full"}
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>

              {errors.member && <p className="text-sm text-red-600">{errors.member}</p>}
            </CardContent>
          </Card>

          {/* Member Details Form */}
          <Card>
            <CardHeader>
              <CardTitle>Member Details</CardTitle>
              <CardDescription>Configure role and team-specific information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Team Composition</Label>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-medium">Male Players</div>
                      <div className="text-lg">
                        {male}/{malePerTeam || "∞"}
                      </div>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-lg">
                      <div className="font-medium">Female Players</div>
                      <div className="text-lg">
                        {female}/{femalePerTeam || "∞"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role in Team</Label>
                  <Select value={formData.roleInTeam} onValueChange={(value) => handleInputChange("roleInTeam", value)}>
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
                      value={formData.jerseyNo}
                      onChange={(e) => handleInputChange("jerseyNo", e.target.value)}
                      placeholder="Optional"
                    />
                    {errors.jerseyNo && <p className="text-sm text-red-600">{errors.jerseyNo}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="positionNo">Position Number</Label>
                    <Input
                      id="positionNo"
                      type="number"
                      min="1"
                      value={formData.positionNo}
                      onChange={(e) => handleInputChange("positionNo", e.target.value)}
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
                    checked={formData.isReplacement}
                    onCheckedChange={(checked) => handleInputChange("isReplacement", checked)}
                  />
                </div>

                {errors.submit && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{errors.submit}</div>}

                <div className="flex justify-end gap-4 pt-4">
                  <Link href={`/teams/${params.id}?tab=members`}>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading || !selectedMember}>
                    {loading ? (
                      <>Adding...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Add Member
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  )
}
