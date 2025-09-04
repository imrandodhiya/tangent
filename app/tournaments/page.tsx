"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Plus, Search, Calendar, MapPin, Users, Trophy, Eye, Edit } from "lucide-react"
import { TournamentStatus, TournamentVisibility } from "@prisma/client"
import { PERMISSIONS } from "@/lib/permissions"
import { PageSizeSelect, PaginationControls } from "@/components/shared/pagination-controls"

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
  teamsCount: number
  roundsCount: number
  brandsCount: number
  playersPerTeam: number
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TournamentStatus>("all")
  const [visibilityFilter, setVisibilityFilter] = useState<TournamentVisibility>("all")
  const searchParams = useSearchParams()
  const router = useRouter()
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
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter as string)
    else params.delete("status")
    if (visibilityFilter && visibilityFilter !== "all") params.set("visibility", visibilityFilter as string)
    else params.delete("visibility")
    router.replace(`?${params.toString()}`)
  }, [page, pageSize, search, statusFilter, visibilityFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchTournaments()
  }, [search, statusFilter, visibilityFilter, page, pageSize])

  const fetchTournaments = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
        ...(statusFilter !== "all" ? { status: statusFilter as string } : {}),
        ...(visibilityFilter !== "all" ? { visibility: visibilityFilter as string } : {}),
      })

      const response = await fetch(`/api/tournaments?${params}`)
      const data = await response.json()

      if (response.ok) {
        setTournaments(data.tournaments)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error)
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

  const getVisibilityColor = (visibility: TournamentVisibility) => {
    switch (visibility) {
      case TournamentVisibility.PUBLIC:
        return "bg-green-100 text-green-800"
      case TournamentVisibility.PRIVATE:
        return "bg-yellow-100 text-yellow-800"
      case TournamentVisibility.INTERNAL:
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={[PERMISSIONS.TOURNAMENTS_VIEW]}>
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
    <AuthGuard requiredPermissions={[PERMISSIONS.TOURNAMENTS_VIEW]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tournaments</h1>
            <p className="text-gray-600 mt-2">Manage bowling tournaments and competitions</p>
          </div>
          <Link href="/tournaments/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Tournament
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setPage(1)
              setStatusFilter(val as any)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={visibilityFilter}
            onValueChange={(val) => {
              setPage(1)
              setVisibilityFilter(val as any)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="PUBLIC">Public</SelectItem>
              <SelectItem value="PRIVATE">Private</SelectItem>
              <SelectItem value="INTERNAL">Internal</SelectItem>
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

        {/* Tournament Cards */}
        <div className="grid gap-6">
          {tournaments.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No tournaments found</h3>
                <p className="text-gray-600 mb-4">
                  {search || statusFilter !== "all" || visibilityFilter !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "Get started by creating your first tournament."}
                </p>
                <Link href="/tournaments/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Tournament
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            tournaments.map((tournament) => (
              <Card key={tournament.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{tournament.name}</CardTitle>
                        <Badge className={getStatusColor(tournament.status)}>{tournament.status}</Badge>
                        <Badge className={getVisibilityColor(tournament.visibility)}>{tournament.visibility}</Badge>
                      </div>
                      {tournament.description && (
                        <CardDescription className="text-sm">{tournament.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/tournaments/${tournament.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/tournaments/${tournament.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                        {new Date(tournament.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>
                        {tournament.city.name}, {tournament.state.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{tournament.teamsCount} teams</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-gray-400" />
                      <span>{tournament.roundsCount} rounds</span>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    {tournament.brandsCount} brands • {tournament.playersPerTeam} players per team
                  </div>
                </CardContent>
              </Card>
            ))
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
