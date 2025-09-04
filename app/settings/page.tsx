"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AuthGuard } from "@/components/auth/auth-guard"
import { PERMISSIONS } from "@/lib/permissions"
import { Database, Shield, Bell, Palette, Plus, Save, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Setting {
  id: string
  key: string
  value: string
  category: string
  description: string | null
  type: string
  updatedAt: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, Setting[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null)
  const [formData, setFormData] = useState({
    key: "",
    value: "",
    category: "system",
    description: "",
    type: "string",
  })
  const { toast } = useToast()

  const [valueMap, setValueMap] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setValueMap(Object.fromEntries(data.system?.map((setting) => [setting.key, setting.value]) || []))
      } else {
        throw new Error("Failed to fetch settings")
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSetting = async (setting: Setting, newValue: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/settings/${setting.key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      })

      if (response.ok) {
        await fetchSettings()
        toast({
          title: "Success",
          description: "Setting updated successfully",
        })
      } else {
        throw new Error("Failed to update setting")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateSetting = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchSettings()
        setShowCreateDialog(false)
        setFormData({ key: "", value: "", category: "system", description: "", type: "string" })
        toast({
          title: "Success",
          description: "Setting created successfully",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to create setting")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteSetting = async (key: string) => {
    if (!confirm("Are you sure you want to delete this setting?")) return

    try {
      const response = await fetch(`/api/settings/${key}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchSettings()
        toast({
          title: "Success",
          description: "Setting deleted successfully",
        })
      } else {
        throw new Error("Failed to delete setting")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete setting",
        variant: "destructive",
      })
    }
  }

  const renderSettingInput = (setting: Setting) => {
    const value = valueMap[setting.key]
    const setValue = (newValue: string) => {
      setValueMap((prev) => ({ ...prev, [setting.key]: newValue }))
      handleSaveSetting(setting, newValue)
    }

    const handleSave = () => {
      if (value !== setting.value) {
        handleSaveSetting(setting, value)
      }
    }

    switch (setting.type) {
      case "boolean":
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="font-medium">{setting.key.split(".").pop()?.replace(/_/g, " ")}</Label>
              {setting.description && <p className="text-sm text-gray-600">{setting.description}</p>}
            </div>
            <Switch
              checked={value === "true"}
              onCheckedChange={(checked) => {
                const newValue = checked.toString()
                setValue(newValue)
              }}
            />
          </div>
        )

      case "number":
        return (
          <div className="space-y-2">
            <Label className="font-medium">{setting.key.split(".").pop()?.replace(/_/g, " ")}</Label>
            {setting.description && <p className="text-sm text-gray-600">{setting.description}</p>}
            <div className="flex gap-2">
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                className="flex-1"
              />
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )

      case "color":
        return (
          <div className="space-y-2">
            <Label className="font-medium">{setting.key.split(".").pop()?.replace(/_/g, " ")}</Label>
            {setting.description && <p className="text-sm text-gray-600">{setting.description}</p>}
            <div className="flex gap-2">
              <Input
                type="color"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                className="w-16 h-10 p-1 border rounded"
              />
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={handleSave}
                className="flex-1"
                placeholder="#000000"
              />
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <Label className="font-medium">{setting.key.split(".").pop()?.replace(/_/g, " ")}</Label>
            {setting.description && <p className="text-sm text-gray-600">{setting.description}</p>}
            <div className="flex gap-2">
              <Input value={value} onChange={(e) => setValue(e.target.value)} onBlur={handleSave} className="flex-1" />
              <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDeleteSetting(setting.key)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <AuthGuard requiredPermissions={[PERMISSIONS.SYSTEM_ADMIN]}>
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
    <AuthGuard requiredPermissions={[PERMISSIONS.SYSTEM_ADMIN]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings Management</h1>
            <p className="text-gray-600 mt-2">Configure system settings and preferences</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Setting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Setting</DialogTitle>
                <DialogDescription>Add a new configuration setting to the system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Setting Key</Label>
                  <Input
                    id="key"
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                    placeholder="category.setting_name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="tournament">Tournament</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="notifications">Notifications</SelectItem>
                      <SelectItem value="appearance">Appearance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="color">Color</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Default Value</Label>
                  <Input
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="Enter default value"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this setting controls"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSetting}>Create Setting</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="tournament">Tournament</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  System Configuration
                </CardTitle>
                <CardDescription>Configure system-wide settings and parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings.system?.map((setting) => (
                  <div key={setting.id}>{renderSettingInput(setting)}</div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tournament" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Settings</CardTitle>
                <CardDescription>Configure default tournament parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings.tournament?.map((setting) => (
                  <div key={setting.id}>{renderSettingInput(setting)}</div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure authentication and security policies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings.security?.map((setting) => (
                  <div key={setting.id}>{renderSettingInput(setting)}</div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-600" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure system notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings.notifications?.map((setting) => (
                  <div key={setting.id}>{renderSettingInput(setting)}</div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-600" />
                  Appearance Settings
                </CardTitle>
                <CardDescription>Customize the look and feel of the application</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settings.appearance?.map((setting) => (
                  <div key={setting.id}>{renderSettingInput(setting)}</div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}
