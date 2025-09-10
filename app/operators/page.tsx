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
import { Plus, UserCog, Edit, Trash2, Mail, Phone, Target } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageSizeSelect, PaginationControls } from "@/components/shared/pagination-controls"

interface Operator {
  id: string
  firstName: string
  lastName: string
  email: string
  mobile: string
  status: string
  role: {
    id: string
    name: string
  }
  lastLoginAt?: string
  createdAt: string
}

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
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
    fetchOperators()
  }, [page, pageSize, search])

  const fetchOperators = async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search && { search }),
      })
      const response = await fetch(`/api/operators?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOperators(data.operators)
        setTotalPages(data.pagination?.totalPages || data.pagination?.pages || 1)
      } else {
        const err = await response.json()
        throw new Error(err.error || "Failed to load operators")
      }
    } catch (error: any) {
      console.error("Error fetching operators:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load operators",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOperator = async () => {
    if (!selectedOperator) return

    try {
      const response = await fetch(`/api/operators/${selectedOperator.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete operator")
      }

      toast({
        title: "Success",
        description: "Operator deleted successfully",
      })

      setShowDeleteDialog(false)
      setSelectedOperator(null)
      fetchOperators()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const openDeleteDialog = (operator: Operator) => {
    setSelectedOperator(operator)
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
    <AuthGuard requiredPermissions={[PERMISSIONS.USERS_VIEW]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Operators</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage system operators and staff</p>
          </div>
          <Link href="/operators/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Operator
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search operators..."
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
          {operators.map((operator) => (
            <Card key={operator.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-indigo-600" />
                  {operator.firstName} {operator.lastName}
                </CardTitle>
                <div className="flex gap-2">
                  <Link href={`/operators/${operator.id}/lanes`}>
                    <Button variant="ghost" size="sm" title="Manage Lanes">
                      <Target className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/operators/${operator.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(operator)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {operator.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {operator.mobile}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{operator.role.name.replace("_", " ")}</Badge>
                    <Badge variant={operator.status === "ACTIVE" ? "default" : "destructive"}>{operator.status}</Badge>
                  </div>
                  {operator.lastLoginAt && (
                    <div className="text-sm text-gray-500">
                      Last login: {new Date(operator.lastLoginAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {operators.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCog className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No operators found</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                Get started by creating your first operator account
              </p>
              <Link href="/operators/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Operator
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Pagination Controls */}
        <div className="mt-6 flex items-center justify-center">
          <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Operator</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedOperator?.firstName} {selectedOperator?.lastName}"? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteOperator}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  )
}
