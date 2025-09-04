"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ArrowLeft, Save, Users } from "lucide-react"

interface Brand {
  id: string
  name: string
}

interface Tournament {
  id: string
  name: string
}

interface Member {
  id: string
  firstName: string
  lastName: string
  gender: string
  brandId: string
}

interface Team {
  id: string
  name: string
  description: string | null
  brandId: string
  tournamentId: string
  captainId: string | null
  teamMembers: Array<{
    memberId: string
    member: {
      id: string
      firstName: string
      lastName: string
      gender: string
    }
  }>
}

export default function EditTeamPage() {
  const params = useParams()
  const router = useRouter()
  const [team, setTeam] = useState<Team | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [availableMembers, setAvailableMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    brandId: "",
    tournamentId: "",
    captainId: "",
  })
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  useEffect(() => {
    if (params.id) {
      fetchTeam(params.id as string)
      fetchBrands()
      fetchTournaments()
    }
  }, [params.id])

  useEffect(() => {
    if (formData.brandId) {
      fetchAvailableMembers(formData.brandId)
    }
  }, [formData.brandId])

  const fetchTeam = async (id: string) => {
    try {
      const response = await fetch(`/api/teams/${id}`)
      if (response.ok) {
        const data = await response.json()
        setTeam(data)
        setFormData({
          name: data.name || "",
          description: data.description || "",
          brandId: data.brandId || "",
          tournamentId: data.tournamentId || "",
          captainId: data.captainId || "",
        })
        setSelectedMembers(data.teamMembers?.map((tm: any) => tm.memberId) || [])
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

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands")
      const data = await response.json()
      setBrands(data.brands || [])
    } catch (error) {
      console.error("Error fetching brands:", error)
    }
  }

  const fetchTournaments = async () => {
    try {
      const response = await fetch("/api/tournaments")
      const data = await response.json()
      setTournaments(data.tournaments || [])
    } catch (error) {
      console.error("Error fetching tournaments:", error)
    }
  }

  const fetchAvailableMembers = async (brandId: string) => {
    try {
      const response = await fetch(`/api/members?brandId=${brandId}`)
      const data = await response.json()
      setAvailableMembers(data.members || [])
    } catch (error) {
      console.error("Error fetching members:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/teams/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          description: formData.description || null,
          captainId: formData.captainId || null,
          memberIds: selectedMembers,
        }),
      })

      if (response.ok) {
        router.push(`/teams/${params.id}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update team")
      }
    } catch (error) {
      console.error("Error updating team:", error)
      alert("An error occurred while updating the team")
    } finally {
      setSaving(false)
    }
  }

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]))
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={["team.edit"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!team) {
    return (
      <AuthGuard requiredPermissions={["team.edit"]}>
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

  const eligibleCaptains = availableMembers.filter((member) => selectedMembers.includes(member.id))

  return (
    <AuthGuard requiredPermissions={["team.edit"]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/teams/${team.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Team
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Team</h1>
            <p className="text-gray-600 mt-2">Update team information and member assignments</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Update the basic team details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter team name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the team"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Select
                    value={formData.brandId}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, brandId: value, captainId: "" }))
                      setSelectedMembers([])
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tournament">Tournament *</Label>
                  <Select
                    value={formData.tournamentId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, tournamentId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tournament" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map((tournament) => (
                        <SelectItem key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Select team members from the chosen brand</CardDescription>
            </CardHeader>
            <CardContent>
              {formData.brandId ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                    {availableMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={member.id}
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={() => toggleMemberSelection(member.id)}
                        />
                        <label
                          htmlFor={member.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {member.firstName} {member.lastName} ({member.gender})
                        </label>
                      </div>
                    ))}
                  </div>
                  {availableMembers.length === 0 && (
                    <p className="text-sm text-gray-500">No members available for the selected brand</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Please select a brand first to see available members</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Captain</CardTitle>
              <CardDescription>Select a team captain from the selected members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="captain">Captain</Label>
                <Select
                  value={formData.captainId || undefined}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, captainId: value === "none" ? "" : value }))
                  }
                  disabled={eligibleCaptains.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team captain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Captain</SelectItem>
                    {eligibleCaptains.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.firstName} {member.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {eligibleCaptains.length === 0 && selectedMembers.length > 0 && (
                  <p className="text-sm text-gray-500">Select team members first to choose a captain</p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href={`/teams/${team.id}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </AuthGuard>
  )
}
