"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ArrowLeft, Save } from "lucide-react"
import { PERMISSIONS } from "@/lib/permissions"

interface Tournament {
  id: string
  name: string
  status: string
}

interface Brand {
  id: string
  name: string
  primaryColor?: string
}

interface TournamentBrand {
  brandId: string
  numberOfTeams: number
  brand: Brand
}

export default function CreateTeamPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tournamentId = searchParams.get("tournamentId")
  const brandId = searchParams.get("brandId")

  const [formData, setFormData] = useState({
    tournamentId: tournamentId || "",
    brandId: brandId || "",
    name: "",
    baseName: "",
    suffix: "",
    logoUrl: "",
    color: "",
    seedNo: "",
  })

  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [tournamentBrands, setTournamentBrands] = useState<TournamentBrand[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchTournaments()
  }, [])

  useEffect(() => {
    if (formData.tournamentId) {
      fetchTournamentBrands(formData.tournamentId)
    }
  }, [formData.tournamentId])

  useEffect(() => {
    if (formData.brandId) {
      const selectedBrand = tournamentBrands.find((tb) => tb.brandId === formData.brandId)
      if (selectedBrand?.brand.primaryColor) {
        setFormData((prev) => ({ ...prev, color: selectedBrand.brand.primaryColor || "" }))
      }
    }
  }, [formData.brandId, tournamentBrands])

  const fetchTournaments = async () => {
    try {
      const response = await fetch("/api/tournaments")
      const data = await response.json()
      setTournaments(data.tournaments || [])
    } catch (error) {
      console.error("Error fetching tournaments:", error)
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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.tournamentId) newErrors.tournamentId = "Tournament is required"
    if (!formData.brandId) newErrors.brandId = "Brand is required"
    if (!formData.name.trim()) newErrors.name = "Team name is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          seedNo: formData.seedNo ? Number.parseInt(formData.seedNo) : null,
        }),
      })

      if (response.ok) {
        const team = await response.json()
        router.push(`/teams/${team.id}`)
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || "Failed to create team" })
      }
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requiredPermissions={[PERMISSIONS.TEAMS_CREATE]}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/teams">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Team</h1>
            <p className="text-gray-600 mt-2">Add a new team to a tournament</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
              <CardDescription>Basic team details and tournament assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tournament">Tournament *</Label>
                  <Select
                    value={formData.tournamentId}
                    onValueChange={(value) => handleInputChange("tournamentId", value)}
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
                  {errors.tournamentId && <p className="text-sm text-red-600">{errors.tournamentId}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Select value={formData.brandId} onValueChange={(value) => handleInputChange("brandId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournamentBrands.map((tb) => (
                        <SelectItem key={tb.brandId} value={tb.brandId}>
                          {tb.brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.brandId && <p className="text-sm text-red-600">{errors.brandId}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Team Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter team name"
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseName">Base Name</Label>
                  <Input
                    id="baseName"
                    value={formData.baseName}
                    onChange={(e) => handleInputChange("baseName", e.target.value)}
                    placeholder="Base team name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suffix">Suffix</Label>
                  <Input
                    id="suffix"
                    value={formData.suffix}
                    onChange={(e) => handleInputChange("suffix", e.target.value)}
                    placeholder="Team suffix (e.g., A, B, 1, 2)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color">Team Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => handleInputChange("color", e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => handleInputChange("color", e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seedNo">Seed Number</Label>
                  <Input
                    id="seedNo"
                    type="number"
                    min="1"
                    value={formData.seedNo}
                    onChange={(e) => handleInputChange("seedNo", e.target.value)}
                    placeholder="Optional seed number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </CardContent>
          </Card>

          {errors.submit && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{errors.submit}</div>}

          <div className="flex justify-end gap-4">
            <Link href="/teams">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>Creating...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Team
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthGuard>
  )
}
