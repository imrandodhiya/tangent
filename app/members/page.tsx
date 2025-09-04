"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Plus, Search, User, MapPin, Phone, Mail, Edit, Eye, Calendar } from "lucide-react"
import { Gender } from "@prisma/client"
import { useSearchParams, useRouter } from "next/navigation"
import { PageSizeSelect, PaginationControls } from "@/components/shared/pagination-controls"

interface Member {
  id: string
  firstName: string
  lastName: string
  gender: Gender
  dob: string | null
  mobile: string
  email: string | null
  address: string | null
  state: { name: string }
  city: { name: string }
  brand: { name: string } | null
  experienceYears: number | null
  teamMembers: Array<{
    team: {
      name: string
      tournament: {
        name: string
        status: string
      }
    }
  }>
}

interface Brand {
  id: string
  name: string
}

interface State {
  id: string
  name: string
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [brandFilter, setBrandFilter] = useState("")
  const [genderFilter, setGenderFilter] = useState("")
  const [stateFilter, setStateFilter] = useState("")
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
    if (brandFilter && brandFilter !== "all") params.set("brandId", brandFilter)
    else params.delete("brandId")
    if (genderFilter && genderFilter !== "all") params.set("gender", genderFilter)
    else params.delete("gender")
    if (stateFilter && stateFilter !== "all") params.set("stateId", stateFilter)
    else params.delete("stateId")
    router.replace(`?${params.toString()}`)
  }, [page, pageSize, search, brandFilter, genderFilter, stateFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchBrands()
    fetchStates()
    fetchMembers()
  }, [search, brandFilter, genderFilter, stateFilter, page, pageSize])

  const fetchBrands = async () => {
    try {
      const response = await fetch("/api/brands")
      const data = await response.json()
      setBrands(data.brands || [])
    } catch (error) {
      console.error("Error fetching brands:", error)
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

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
        ...(brandFilter && brandFilter !== "all" ? { brandId: brandFilter } : {}),
        ...(genderFilter && genderFilter !== "all" ? { gender: genderFilter } : {}),
        ...(stateFilter && stateFilter !== "all" ? { stateId: stateFilter } : {}),
      })

      const response = await fetch(`/api/members?${params}`)
      const data = await response.json()

      if (response.ok) {
        setMembers(data.members)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  const getGenderColor = (gender: Gender) => {
    switch (gender) {
      case Gender.MALE:
        return "bg-blue-100 text-blue-800"
      case Gender.FEMALE:
        return "bg-pink-100 text-pink-800"
      case Gender.OTHER:
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  if (loading) {
    return (
      <AuthGuard requiredPermissions={["member.view"]}>
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
    <AuthGuard requiredPermissions={["member.view"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-600 mt-2">Manage bowling team members and players</p>
          </div>
          <Link href="/members/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              className="pl-10"
            />
          </div>
          <Select
            value={brandFilter}
            onValueChange={(val) => {
              setPage(1)
              setBrandFilter(val)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
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
          <Select
            value={genderFilter}
            onValueChange={(val) => {
              setPage(1)
              setGenderFilter(val)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="MALE">Male</SelectItem>
              <SelectItem value="FEMALE">Female</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={stateFilter}
            onValueChange={(val) => {
              setPage(1)
              setStateFilter(val)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name}
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

        {/* Member Cards */}
        <div className="grid gap-6">
          {members.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No members found</h3>
                <p className="text-gray-600 mb-4">
                  {search || brandFilter !== "all" || genderFilter !== "all" || stateFilter !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "Get started by adding your first member."}
                </p>
                <Link href="/members/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            members.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">
                          {member.firstName} {member.lastName}
                        </CardTitle>
                        <Badge className={getGenderColor(member.gender)}>{member.gender}</Badge>
                        {member.dob && (
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            {calculateAge(member.dob)} years
                          </Badge>
                        )}
                      </div>
                      {member.brand && <CardDescription className="text-sm">{member.brand.name}</CardDescription>}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/members/${member.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/members/${member.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{member.mobile}</span>
                      </div>
                      {member.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{member.email}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {member.city.name}, {member.state.name}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {member.experienceYears && (
                        <div className="text-sm">
                          <span className="font-medium">Experience:</span> {member.experienceYears} years
                        </div>
                      )}
                      {member.teamMembers.length > 0 && (
                        <div className="text-sm">
                          <span className="font-medium">Current Teams:</span>
                          <div className="mt-1 space-y-1">
                            {member.teamMembers.slice(0, 2).map((tm, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                {tm.team.name} ({tm.team.tournament.name})
                              </div>
                            ))}
                            {member.teamMembers.length > 2 && (
                              <div className="text-xs text-gray-500">+{member.teamMembers.length - 2} more</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
