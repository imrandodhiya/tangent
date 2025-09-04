"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ArrowLeft, Save, Building } from "lucide-react"

interface State {
  id: string
  name: string
}

interface City {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
  description: string | null
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  website: string | null
  isActive: boolean
  stateId: string
  cityId: string
}

export default function EditBrandPage() {
  const params = useParams()
  const router = useRouter()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logoUrl: "",
    primaryColor: "",
    secondaryColor: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    isActive: true,
    stateId: "",
    cityId: "",
  })

  useEffect(() => {
    if (params.id) {
      fetchBrand(params.id as string)
      fetchStates()
    }
  }, [params.id])

  useEffect(() => {
    if (formData.stateId) {
      fetchCities(formData.stateId)
    }
  }, [formData.stateId])

  const fetchBrand = async (id: string) => {
    try {
      const response = await fetch(`/api/brands/${id}`)
      if (response.ok) {
        const data = await response.json()
        setBrand(data)
        setFormData({
          name: data.name || "",
          description: data.description || "",
          logoUrl: data.logoUrl || "",
          primaryColor: data.primaryColor || "",
          secondaryColor: data.secondaryColor || "",
          contactName: data.contactName || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          website: data.website || "",
          isActive: data.isActive,
          stateId: data.stateId || "",
          cityId: data.cityId || "",
        })
      } else {
        router.push("/brands")
      }
    } catch (error) {
      console.error("Error fetching brand:", error)
      router.push("/brands")
    } finally {
      setLoading(false)
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

  const fetchCities = async (stateId: string) => {
    try {
      const response = await fetch(`/api/cities?stateId=${stateId}`)
      const data = await response.json()
      setCities(data.cities || [])
    } catch (error) {
      console.error("Error fetching cities:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/brands/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          logoUrl: formData.logoUrl || null,
          description: formData.description || null,
          primaryColor: formData.primaryColor || null,
          secondaryColor: formData.secondaryColor || null,
          contactName: formData.contactName || null,
          contactEmail: formData.contactEmail || null,
          contactPhone: formData.contactPhone || null,
          website: formData.website || null,
        }),
      })

      if (response.ok) {
        router.push(`/brands/${params.id}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to update brand")
      }
    } catch (error) {
      console.error("Error updating brand:", error)
      alert("An error occurred while updating the brand")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={["brand.edit"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (!brand) {
    return (
      <AuthGuard requiredPermissions={["brand.edit"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Brand not found</h1>
            <Link href="/brands">
              <Button>Back to Brands</Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredPermissions={["brand.edit"]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/brands/${brand.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Brand
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Brand</h1>
            <p className="text-gray-600 mt-2">Update brand information and settings</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Update the basic brand details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter brand name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the brand"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Set the primary and secondary brand colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>Brand location information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select
                    value={formData.stateId}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, stateId: value, cityId: "" }))
                      setCities([])
                    }}
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
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Select
                    value={formData.cityId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, cityId: value }))}
                    disabled={!formData.stateId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Brand contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Contact person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="contact@brand.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Brand status and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-sm text-gray-600">Enable or disable this brand</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href={`/brands/${brand.id}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </AuthGuard>
  )
}
