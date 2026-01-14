"use client"

import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { User, Bell, Shield, Database } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Settings" />

      <div className="flex-1 p-6 space-y-6 max-w-3xl">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} />
              Profile Settings
            </CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" defaultValue="Niece Hisan" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="niece@agritech.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farmName">Farm Name</Label>
              <Input id="farmName" defaultValue="Green Valley Farm" />
            </div>
            <Button className="bg-agri-green hover:bg-agri-green-dark text-white">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={20} />
              Notifications
            </CardTitle>
            <CardDescription>Configure how you receive updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive daily summaries via email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Climate Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified about weather changes</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Crop Health Alerts</p>
                <p className="text-sm text-muted-foreground">Notifications when crops need attention</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

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
              <Input id="supabaseUrl" placeholder="https://your-project.supabase.co" disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supabaseKey">Anon Key</Label>
              <Input id="supabaseKey" type="password" placeholder="Your Supabase anon key" disabled />
            </div>
            <p className="text-sm text-muted-foreground">
              Configure these values as environment variables in your deployment settings.
            </p>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield size={20} />
              Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline">Change Password</Button>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
