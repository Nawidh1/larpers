"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Shield } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function SecuritySettings() {
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  async function handleChangePassword() {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
        setError("Nieuw wachtwoord moet minimaal 6 tekens lang zijn")
        setLoading(false)
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError("Wachtwoorden komen niet overeen")
        setLoading(false)
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Je bent niet ingelogd")
        setLoading(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      setTimeout(() => {
        setChangePasswordOpen(false)
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      console.error("Error changing password:", err)
      setError(err.message || "Kon wachtwoord niet wijzigen")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield size={20} />
          Security
        </CardTitle>
        <CardDescription>Manage your account security</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Change Password</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>Enter your new password below</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-agri-green/10 border-agri-green text-agri-green">
                  <AlertDescription>Wachtwoord succesvol gewijzigd!</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Minimaal 6 tekens"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Bevestig nieuw wachtwoord"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChangePasswordOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={loading}
                className="bg-agri-green hover:bg-agri-green-dark text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wijzigen...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
          </div>
          <Switch
            checked={twoFactorEnabled}
            onCheckedChange={setTwoFactorEnabled}
            disabled
          />
          <p className="text-xs text-muted-foreground ml-2">(Binnenkort beschikbaar)</p>
        </div>
      </CardContent>
    </Card>
  )
}
