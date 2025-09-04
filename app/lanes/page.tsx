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
import { Plus, Gamepad2, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageSizeSelect, PaginationControls } from "@/components/shared/pagination-controls"

interface Lane {
  id: string
  laneNo: number
  venueName?: string
  isActive: boolean
  notes?: string
  createdAt: string
}

export default function LanesPage() {
  const [lanes, setLanes] = useState<Lane[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedLane, setSelectedLane] = useState<Lane | null>(null)
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
    fetchLanes()
  }, [page, pageSize, search])

  const fetchLanes = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      })
      const response = await fetch(`/api/lanes?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLanes(data.lanes || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Error fetching lanes:", error)
      toast({
        title: "Error",
        description: "Failed to load lanes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteLane = async () => {
    if (!selectedLane) return

    try {
      const response = await fetch(`/api/lanes/${selectedLane.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete lane")
      }

      toast({
        title: "Success",
        description: "Lane deleted successfully",
      })

      setShowDeleteDialog(false)
      setSelectedLane(null)
      fetchLanes()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (lane: Lane) => {
    setSelectedLane(lane)
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bowling Lanes</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage bowling lanes and venues</p>
          </div>
          <Link href="/lanes/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Lane
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search lanes by venue or lane number..."
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
          {lanes.map((lane) => (
            <Card key={lane.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-purple-600" />
                  Lane {lane.laneNo}
                </CardTitle>
                <div className="flex gap-2">
                  <Link href={`/lanes/${lane.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(lane)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lane.venueName && <div className="text-sm text-gray-600">Venue: {lane.venueName}</div>}
                  <Badge variant={lane.isActive ? "default" : "destructive"}>
                    {lane.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {lane.notes && <div className="text-sm text-gray-600">Notes: {lane.notes}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {lanes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Gamepad2 className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No lanes found</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                Get started by creating your first bowling lane
              </p>
              <Link href="/lanes/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lane
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Lane</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "Lane {selectedLane?.laneNo}"? This action cannot be undone and will
                fail if the lane has existing tournament assignments.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteLane}
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
