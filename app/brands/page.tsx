"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Plus, Search, Building, Users, Trophy, MapPin, Phone, Mail, Edit, Eye } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { PageSizeSelect, PaginationControls } from "@/components/shared/pagination-controls"

interface Brand {
  id: string
  name: string
  description: string | null
  state: { name: string }
  city: { name: string }
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  isActive: boolean
  membersCount: number
  teamsCount: number
  primaryColor: string | null
  secondaryColor: string | null
}

interface State {
  id: string
  name: string
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [stateFilter, setStateFilter] = useState("all")
  const [activeFilter, setActiveFilter] = useState("all")
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
    if (stateFilter) params.set("stateId", stateFilter)
    else params.delete("stateId")
    if (activeFilter !== "all") params.set("isActive", activeFilter)
    else params.delete("isActive")
    router.replace(`?${params.toString()}`)
  }, [page, pageSize, search, stateFilter, activeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchStates()
    fetchBrands()
  }, [search, stateFilter, activeFilter, page, pageSize])

  const fetchStates = async () => {
    try {
      const response = await fetch("/api/states")
      const data = await response.json()
      setStates(data.states || [])
    } catch (error) {
      console.error("Error fetching states:", error)
    }
  }

  const fetchBrands = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
        ...(stateFilter !== "all" && stateFilter ? { stateId: stateFilter } : {}),
        ...(activeFilter !== "all" ? { isActive: activeFilter } : {}),
      })

      const response = await fetch(`/api/brands?${params}`)
      const data = await response.json()

      if (response.ok) {
        setBrands(data.brands)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error fetching brands:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={["brand.view"]}>
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
    <AuthGuard requiredPermissions={["brand.view"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Brands</h1>
            <p className="text-gray-600 mt-2">Manage bowling brands and organizations</p>
          </div>
          <Link href="/brands/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search brands..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              className="pl-10"
            />
          </div>
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
          <Select
            value={activeFilter}
            onValueChange={(val) => {
              setPage(1)
              setActiveFilter(val)
            }}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
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

        {/* Brand Cards */}
        <div className="grid gap-6">
          {brands.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No brands found</h3>
                <p className="text-gray-600 mb-4">
                  {search || stateFilter !== "all" || activeFilter !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "Get started by adding your first brand."}
                </p>
                <Link href="/brands/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Brand
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            brands.map((brand) => (
              <Card key={brand.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{brand.name}</CardTitle>
                        <Badge variant={brand.isActive ? "default" : "secondary"}>
                          {brand.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {brand.description && <CardDescription className="text-sm">{brand.description}</CardDescription>}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/brands/${brand.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/brands/${brand.id}/edit`}>
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
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>
                          {brand.city.name}, {brand.state.name}
                        </span>
                      </div>
                      {brand.contactPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{brand.contactPhone}</span>
                        </div>
                      )}
                      {brand.contactEmail && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{brand.contactEmail}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{brand.membersCount} members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-gray-400" />
                        <span>{brand.teamsCount} teams</span>
                      </div>
                      {brand.contactName && <div className="text-xs text-gray-500">Contact: {brand.contactName}</div>}
                    </div>
                  </div>
                  {(brand.primaryColor || brand.secondaryColor) && (
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs text-gray-500">Brand Colors:</span>
                      {brand.primaryColor && (
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: brand.primaryColor }}
                          title={`Primary: ${brand.primaryColor}`}
                        />
                      )}
                      {brand.secondaryColor && (
                        <div
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: brand.secondaryColor }}
                          title={`Secondary: ${brand.secondaryColor}`}
                        />
                      )}
                    </div>
                  )}
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
