"use client"

import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Database } from "lucide-react"
import { UserManagement } from "@/components/dashboard/user-management"
import { SeedDataButton } from "@/components/dashboard/seed-data-button"
import { ProfileSettings } from "@/components/dashboard/profile-settings"
import { NotificationSettings } from "@/components/dashboard/notification-settings"
import { SecuritySettings } from "@/components/dashboard/security-settings"

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 max-w-3xl">
        {/* Profile Settings */}
        <ProfileSettings />

        {/* Notification Settings */}
        <NotificationSettings />

        {/* Database Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={20} />
              Supabase Connection
            </CardTitle>
            <CardDescription>Configure your database connection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Setup Instructions:</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Create a Supabase project at supabase.com</li>
                <li>Run the SQL scripts in /scripts folder to create tables</li>
                <li>Add environment variables to your project</li>
                <li>Enable Row Level Security for data protection</li>
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
              Configure these values as environment variables in your deployment settings.
            </p>
          </CardContent>
        </Card>

        {/* Security */}
        <SecuritySettings />

        {/* Test Data Management */}
        <SeedDataButton />

        {/* User Management - Admin Only */}
        <UserManagement />
      </div>
    </div>
  )
}
