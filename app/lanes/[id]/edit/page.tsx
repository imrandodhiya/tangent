"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Lane {
  id: string
  laneNo: number
  venueName?: string
  isActive: boolean
  notes?: string
}

export default function EditLanePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formData, setFormData] = useState({
    laneNo: "",
    venueName: "",
    isActive: true,
    notes: "",
  })

  useEffect(() => {
    fetchLane()
  }, [params.id])

  const fetchLane = async () => {
    try {
      const response = await fetch(`/api/lanes/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch lane")

      const lane: Lane = await response.json()
      setFormData({
        laneNo: lane.laneNo.toString(),
        venueName: lane.venueName || "",
        isActive: lane.isActive,
        notes: lane.notes || "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load lane",
        variant: "destructive",
      })
      router.push("/lanes")
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/lanes/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          laneNo: Number.parseInt(formData.laneNo),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update lane")
      }

      toast({
        title: "Success",
        description: "Lane updated successfully",
      })

      router.push("/lanes")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <AuthGuard requiredPermissions={[PERMISSIONS.SYSTEM_SETTINGS]}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/lanes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lanes
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Lane</h1>
            <p className="text-gray-600 dark:text-gray-400">Update lane information</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Lane Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="laneNo">Lane Number</Label>
                <Input
                  id="laneNo"
                  type="number"
                  value={formData.laneNo}
                  onChange={(e) => setFormData({ ...formData, laneNo: e.target.value })}
                  placeholder="Enter lane number"
                  min="1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="venueName">Venue Name (Optional)</Label>
                <Input
                  id="venueName"
                  value={formData.venueName}
                  onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                  placeholder="Enter venue name"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter any notes about this lane"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Updating..." : "Update Lane"}
                </Button>
                <Link href="/lanes">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  )
}
