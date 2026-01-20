"use client"

import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Database } from "lucide-react"
import { UserManagement } from "@/components/dashboard/user-management"
import { ProfileSettings } from "@/components/dashboard/profile-settings"
import { NotificationSettings } from "@/components/dashboard/notification-settings"
import { SecuritySettings } from "@/components/dashboard/security-settings"

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full" suppressHydrationWarning>
      <Header title="Settings" />

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-auto max-w-4xl mx-auto w-full" suppressHydrationWarning>
        {/* Profile Settings */}
        <ProfileSettings />

        {/* Notification Settings */}
        <NotificationSettings />

        {/* Database Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Database size={20} className="text-agri-green" />
              Supabase Verbinding
            </CardTitle>
            <CardDescription>Configureer je database verbinding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg border border-border">
              <p className="text-sm font-medium mb-2">Setup Instructies:</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Maak een Supabase project aan op supabase.com</li>
                <li>Voer de SQL scripts uit in de /scripts folder om tabellen aan te maken</li>
                <li>Voeg environment variabelen toe aan je project</li>
                <li>Activeer Row Level Security voor gegevensbescherming</li>
              </ol>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabaseUrl">Supabase URL</Label>
              <Input
                id="supabaseUrl"
                placeholder="https://your-project.supabase.co"
                value={process.env.NEXT_PUBLIC_SUPABASE_URL || ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabaseKey">Anon Key</Label>
              <Input
                id="supabaseKey"
                type="password"
                placeholder="Your Supabase anon key"
                value={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "••••••••" : ""}
                disabled
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Configureer deze waarden als environment variabelen in je deployment instellingen.
            </p>
          </CardContent>
        </Card>

        {/* Security */}
        <SecuritySettings />

        {/* User Management - Admin Only */}
        <UserManagement />
      </div>
    </div>
  )
}
