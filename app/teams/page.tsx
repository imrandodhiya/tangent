"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Plus, Users, Trophy, Building, Edit, Eye } from "lucide-react"
import { TournamentStatus } from "@prisma/client"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageSizeSelect, PaginationControls } from "@/components/shared/pagination-controls"

interface Team {
  id: string
  name: string
  tournament: {
    name: string
    status: TournamentStatus
  }
  brand: {
    name: string
  }
  teamMembers: Array<{
    member: {
      firstName: string
      lastName: string
      gender: string
    }
    roleInTeam: string
  }>
  seedNo: number | null
  color: string | null
}

interface Tournament {
  id: string
  name: string
  status: TournamentStatus
}

interface Brand {
  id: string
  name: string
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [tournamentFilter, setTournamentFilter] = useState("")
  const [brandFilter, setBrandFilter] = useState("")
  const searchParams = useSearchParams()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState<number>(Number(searchParams.get("page") || "1"))
  const [pageSize, setPageSize] = useState<number>(
    Number(searchParams.get("pageSize") || searchParams.get("per_page") || "10"),
  )
  const [totalPages, setTotalPages] = useState<number>(1)

  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    if (search) params.set("search", search)
    else params.delete("search")
    if (tournamentFilter && tournamentFilter !== "all") params.set("tournamentId", tournamentFilter)
    else params.delete("tournamentId")
    if (brandFilter && brandFilter !== "all") params.set("brandId", brandFilter)
    else params.delete("brandId")
    router.replace(`?${params.toString()}`)
  }, [page, pageSize, search, tournamentFilter, brandFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTournaments()
    fetchBrands()
    fetchTeams()
  }, [tournamentFilter, brandFilter, page, pageSize, search])

  const fetchTournaments = async () => {
    try {
      const response = await fetch("/api/tournaments?page=1&pageSize=1000")
      const data = await response.json()
      setTournaments(data.tournaments || [])
    } catch (error) {
      console.error("Error fetching tournaments:", error)
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands?page=1&pageSize=1000")
      const data = await response.json()
      setBrands(data.brands || [])
    } catch (error) {
      console.error("Error fetching brands:", error)
    }
  }

  const fetchTeams = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
        ...(tournamentFilter && tournamentFilter !== "all" && { tournamentId: tournamentFilter }),
        ...(brandFilter && brandFilter !== "all" && { brandId: brandFilter }),
      } as any)

      const response = await fetch(`/api/teams?${params}`)
      const data = await response.json()

      if (response.ok) {
        setTeams(data.teams || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setLoading(false)
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

  const getGenderDistribution = (teamMembers: Team["teamMembers"]) => {
    const male = teamMembers.filter((tm) => tm.member.gender === "MALE").length
    const female = teamMembers.filter((tm) => tm.member.gender === "FEMALE").length
    return { male, female }
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={["team.view"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredPermissions={["team.view"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="text-gray-600 mt-2">Manage tournament teams and player assignments</p>
          </div>
          <Link href="/teams/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search teams..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={tournamentFilter}
            onValueChange={(val) => {
              setPage(1)
              setTournamentFilter(val)
            }}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filter by tournament" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tournaments</SelectItem>
              {tournaments.map((tournament) => (
                <SelectItem key={tournament.id} value={tournament.id}>
                  {tournament.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={brandFilter}
            onValueChange={(val) => {
              setPage(1)
              setBrandFilter(val)
            }}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder="Filter by brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PageSizeSelect
            value={pageSize}
            onChange={(n) => {
              setPage(1)
              setPageSize(n)
            }}
            className="sm:ml-auto"
          />
        </div>

        {/* Team Cards */}
        <div className="grid gap-6">
          {teams.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No teams found</h3>
                <p className="text-gray-600 mb-4">
                  {tournamentFilter !== "all" || brandFilter !== "all" || search
                    ? "Try adjusting your filters to see more results."
                    : "Get started by creating your first team."}
                </p>
                <Link href="/teams/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            teams.map((team) => {
              const { male, female } = getGenderDistribution(team.teamMembers)
              return (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">{team.name}</CardTitle>
                          {team.seedNo && <Badge variant="outline">Seed #{team.seedNo}</Badge>}
                          <Badge className={getStatusColor(team.tournament.status)}>{team.tournament.status}</Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {team.tournament.name} • {team.brand.name}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/teams/${team.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/teams/${team.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {team.teamMembers.length} members ({male}M, {female}F)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{team.brand.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{team.tournament.name}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Team Members:</span>
                          <div className="mt-1 space-y-1">
                            {team.teamMembers.slice(0, 3).map((tm, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                {tm.member.firstName} {tm.member.lastName}
                                {tm.roleInTeam !== "PLAYER" && (
                                  <Badge variant="outline" className="ml-1 text-xs">
                                    {tm.roleInTeam}
                                  </Badge>
                                )}
                              </div>
                            ))}
                            {team.teamMembers.length > 3 && (
                              <div className="text-xs text-gray-500">+{team.teamMembers.length - 3} more</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {team.color && (
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Team Color:</span>
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: team.color }}
                          title={team.color}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Pagination Controls */}
        <div className="mt-6 flex items-center justify-center">
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </AuthGuard>
  )
}
