"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { Plus, MapPin, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageSizeSelect, PaginationControls } from "@/components/shared/pagination-controls"

interface State {
  id: string
  name: string
  isDefault: boolean
  createdAt: string
  _count?: {
    cities: number
    users: number
    brands: number
    members: number
    tournaments: number
  }
}

export default function StatesPage() {
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedState, setSelectedState] = useState<State | null>(null)
  const { toast } = useToast()
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
    router.replace(`?${params.toString()}`)
  }, [page, pageSize, search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchStates()
  }, [page, pageSize, search])

  const fetchStates = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      })
      const response = await fetch(`/api/states?${params}`)
      if (response.ok) {
        const data = await response.json()
        setStates(data.states || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error fetching states:", error)
      toast({
        title: "Error",
        description: "Failed to load states",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteState = async () => {
    if (!selectedState) return

    try {
      const response = await fetch(`/api/states/${selectedState.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete state")
      }

      toast({
        title: "Success",
        description: "State deleted successfully",
      })

      setShowDeleteDialog(false)
      setSelectedState(null)
      fetchStates()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (state: State) => {
    setSelectedState(state)
    setShowDeleteDialog(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthGuard requiredPermissions={[PERMISSIONS.SYSTEM_SETTINGS]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">States</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage states and geographical locations</p>
          </div>
          <Link href="/states/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add State
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search states..."
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              className="pl-10"
            />
          </div>
          <PageSizeSelect
            value={pageSize}
            onChange={(n) => {
              setPage(1)
              setPageSize(n)
            }}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {states.map((state) => (
            <Card key={state.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  {state.name}
                </CardTitle>
                <div className="flex gap-2">
                  <Link href={`/states/${state.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(state)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {state.isDefault && <Badge variant="secondary">Default State</Badge>}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Cities:</span>
                      <span className="ml-2 font-medium">{state._count?.cities || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Users:</span>
                      <span className="ml-2 font-medium">{state._count?.users || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Brands:</span>
                      <span className="ml-2 font-medium">{state._count?.brands || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tournaments:</span>
                      <span className="ml-2 font-medium">{state._count?.tournaments || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {states.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No states found</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                Get started by creating your first state
              </p>
              <Link href="/states/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add State
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete State</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedState?.name}"? This action cannot be undone and will fail if
                the state has associated cities, users, brands, members, or tournaments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteState}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="mt-6 flex items-center justify-center">
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </AuthGuard>
  )
}
