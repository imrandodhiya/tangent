"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { TournamentVisibility } from "@prisma/client"
import { PERMISSIONS } from "@/lib/permissions"

interface State {
  id: string
  name: string
}

interface City {
  id: string
  name: string
  stateId: string
}

interface TournamentRound {
  roundNo: number
  name: string
  isKnockout: boolean
  teamsIn?: number
  teamsOut?: number
  matchesCount?: number
  aggregationScope: "ROUND" | "MATCH"
  aggregationMetric: "TEAM_TOTAL" | "AVG_OF_GAMES" | "BEST_GAME"
}

export default function CreateTournamentPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stateId: "",
    cityId: "",
    startDate: "",
    endDate: "",
    visibility: TournamentVisibility.PUBLIC,
    noOfRounds: 4, // Added number of rounds field
    brandsCount: 4,
    teamsPerBrand: 2,
    playersPerTeam: 5,
    malePerTeam: 3,
    femalePerTeam: 2,
    lanesTotal: 8,
    framesPerGame: 10,
    handicapBaseScore: 200,
    handicapPercent: 90,
    femaleAdjustmentPins: 8,
    allowManualOverride: true,
    requireDualApproval: false,
    laneRotationEnabled: false,
    youtubeLiveUrl: "",
  })

  const [rounds, setRounds] = useState<TournamentRound[]>([])
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    fetchStates()
  }, [])

  useEffect(() => {
    if (formData.stateId) {
      fetchCities(formData.stateId)
    } else {
      setCities([])
      setFormData((prev) => ({ ...prev, cityId: "" }))
    }
  }, [formData.stateId])

  useEffect(() => {
    const newRounds: TournamentRound[] = []
    for (let i = 1; i <= formData.noOfRounds; i++) {
      const existingRound = rounds.find((r) => r.roundNo === i)
      newRounds.push(
        existingRound || {
          roundNo: i,
          name: i === formData.noOfRounds ? "Finals" : `Round ${i}`,
          isKnockout: true,
          teamsIn: undefined,
          teamsOut: undefined,
          matchesCount: undefined,
          aggregationScope: "ROUND",
          aggregationMetric: "TEAM_TOTAL",
        },
      )
    }
    setRounds(newRounds)
  }, [formData.noOfRounds])

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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const handleRoundChange = (roundNo: number, field: keyof TournamentRound, value: any) => {
    setRounds((prev) => prev.map((round) => (round.roundNo === roundNo ? { ...round, [field]: value } : round)))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Tournament name is required"
    if (!formData.stateId) newErrors.stateId = "State is required"
    if (!formData.cityId) newErrors.cityId = "City is required"
    if (!formData.startDate) newErrors.startDate = "Start date is required"
    if (!formData.endDate) newErrors.endDate = "End date is required"
    if (formData.noOfRounds < 1) newErrors.noOfRounds = "At least 1 round is required"

    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = "End date must be after start date"
    }

    if (formData.malePerTeam + formData.femalePerTeam !== formData.playersPerTeam) {
      newErrors.playersPerTeam = "Male + Female players must equal total players per team"
    }

    // Validate rounds
    rounds.forEach((round) => {
      if (!round.name.trim()) {
        newErrors[`round_${round.roundNo}_name`] = `Round ${round.roundNo} name is required`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          rounds, // Include rounds data in submission
        }),
      })

      if (response.ok) {
        const tournament = await response.json()
        router.push(`/tournaments/${tournament.id}`)
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || "Failed to create tournament" })
      }
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requiredPermissions={[PERMISSIONS.TOURNAMENTS_CREATE]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/tournaments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tournaments
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Tournament</h1>
            <p className="text-gray-600 mt-2">Set up a new bowling tournament</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tournament name, description, and location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tournament Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter tournament name"
                    maxLength={180}
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select value={formData.visibility} onValueChange={(value) => handleInputChange("visibility", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                      <SelectItem value="INTERNAL">Internal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Tournament description (optional)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select value={formData.stateId} onValueChange={(value) => handleInputChange("stateId", value)}>
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
                  {errors.stateId && <p className="text-sm text-red-600">{errors.stateId}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Select value={formData.cityId} onValueChange={(value) => handleInputChange("cityId", value)}>
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
                  {errors.cityId && <p className="text-sm text-red-600">{errors.cityId}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                  />
                  {errors.startDate && <p className="text-sm text-red-600">{errors.startDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                  />
                  {errors.endDate && <p className="text-sm text-red-600">{errors.endDate}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Structure */}
          <Card>
            <CardHeader>
              <CardTitle>Tournament Structure</CardTitle>
              <CardDescription>Configure teams, players, lanes, and rounds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="noOfRounds">Number of Rounds *</Label>
                  <Input
                    id="noOfRounds"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.noOfRounds}
                    onChange={(e) => handleInputChange("noOfRounds", Number.parseInt(e.target.value))}
                  />
                  {errors.noOfRounds && <p className="text-sm text-red-600">{errors.noOfRounds}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandsCount">Brands Count</Label>
                  <Input
                    id="brandsCount"
                    type="number"
                    min="1"
                    value={formData.brandsCount}
                    onChange={(e) => handleInputChange("brandsCount", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamsPerBrand">Teams per Brand</Label>
                  <Input
                    id="teamsPerBrand"
                    type="number"
                    min="1"
                    value={formData.teamsPerBrand}
                    onChange={(e) => handleInputChange("teamsPerBrand", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lanesTotal">Total Lanes</Label>
                  <Input
                    id="lanesTotal"
                    type="number"
                    min="1"
                    value={formData.lanesTotal}
                    onChange={(e) => handleInputChange("lanesTotal", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="playersPerTeam">Players per Team</Label>
                  <Input
                    id="playersPerTeam"
                    type="number"
                    min="1"
                    value={formData.playersPerTeam}
                    onChange={(e) => handleInputChange("playersPerTeam", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="malePerTeam">Male Players per Team</Label>
                  <Input
                    id="malePerTeam"
                    type="number"
                    min="0"
                    value={formData.malePerTeam}
                    onChange={(e) => handleInputChange("malePerTeam", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="femalePerTeam">Female Players per Team</Label>
                  <Input
                    id="femalePerTeam"
                    type="number"
                    min="0"
                    value={formData.femalePerTeam}
                    onChange={(e) => handleInputChange("femalePerTeam", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>
              {errors.playersPerTeam && <p className="text-sm text-red-600">{errors.playersPerTeam}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tournament Rounds</CardTitle>
              <CardDescription>Configure each round of the tournament</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {rounds.map((round, index) => (
                <Card key={round.roundNo} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Round {round.roundNo}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`round_${round.roundNo}_name`}>Round Name *</Label>
                        <Input
                          id={`round_${round.roundNo}_name`}
                          value={round.name}
                          onChange={(e) => handleRoundChange(round.roundNo, "name", e.target.value)}
                          placeholder={`Round ${round.roundNo}`}
                        />
                        {errors[`round_${round.roundNo}_name`] && (
                          <p className="text-sm text-red-600">{errors[`round_${round.roundNo}_name`]}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`round_${round.roundNo}_matches`}>Number of Matches</Label>
                        <Input
                          id={`round_${round.roundNo}_matches`}
                          type="number"
                          min="1"
                          value={round.matchesCount || ""}
                          onChange={(e) =>
                            handleRoundChange(
                              round.roundNo,
                              "matchesCount",
                              Number.parseInt(e.target.value) || undefined,
                            )
                          }
                          placeholder="Auto-calculated"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`round_${round.roundNo}_teams_in`}>Teams In</Label>
                        <Input
                          id={`round_${round.roundNo}_teams_in`}
                          type="number"
                          min="1"
                          value={round.teamsIn || ""}
                          onChange={(e) =>
                            handleRoundChange(round.roundNo, "teamsIn", Number.parseInt(e.target.value) || undefined)
                          }
                          placeholder="Auto-calculated"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`round_${round.roundNo}_teams_out`}>Teams Out</Label>
                        <Input
                          id={`round_${round.roundNo}_teams_out`}
                          type="number"
                          min="0"
                          value={round.teamsOut || ""}
                          onChange={(e) =>
                            handleRoundChange(round.roundNo, "teamsOut", Number.parseInt(e.target.value) || undefined)
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`round_${round.roundNo}_aggregation_scope`}>Aggregation Scope</Label>
                        <Select
                          value={round.aggregationScope}
                          onValueChange={(value: "ROUND" | "MATCH") =>
                            handleRoundChange(round.roundNo, "aggregationScope", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ROUND">Round</SelectItem>
                            <SelectItem value="MATCH">Match</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`round_${round.roundNo}_aggregation_metric`}>Aggregation Metric</Label>
                        <Select
                          value={round.aggregationMetric}
                          onValueChange={(value: "TEAM_TOTAL" | "AVG_OF_GAMES" | "BEST_GAME") =>
                            handleRoundChange(round.roundNo, "aggregationMetric", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TEAM_TOTAL">Team Total</SelectItem>
                            <SelectItem value="AVG_OF_GAMES">Average of Games</SelectItem>
                            <SelectItem value="BEST_GAME">Best Game</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between pt-6">
                        <div className="space-y-0.5">
                          <Label>Knockout Round</Label>
                          <p className="text-sm text-gray-600">Teams are eliminated in this round</p>
                        </div>
                        <Switch
                          checked={round.isKnockout}
                          onCheckedChange={(checked) => handleRoundChange(round.roundNo, "isKnockout", checked)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Scoring Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Scoring Settings</CardTitle>
              <CardDescription>Configure handicaps and scoring rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="handicapBaseScore">Handicap Base Score</Label>
                  <Input
                    id="handicapBaseScore"
                    type="number"
                    min="0"
                    value={formData.handicapBaseScore}
                    onChange={(e) => handleInputChange("handicapBaseScore", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handicapPercent">Handicap Percentage</Label>
                  <Input
                    id="handicapPercent"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.handicapPercent}
                    onChange={(e) => handleInputChange("handicapPercent", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="femaleAdjustmentPins">Female Adjustment Pins</Label>
                  <Input
                    id="femaleAdjustmentPins"
                    type="number"
                    min="0"
                    value={formData.femaleAdjustmentPins}
                    onChange={(e) => handleInputChange("femaleAdjustmentPins", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Manual Override</Label>
                    <p className="text-sm text-gray-600">Allow manual score adjustments</p>
                  </div>
                  <Switch
                    checked={formData.allowManualOverride}
                    onCheckedChange={(checked) => handleInputChange("allowManualOverride", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Dual Approval</Label>
                    <p className="text-sm text-gray-600">Require two approvals for score changes</p>
                  </div>
                  <Switch
                    checked={formData.requireDualApproval}
                    onCheckedChange={(checked) => handleInputChange("requireDualApproval", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lane Rotation Enabled</Label>
                    <p className="text-sm text-gray-600">Enable automatic lane rotation</p>
                  </div>
                  <Switch
                    checked={formData.laneRotationEnabled}
                    onCheckedChange={(checked) => handleInputChange("laneRotationEnabled", checked)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtubeLiveUrl">YouTube Live URL (Optional)</Label>
                <Input
                  id="youtubeLiveUrl"
                  type="url"
                  value={formData.youtubeLiveUrl}
                  onChange={(e) => handleInputChange("youtubeLiveUrl", e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </CardContent>
          </Card>

          {errors.submit && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{errors.submit}</div>}

          <div className="flex justify-end gap-4">
            <Link href="/tournaments">
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
                  Create Tournament
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthGuard>
  )
}
