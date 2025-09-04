"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ArrowLeft, Edit, User, MapPin, Phone, Mail, Calendar, Trophy, Trash2, Building, Target, Globe, Instagram, Youtube, Facebook, Linkedin,Building2, Link as LinkIcon} from "lucide-react"

interface Member {
  id: string
  firstName: string
  lastName: string
  gender: string
  dob: string | null
  mobile: string
  email: string | null
  address: string | null
  experienceYears: number | null
  createdAt: string
  companyName: string | null
  companyWebsite: string | null
  companyInstagram: string | null
  companyYoutube: string | null
  companyFacebook: string | null
  companyLinkedin: string | null
  state: { id: string; name: string }
  city: { id: string; name: string }
  brand: { id: string; name: string } | null
  teamMembers?: Array<{
    team: {
      id: string
      name: string
      tournament: {
        id: string
        name: string
        status: string
        startDate: string
      }
    }
  }>
  scores?: Array<{
    id: string
    score: number
    match: {
      id: string
      tournament: {
        name: string
      }
    }
    createdAt: string
  }>
}
const ensureHttp = (v?: string | null) => {
  if (!v) return ""
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}
export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchMember(params.id as string)
    }
  }, [params.id])

  const fetchMember = async (id: string) => {
    try {
      const response = await fetch(`/api/members/${id}`)
      if (response.ok) {
        const data = await response.json()
        // normalize to arrays so the UI never sees undefined
        setMember({
          ...data,
          teamMembers: data.teamMembers ?? [],
          scores: data.scores ?? [],
        } as Member)
      } else {
        router.push("/members")
      }
    } catch (error) {
      console.error("Error fetching member:", error)
      router.push("/members")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async () => {
    if (!confirm("Are you sure you want to delete this member? This action cannot be undone.")) return

    try {
      const response = await fetch(`/api/members/${params.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/members")
      } else {
        const error = await response.json()
        alert(error.error || "Failed to delete member")
      }
    } catch (error) {
      console.error("Error deleting member:", error)
      alert("An error occurred while deleting the member")
    }
  }

  const calculateAge = (dob: string | null) => {
    if (!dob) return null
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case "MALE":
        return "bg-blue-100 text-blue-800"
      case "FEMALE":
        return "bg-pink-100 text-pink-800"
      case "OTHER":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={["member.view"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!member) {
    return (
      <AuthGuard requiredPermissions={["member.view"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Member not found</h1>
            <Link href="/members">
              <Button>Back to Members</Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const teamCount = member.teamMembers?.length ?? 0
  const scoreCount = member.scores?.length ?? 0

  return (
    <AuthGuard requiredPermissions={["member.view"]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/members">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Members
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {member.firstName} {member.lastName}
                </h1>
                <Badge className={getGenderColor(member.gender)}>{member.gender}</Badge>
                {member.dob && (
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {calculateAge(member.dob)} years
                  </Badge>
                )}
              </div>
              {member.brand && <p className="text-gray-600">{member.brand.name}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/members/${member.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Member
              </Button>
            </Link>
            <Button variant="destructive" onClick={handleDeleteMember}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamCount}</div>
                  <p className="text-xs text-muted-foreground">current teams</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Experience</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{member.experienceYears || 0}</div>
                  <p className="text-xs text-muted-foreground">years playing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{scoreCount}</div>
                  <p className="text-xs text-muted-foreground">recorded scores</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Member Since</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{new Date(member.createdAt).getFullYear()}</div>
                  <p className="text-xs text-muted-foreground">{new Date(member.createdAt).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {member.firstName} {member.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <a href={`tel:${member.mobile}`} className="text-sm text-blue-600 hover:underline">
                      {member.mobile}
                    </a>
                  </div>
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${member.email}`} className="text-sm text-blue-600 hover:underline">
                        {member.email}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {member.city.name}, {member.state.name}
                    </span>
                  </div>
                  {member.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm">{member.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {member.brand && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <Link href={`/brands/${member.brand.id}`} className="text-sm text-blue-600 hover:underline">
                        {member.brand.name}
                      </Link>
                    </div>
                  )}

                  {/* NEW: company name */}
                  {member.companyName && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{member.companyName}</span>
                    </div>
                  )}

                  {/* NEW: website + socials */}
                  {[
                    { href: member.companyWebsite, label: "Website", Icon: Globe },
                    { href: member.companyInstagram, label: "Instagram", Icon: Instagram },
                    { href: member.companyYoutube, label: "YouTube", Icon: Youtube },
                    { href: member.companyFacebook, label: "Facebook", Icon: Facebook },
                    { href: member.companyLinkedin, label: "LinkedIn", Icon: Linkedin },
                  ]
                    .filter(i => !!i.href)
                    .map(({ href, label, Icon }) => (
                      <div key={label} className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-400" />
                        <Link
                          href={ensureHttp(href!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          {label}
                          <LinkIcon className="h-3 w-3" />
                        </Link>
                      </div>
                    ))}

                  {member.experienceYears && (
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{member.experienceYears} years of experience</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{teamCount} active team memberships</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Memberships ({teamCount})</CardTitle>
                <CardDescription>Teams this member is currently part of</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {(member.teamMembers ?? []).map((tm, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{tm.team.name}</h3>
                        <div className="text-sm text-gray-600">
                          <p>{tm.team.tournament.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{tm.team.tournament.status}</Badge>
                            <span>•</span>
                            <span>Starts {new Date(tm.team.tournament.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/teams/${tm.team.id}`}>
                        <Button variant="outline" size="sm">
                          View Team
                        </Button>
                      </Link>
                    </div>
                  ))}
                  {(member.teamMembers?.length ?? 0) === 0 && (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No team memberships</h3>
                      <p className="text-gray-600">This member is not currently part of any teams</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Scores ({scoreCount})</CardTitle>
                <CardDescription>Latest bowling scores and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {(member.scores ?? []).slice(0, 10).map((score) => (
                    <div key={score.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Score: {score.score}</h3>
                        <div className="text-sm text-gray-600">
                          <p>{score.match.tournament.name}</p>
                          <p>{new Date(score.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{score.score}</Badge>
                    </div>
                  ))}
                  {(member.scores?.length ?? 0) === 0 && (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No scores recorded</h3>
                      <p className="text-gray-600">This member hasn't recorded any scores yet</p>
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
