"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthGuard } from "@/components/auth/auth-guard"
import {
  ArrowLeft,
  Edit,
  Building,
  MapPin,
  Phone,
  Mail,
  Users,
  Trophy,
  Calendar,
  Trash2,
  User,
  Target,
} from "lucide-react"

interface Brand {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  isActive: boolean
  createdAt: string
  state: { id: string; name: string }
  city: { id: string; name: string }
  members: Array<{
    id: string
    firstName: string
    lastName: string
    gender: string
    mobile: string
    email: string | null
  }>
  teams: Array<{
    id: string
    name: string
    tournament: {
      id: string
      name: string
      status: string
      startDate: string
    }
    teamMembers: Array<{
      member: { firstName: string; lastName: string }
    }>
  }>
  tournamentBrands: Array<{
    tournament: {
      id: string
      name: string
      status: string
      startDate: string
    }
    numberOfTeams: number
  }>
}

export default function BrandDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchBrand(params.id as string)
    }
  }, [params.id])

  const fetchBrand = async (id: string) => {
    try {
      const response = await fetch(`/api/brands/${id}`)
      if (response.ok) {
        const data = await response.json()
        console.log(data, "fetchBrand")
        setBrand(data)
      } else {
        // router.push("/brands")
      }
    } catch (error) {
      console.error("Error fetching brand:", error)
      // router.push("/brands")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBrand = async () => {
    if (!confirm("Are you sure you want to delete this brand? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/brands/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/brands")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete brand")
      }
    } catch (error) {
      console.error("Error deleting brand:", error)
      alert("An error occurred while deleting the brand")
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={["brand.view"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!brand) {
    return (
      <AuthGuard requiredPermissions={["brand.view"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Brand not found</h1>
            <Link href="/brands">
              <Button>Back to Brands</Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredPermissions={["brand.view"]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/brands">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Brands
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{brand.name}</h1>
                <Badge variant={brand.isActive ? "default" : "secondary"}>
                  {brand.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {brand.description && <p className="text-gray-600">{brand.description}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/brands/${brand.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Brand
              </Button>
            </Link>
            <Button variant="destructive" onClick={handleDeleteBrand}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="tournaments">Tournaments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{brand.members?.length ?? 0}</div>
                  <p className="text-xs text-muted-foreground">registered players</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{brand.teams?.length}</div>
                  <p className="text-xs text-muted-foreground">tournament teams</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{brand.tournamentBrands?.length}</div>
                  <p className="text-xs text-muted-foreground">participating in</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Established</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{new Date(brand.createdAt).getFullYear()}</div>
                  <p className="text-xs text-muted-foreground">{new Date(brand.createdAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {brand.city?.name}, {brand.state.name}
                    </span>
                  </div>
                  {brand.website && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {brand.website}
                      </a>
                    </div>
                  )}
                  {(brand.primaryColor || brand.secondaryColor) && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Brand Colors:</span>
                      <div className="flex gap-2">
                        {brand.primaryColor && (
                          <div
                            className="w-6 h-6 rounded border-2 border-gray-300"
                            style={{ backgroundColor: brand.primaryColor }}
                            title={`Primary: ${brand.primaryColor}`}
                          />
                        )}
                        {brand.secondaryColor && (
                          <div
                            className="w-6 h-6 rounded border-2 border-gray-300"
                            style={{ backgroundColor: brand.secondaryColor }}
                            title={`Secondary: ${brand.secondaryColor}`}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {brand.contactName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{brand.contactName}</span>
                    </div>
                  )}
                  {brand.contactPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${brand.contactPhone}`} className="text-sm text-blue-600 hover:underline">
                        {brand.contactPhone}
                      </a>
                    </div>
                  )}
                  {brand.contactEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${brand.contactEmail}`} className="text-sm text-blue-600 hover:underline">
                        {brand.contactEmail}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Members ({brand.members?.length ?? 0})</CardTitle>
                <CardDescription>Players registered under this brand</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {brand.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {member.firstName[0]}
                            {member.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {member.firstName} {member.lastName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge variant="outline">{member.gender}</Badge>
                            <span>•</span>
                            <Phone className="h-3 w-3" />
                            <span>{member.mobile}</span>
                            {member.email && (
                              <>
                                <span>•</span>
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link href={`/members/${member.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {brand.members?.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No members yet</h3>
                      <p className="text-gray-600">This brand doesn't have any registered members</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Teams ({brand.teams?.length})</CardTitle>
                <CardDescription>Teams representing this brand in tournaments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {brand.teams?.map((team) => (
                    <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{team.name}</h3>
                        <div className="text-sm text-gray-600">
                          <p>{team.tournament.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{team.tournament.status}</Badge>
                            <span>•</span>
                            <span>{team.teamMembers?.length} members</span>
                            <span>•</span>
                            <span>Starts {new Date(team.tournament.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/teams/${team.id}`}>
                        <Button variant="outline" size="sm">
                          View Team
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {brand.teams?.length === 0 && (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams yet</h3>
                      <p className="text-gray-600">This brand doesn't have any active teams</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tournaments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Participation ({brand.tournamentBrands?.length})</CardTitle>
                <CardDescription>Tournaments this brand is participating in</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {brand?.tournamentBrands.map((tb, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{tb.tournament.name}</h3>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{tb.tournament.status}</Badge>
                            <span>•</span>
                            <span>{tb.numberOfTeams} teams assigned</span>
                            <span>•</span>
                            <span>Starts {new Date(tb.tournament.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/tournaments/${tb.tournament.id}`}>
                        <Button variant="outline" size="sm">
                          View Tournament
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {brand.tournamentBrands?.length === 0 && (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No tournament participation</h3>
                      <p className="text-gray-600">This brand is not participating in any tournaments</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}
