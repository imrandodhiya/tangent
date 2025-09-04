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
import { AuthGuard } from "@/components/auth/auth-guard"
import { ArrowLeft, Save, Calendar } from "lucide-react"

interface State {
  id: string
  name: string
}

interface City {
  id: string
  name: string
}

interface Tournament {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  registrationDeadline: string
  maxTeams: number
  entryFee: number
  prizePool: number
  status: string
  stateId: string
  cityId: string
  venue: string | null
  rules: string | null
}

export default function EditTournamentPage() {
  const params = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    registrationDeadline: "",
    maxTeams: 32,
    entryFee: 0,
    prizePool: 0,
    status: "DRAFT",
    stateId: "",
    cityId: "",
    venue: "",
    rules: "",
  })

  useEffect(() => {
    if (params.id) {
      fetchTournament(params.id as string)
      fetchStates()
    }
  }, [params.id])

  useEffect(() => {
    if (formData.stateId) {
      fetchCities(formData.stateId)
    }
  }, [formData.stateId])

  const fetchTournament = async (id: string) => {
    try {
      const response = await fetch(`/api/tournaments/${id}`)
      if (response.ok) {
        const data = await response.json()
        setTournament(data)
        setFormData({
          name: data.name || "",
          description: data.description || "",
          startDate: data.startDate ? new Date(data.startDate).toISOString().split("T")[0] : "",
          endDate: data.endDate ? new Date(data.endDate).toISOString().split("T")[0] : "",
          registrationDeadline: data.registrationDeadline
            ? new Date(data.registrationDeadline).toISOString().split("T")[0]
            : "",
          maxTeams: data.maxTeams || 32,
          entryFee: data.entryFee || 0,
          prizePool: data.prizePool || 0,
          status: data.status || "DRAFT",
          stateId: data.stateId || "",
          cityId: data.cityId || "",
          venue: data.venue || "",
          rules: data.rules || "",
        })
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

  const fetchStates = async () => {
    try {
      const response = await fetch("/api/states")
      const data = await response.json()
      setStates(data.states || [])
    } catch (error) {
      console.error("Error fetching states:", error)
    }
  }

  const fetchCities = async (stateId: string) => {
    try {
      const response = await fetch(`/api/cities?stateId=${stateId}`)
      const data = await response.json()
      setCities(data.cities || [])
    } catch (error) {
      console.error("Error fetching cities:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/tournaments/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          description: formData.description || null,
          venue: formData.venue || null,
          rules: formData.rules || null,
        }),
      })

      if (response.ok) {
        router.push(`/tournaments/${params.id}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update tournament")
      }
    } catch (error) {
      console.error("Error updating tournament:", error)
      alert("An error occurred while updating the tournament")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={["tournament.edit"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!tournament) {
    return (
      <AuthGuard requiredPermissions={["tournament.edit"]}>
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
    <AuthGuard requiredPermissions={["tournament.edit"]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/tournaments/${tournament.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tournament
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Tournament</h1>
            <p className="text-gray-600 mt-2">Update tournament information and settings</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Update the basic tournament details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tournament Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter tournament name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the tournament"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationDeadline">Registration Deadline *</Label>
                  <Input
                    id="registrationDeadline"
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData((prev) => ({ ...prev, registrationDeadline: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tournament Settings</CardTitle>
              <CardDescription>Configure tournament parameters and fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxTeams">Maximum Teams</Label>
                  <Input
                    id="maxTeams"
                    type="number"
                    min="1"
                    value={formData.maxTeams}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, maxTeams: Number.parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryFee">Entry Fee ($)</Label>
                  <Input
                    id="entryFee"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.entryFee}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, entryFee: Number.parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prizePool">Prize Pool ($)</Label>
                  <Input
                    id="prizePool"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prizePool}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, prizePool: Number.parseFloat(e.target.value) || 0 }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="REGISTRATION_OPEN">Registration Open</SelectItem>
                    <SelectItem value="REGISTRATION_CLOSED">Registration Closed</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Tournament location information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={formData.stateId}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, stateId: value, cityId: "" }))
                      setCities([])
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Select
                    value={formData.cityId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, cityId: value }))}
                    disabled={!formData.stateId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => setFormData((prev) => ({ ...prev, venue: e.target.value }))}
                  placeholder="Tournament venue name"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rules & Regulations</CardTitle>
              <CardDescription>Tournament rules and additional information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="rules">Tournament Rules</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rules: e.target.value }))}
                  placeholder="Enter tournament rules and regulations"
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href={`/tournaments/${tournament.id}`}>
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
