"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

interface NotificationSettings {
  emailNotifications: boolean
  climateAlerts: boolean
  cropHealthAlerts: boolean
}

export function NotificationSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    climateAlerts: true,
    cropHealthAlerts: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Load from localStorage (can be extended to use database later)
      const saved = localStorage.getItem(`notification-settings-${user.id}`)
      if (saved) {
        setSettings(JSON.parse(saved))
      }
    } catch (err: any) {
      console.error("Error loading notification settings:", err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Je bent niet ingelogd")
        setSaving(false)
        return
      }

      // Save to localStorage (can be extended to use database later)
      localStorage.setItem(`notification-settings-${user.id}`, JSON.stringify(settings))

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error("Error saving notification settings:", err)
      setError(err.message || "Kon instellingen niet opslaan")
    } finally {
      setSaving(false)
    }
  }

  function updateSetting(key: keyof NotificationSettings, value: boolean) {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    // Auto-save
    handleSave()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={20} />
          Notifications
        </CardTitle>
        <CardDescription>Configure how you receive updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-agri-green/10 border-agri-green text-agri-green">
            <AlertDescription>Instellingen opgeslagen!</AlertDescription>
          </Alert>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-sm text-muted-foreground">Receive daily summaries via email</p>
          </div>
          <Switch
            checked={settings.emailNotifications}
            onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
            disabled={saving}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Climate Alerts</p>
            <p className="text-sm text-muted-foreground">Get notified about weather changes</p>
          </div>
          <Switch
            checked={settings.climateAlerts}
            onCheckedChange={(checked) => updateSetting("climateAlerts", checked)}
            disabled={saving}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Crop Health Alerts</p>
            <p className="text-sm text-muted-foreground">Notifications when crops need attention</p>
          </div>
          <Switch
            checked={settings.cropHealthAlerts}
            onCheckedChange={(checked) => updateSetting("cropHealthAlerts", checked)}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  )
}
