"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, User } from "lucide-react"

interface State {
  id: string
  name: string
}
interface City {
  id: string
  name: string
  stateId?: string
}
interface Brand {
  id: string
  name: string
}

// helpers
const normalizeUrl = (raw: string) => {
  const v = (raw || "").trim()
  if (!v) return ""
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v}`
}
const looksLikeUrl = (v: string) => {
  if (!v) return true
  try {
    new URL(normalizeUrl(v))
    return true
  } catch {
    return false
  }
}

type Gender = "MALE" | "FEMALE" | "OTHER"

export default function EditMemberPage() {
  const params = useParams()
  const router = useRouter()

  const [states, setStates] = useState<State[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "MALE" as Gender,
    dob: "",
    mobile: "",
    email: "",
    address: "",
    stateId: "",
    cityId: "",
    education: "",
    experienceYears: 0,
    notes: "",
    photoUrl: "",
    brandId: "",

    companyName: "",
    companyWebsite: "",
    companyInstagram: "",
    companyYoutube: "",
    companyFacebook: "",
    companyLinkedin: "",
  })

  // Fetch base data + member
  useEffect(() => {
    async function init() {
      try {
        await Promise.all([fetchStates(), fetchBrands()])
        if (params?.id) {
          await fetchMember(params.id as string)
        }
      } finally {
        setLoading(false)
      }
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id])

  // Fetch cities when state changes
  useEffect(() => {
    if (formData.stateId) {
      fetchCities(formData.stateId)
    } else {
      setCities([])
      setFormData((prev) => ({ ...prev, cityId: "" }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.stateId])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required"
    if (!formData.stateId) newErrors.stateId = "State is required"
    if (!formData.cityId) newErrors.cityId = "City is required"

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }
    if (formData.mobile && !/^\+?[\d\s-]+$/.test(formData.mobile)) {
      newErrors.mobile = "Invalid mobile number format"
    }

    // URL-ish checks (optional fields)
    const urlFields = [
      "companyWebsite",
      "companyInstagram",
      "companyYoutube",
      "companyFacebook",
      "companyLinkedin",
      "photoUrl",
    ] as const
    urlFields.forEach((f) => {
      const val = (formData as any)[f]
      if (val && !looksLikeUrl(val)) newErrors[f] = "Enter a valid URL"
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function fetchMember(id: string) {
    try {
      const res = await fetch(`/api/members/${id}`)
      if (!res.ok) throw new Error("Failed to load member")

      const data = await res.json()
      // If we already have states loaded, fetch cities for the member's state
      if (data.stateId) {
        await fetchCities(data.stateId)
      }

      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        gender: (data.gender || "MALE") as Gender,
        dob: data.dob ? new Date(data.dob).toISOString().split("T")[0] : "",
        mobile: data.mobile || "",
        email: data.email || "",
        address: data.address || "",
        stateId: data.stateId || "",
        cityId: data.cityId || "",
        education: data.education || "",
        experienceYears: data.experienceYears || 0,
        notes: data.notes || "",
        photoUrl: data.photoUrl || "",
        brandId: data.brandId || "",

        companyName: data.companyName || "",
        companyWebsite: data.companyWebsite || "",
        companyInstagram: data.companyInstagram || "",
        companyYoutube: data.companyYoutube || "",
        companyFacebook: data.companyFacebook || "",
        companyLinkedin: data.companyLinkedin || "",
      })
    } catch (e) {
      console.error("[v0] Error fetching member:", e)
      router.push("/members")
    }
  }

  async function fetchStates() {
    try {
      const res = await fetch("/api/states")
      const data = await res.json()
      setStates(data.states || [])
    } catch (e) {
      console.error("[v0] Error fetching states:", e)
    }
  }

  async function fetchCities(stateId: string) {
    try {
      const res = await fetch(`/api/cities?stateId=${stateId}`)
      const data = await res.json()
      setCities(data.cities || [])
    } catch (e) {
      console.error("[v0] Error fetching cities:", e)
    }
  }

  async function fetchBrands() {
    try {
      const res = await fetch("/api/brands")
      const data = await res.json()
      setBrands(data.brands || [])
    } catch (e) {
      console.error("[v0] Error fetching brands:", e)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSaving(true)
    try {
      const id = params?.id as string
      const response = await fetch(`/api/members/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          email: formData.email || null,
          address: formData.address || null,
          experienceYears: formData.experienceYears || null,
          brandId: formData.brandId || null,
          dob: formData.dob || null,

          photoUrl: normalizeUrl(formData.photoUrl),
          companyWebsite: normalizeUrl(formData.companyWebsite),
          companyInstagram: normalizeUrl(formData.companyInstagram),
          companyYoutube: normalizeUrl(formData.companyYoutube),
          companyFacebook: normalizeUrl(formData.companyFacebook),
          companyLinkedin: normalizeUrl(formData.companyLinkedin),
        }),
      })

      if (response.ok) {
        router.push(`/members/${id}`)
      } else {
        const error = await response.json().catch(() => ({}))
        setErrors((prev) => ({ ...prev, submit: error.error || "Failed to update member" }))
      }
    } catch (error) {
      console.error("[v0] Error updating member:", error)
      setErrors((prev) => ({ ...prev, submit: "An error occurred. Please try again." }))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={["member.edit"]}>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="h-96 bg-gray-200 rounded" />
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredPermissions={["member.edit"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/members">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Members
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Member</h1>
            <p className="text-gray-600 mt-2">Update member information and details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update the member&apos;s personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    placeholder="Enter first name"
                  />
                  {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    placeholder="Enter last name"
                  />
                  {errors.lastName && <p className="text-sm text-red-600">{errors.lastName}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleInputChange("dob", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photoUrl">Photo URL</Label>
                  <Input
                    id="photoUrl"
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => handleInputChange("photoUrl", e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Contact details and location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => handleInputChange("mobile", e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.mobile && <p className="text-sm text-red-600">{errors.mobile}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="member@example.com"
                  />
                  {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Full address"
                  rows={2}
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

          {/* NEW: Company Information (after Contact Information) */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Optional employer or business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder="e.g., Thunder Lanes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Website</Label>
                  <Input
                    id="companyWebsite"
                    type="url"
                    value={formData.companyWebsite}
                    onChange={(e) => handleInputChange("companyWebsite", e.target.value)}
                    placeholder="https://example.com"
                  />
                  {errors.companyWebsite && <p className="text-sm text-red-600">{errors.companyWebsite}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyInstagram">Instagram</Label>
                  <Input
                    id="companyInstagram"
                    type="url"
                    value={formData.companyInstagram}
                    onChange={(e) => handleInputChange("companyInstagram", e.target.value)}
                    placeholder="https://instagram.com/yourhandle"
                  />
                  {errors.companyInstagram && <p className="text-sm text-red-600">{errors.companyInstagram}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyYoutube">YouTube</Label>
                  <Input
                    id="companyYoutube"
                    type="url"
                    value={formData.companyYoutube}
                    onChange={(e) => handleInputChange("companyYoutube", e.target.value)}
                    placeholder="https://youtube.com/@yourchannel"
                  />
                  {errors.companyYoutube && <p className="text-sm text-red-600">{errors.companyYoutube}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyFacebook">Facebook</Label>
                  <Input
                    id="companyFacebook"
                    type="url"
                    value={formData.companyFacebook}
                    onChange={(e) => handleInputChange("companyFacebook", e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                  />
                  {errors.companyFacebook && <p className="text-sm text-red-600">{errors.companyFacebook}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyLinkedin">LinkedIn</Label>
                  <Input
                    id="companyLinkedin"
                    type="url"
                    value={formData.companyLinkedin}
                    onChange={(e) => handleInputChange("companyLinkedin", e.target.value)}
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                  {errors.companyLinkedin && <p className="text-sm text-red-600">{errors.companyLinkedin}</p>}
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Education, experience, and brand affiliation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    value={formData.education}
                    onChange={(e) => handleInputChange("education", e.target.value)}
                    placeholder="Education level"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Experience (Years)</Label>
                  <Input
                    id="experienceYears"
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={(e) =>
                      handleInputChange("experienceYears", Number.parseInt(e.target.value || "0", 10) || 0)
                    }
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand (Optional)</Label>
                  <Select
                    value={formData.brandId || "none"}
                    onValueChange={(value) => handleInputChange("brandId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Brand</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Additional notes about the member"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {errors.submit && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{errors.submit}</div>}

          <div className="flex justify-end gap-4">
            <Link href={`/members/${params?.id as string}`}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AuthGuard>
  )
}
