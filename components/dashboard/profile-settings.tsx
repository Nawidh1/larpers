"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function ProfileSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    farmName: "",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Je bent niet ingelogd")
        setLoading(false)
        return
      }

      // Get email from auth
      const email = user.email || ""

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()

      setFormData({
        fullName: profile?.full_name || "",
        email: email,
        farmName: "", // Farm name is not stored in database yet, can be added later
      })
    } catch (err: any) {
      console.error("Error loading profile:", err)
      setError("Kon profiel niet laden")
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

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error("Error saving profile:", err)
      setError(err.message || "Kon profiel niet opslaan")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User size={20} />
            Profile Settings
          </CardTitle>
          <CardDescription>Manage your account information</CardDescription>
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
          <User size={20} />
          Profile Settings
        </CardTitle>
        <CardDescription>Manage your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="bg-agri-green/10 border-agri-green text-agri-green">
            <AlertDescription>Profiel succesvol opgeslagen!</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email kan niet worden gewijzigd</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="farmName">Farm Name</Label>
          <Input
            id="farmName"
            value={formData.farmName}
            onChange={(e) => setFormData({ ...formData, farmName: e.target.value })}
            placeholder="Your farm name"
          />
          <p className="text-xs text-muted-foreground">Optioneel - wordt lokaal opgeslagen</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-agri-green hover:bg-agri-green-dark text-white"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Opslaan...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
