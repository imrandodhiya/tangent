"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface State {
  id: string
  name: string
}

interface City {
  id: string
  name: string
  stateId: string
  pincode?: string
  isActive: boolean
  isDefault: boolean
}

export default function EditCityPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [states, setStates] = useState<State[]>([])
  const [formData, setFormData] = useState({
    name: "",
    stateId: "",
    pincode: "",
    isActive: true,
    isDefault: false,
  })

  useEffect(() => {
    fetchStates()
    fetchCity()
  }, [params.id])

  const fetchStates = async () => {
    try {
      const response = await fetch("/api/states")
      if (response.ok) {
        const data = await response.json()
        setStates(data.states || [])
      }
    } catch (error) {
      console.error("Error fetching states:", error)
    }
  }

  const fetchCity = async () => {
    try {
      const response = await fetch(`/api/cities/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch city")

      const city: City = await response.json()
      setFormData({
        name: city.name,
        stateId: city.stateId,
        pincode: city.pincode || "",
        isActive: city.isActive,
        isDefault: city.isDefault,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load city",
        variant: "destructive",
      })
      router.push("/cities")
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/cities/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update city")
      }

      toast({
        title: "Success",
        description: "City updated successfully",
      })

      router.push("/cities")
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
          <Link href="/cities">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Cities
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit City</h1>
            <p className="text-gray-600 dark:text-gray-400">Update city information</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>City Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">City Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter city name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Select
                  value={formData.stateId}
                  onValueChange={(value) => setFormData({ ...formData, stateId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pincode">Pincode (Optional)</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="Enter pincode"
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

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked as boolean })}
                />
                <Label htmlFor="isDefault">Set as default city for this state</Label>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Updating..." : "Update City"}
                </Button>
                <Link href="/cities">
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
