"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AuthGuard } from "@/components/auth/auth-guard"
import { ArrowLeft, Save } from "lucide-react"

interface State {
  id: string
  name: string
}

interface City {
  id: string
  name: string
  stateId: string
}
type ImageField = "logoUrl" | "bannerUrl" | "tshirtUrl"
export default function CreateBrandPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    stateId: "",
    cityId: "",
    logoUrl: "",
    bannerUrl: "",
    tshirtUrl: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#EF4444",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    isActive: true,
  })

  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const [uploading, setUploading] = useState<Record<ImageField, boolean>>({
    logoUrl: false,
    bannerUrl: false,
    tshirtUrl: false,
  })

  const [previews, setPreviews] = useState<Record<ImageField, string>>({
    logoUrl: "",
    bannerUrl: "",
    tshirtUrl: "",
  })

  useEffect(() => {
    fetchStates()
  }, [])

  useEffect(() => {
    if (formData.stateId) {
      fetchCities(formData.stateId)
    } else {
      setCities([])
      setFormData((prev) => ({ ...prev, cityId: "" }))
    }
  }, [formData.stateId])

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

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  // Upload helper: POST image file -> /api/uploads, returns { url } // NEW
  const uploadImage = async (file: File) => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/uploads", {
      method: "POST",
      body: fd,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || "Upload failed")
    }
    const data = await res.json()
    return data.url as string
  }

  // Called when user chooses a file for logo/banner/tshirt // NEW
  const handleImagePick = async (field: ImageField, file?: File | null) => {
    if (!file) return
    // basic type/size gate (e.g., <= 5MB)
    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, [field]: "Please select an image file" }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [field]: "Max file size is 5 MB" }))
      return
    }

    // local preview
    const objectUrl = URL.createObjectURL(file)
    setPreviews((p) => ({ ...p, [field]: objectUrl }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
    setUploading((u) => ({ ...u, [field]: true }))

    try {
      const url = await uploadImage(file)
      setFormData((prev) => ({ ...prev, [field]: url }))
    } catch (e: any) {
      setErrors((prev) => ({ ...prev, [field]: e.message || "Upload failed" }))
    } finally {
      setUploading((u) => ({ ...u, [field]: false }))
      // revoke preview object URL after a bit to avoid GC killing preview too soon
      setTimeout(() => URL.revokeObjectURL(objectUrl), 15_000)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = "Brand name is required"
    if (!formData.stateId) newErrors.stateId = "State is required"
    if (!formData.cityId) newErrors.cityId = "City is required"

    if (formData.contactEmail && !/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = "Invalid email format"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    // avoid submitting while any image is still uploading
    const someUploading = Object.values(uploading).some(Boolean)
    if (someUploading) {
      setErrors((prev) => ({ ...prev, submit: "Please wait for images to finish uploading." }))
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const brand = await response.json()
        router.push(`/brands/${brand.id}`)
      } else {
        const error = await response.json()
        setErrors({ submit: error.error || "Failed to create brand" })
      }
    } catch (error) {
      setErrors({ submit: "An error occurred. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requiredPermissions={["brand.create"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/brands">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Brands
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Brand</h1>
            <p className="text-gray-600 mt-2">Add a new bowling brand or organization</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Brand name, description, and location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter brand name"
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Brand description (optional)"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select value={formData.stateId} onValueChange={(value) => handleInputChange("stateId", value)}>
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
                  {errors.stateId && <p className="text-sm text-red-600">{errors.stateId}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Select value={formData.cityId} onValueChange={(value) => handleInputChange("cityId", value)}>
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
                  {errors.cityId && <p className="text-sm text-red-600">{errors.cityId}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Brand Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Choose primary and secondary colors for the brand</CardDescription>
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
                      onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange("primaryColor", e.target.value)}
                      placeholder="#3B82F6"
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
                      onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => handleInputChange("secondaryColor", e.target.value)}
                      placeholder="#EF4444"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Brand contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                    placeholder="Contact person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    placeholder="contact@brand.com"
                  />
                  {errors.contactEmail && <p className="text-sm text-red-600">{errors.contactEmail}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-sm text-gray-600">Enable or disable this brand</p>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {errors.submit && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{errors.submit}</div>}

          <div className="flex justify-end gap-4">
            <Link href="/brands">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>Creating...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Brand
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthGuard>
  )
}
