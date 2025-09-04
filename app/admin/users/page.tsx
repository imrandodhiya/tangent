"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Search, Edit, Trash2, Mail, Phone, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams, useRouter } from "next/navigation"
import { PageSizeSelect, PaginationControls } from "@/components/shared/pagination-controls"

interface Role {
  id: string
  name: string
  description?: string
}

export default function UsersPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(
    Number(searchParams.get("pageSize") || searchParams.get("per_page") || "10"),
  )
  const [totalPages, setTotalPages] = useState<number>(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    roleId: "",
    status: "ACTIVE",
  })
  const { toast } = useToast()

  useEffect(() => {
    // keep URL in sync
    const params = new URLSearchParams(searchParams)
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    if (search) params.set("search", search)
    else params.delete("search")
    router.replace(`?${params.toString()}`)
  }, [page, pageSize, search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [page, pageSize, search])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: String(pageSize),
        ...(search && { search }),
      })
      const response = await fetch(`/api/users?${params}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch users")
      }
      const data = await response.json()
      setUsers(data.users || [])
      setTotalPages(data.pagination?.totalPages || data.pagination?.pages || 1)
    } catch (error: any) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles")
      if (!response.ok) {
        throw new Error("Failed to fetch roles")
      }
      const data = await response.json()
      setRoles(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching roles:", error)
      toast({
        title: "Warning",
        description: "Failed to load roles. Role selection may not work properly.",
        variant: "destructive",
      })
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.roleId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create user")
      }

      toast({
        title: "Success",
        description: "User created successfully",
      })

      setShowCreateDialog(false)
      setFormData({ firstName: "", lastName: "", email: "", mobile: "", password: "", roleId: "", status: "ACTIVE" })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.roleId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update user")
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      })

      setShowEditDialog(false)
      setSelectedUser(null)
      setFormData({ firstName: "", lastName: "", email: "", mobile: "", password: "", roleId: "", status: "ACTIVE" })
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete user")
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
      })

      setShowDeleteDialog(false)
      setSelectedUser(null)
      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (user) => {
    setSelectedUser(user)
    const userRole = roles.find((role) => role.name === user.role)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile || "",
      password: "",
      roleId: userRole?.id || "",
      status: user.status,
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (user) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  const getRoleColor = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "destructive"
      case "ADMIN":
        return "default"
      case "TOURNAMENT_DIRECTOR":
        return "secondary"
      case "OPERATOR":
      case "SCORER":
      case "TOURNAMENT_OPERATOR":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status) => {
    return status === "ACTIVE" ? "default" : "secondary"
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={[PERMISSIONS.USERS_VIEW]}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredPermissions={[PERMISSIONS.USERS_VIEW]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Manage system users and their roles</p>
          </div>

          <AuthGuard requiredPermissions={[PERMISSIONS.USERS_CREATE]}>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter secure password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.roleId}
                      onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name.replace(/_/g, " ")}
                            {role.description && (
                              <span className="text-xs text-gray-500 ml-2">- {role.description}</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create User</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </AuthGuard>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
            <div className="flex items-center gap-4 mt-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
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
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-12 w-12 text-gray-400 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
                  <p className="text-gray-600 mb-4">
                    {search ? "Try adjusting your search terms." : "Get started by adding your first user."}
                  </p>
                  <AuthGuard requiredPermissions={[PERMISSIONS.USERS_CREATE]}>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add User
                    </Button>
                  </AuthGuard>
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                        <div className="h-6 w-6 text-blue-600"></div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {user.firstName} {user.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                          {user.mobile && (
                            <>
                              <span>•</span>
                              <Phone className="h-3 w-3" />
                              <span>{user.mobile}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={getRoleColor(user.role)}>{user.role.replace(/_/g, " ")}</Badge>
                          <Badge variant={getStatusColor(user.status)}>{user.status}</Badge>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Created {new Date(user.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <AuthGuard requiredPermissions={[PERMISSIONS.USERS_UPDATE]}>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </AuthGuard>

                      <AuthGuard requiredPermissions={[PERMISSIONS.USERS_DELETE]}>
                        <Button variant="outline" size="sm" onClick={() => openDeleteDialog(user)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AuthGuard>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex items-center justify-center">
              <PaginationControls page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name *</Label>
                  <Input
                    id="editFirstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name *</Label>
                  <Input
                    id="editLastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMobile">Mobile Number</Label>
                <Input
                  id="editMobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPassword">New Password (leave blank to keep current)</Label>
                <Input
                  id="editPassword"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password or leave blank"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role *</Label>
                <Select value={formData.roleId} onValueChange={(value) => setFormData({ ...formData, roleId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name.replace(/_/g, " ")}
                        {role.description && <span className="text-xs text-gray-500 ml-2">- {role.description}</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update User</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}? This action cannot
                be undone and will remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete User
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthGuard>
  )
}
