"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { isAdminClient, type UserRole } from "@/lib/supabase/roles"
import { Users, Shield } from "lucide-react"
import type { Profile } from "@/lib/supabase/types"

export function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      const admin = await isAdminClient()
      setIsAdmin(admin)
      if (admin) {
        fetchUsers()
      } else {
        setLoading(false)
      }
    }
    checkAdmin()
  }, [])

  async function fetchUsers() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching users:", error)
      } else {
        setUsers((data as Profile[]) || [])
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  async function updateUserRole(userId: string, newRole: UserRole) {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId)

      if (error) {
        console.error("Error updating role:", error)
        alert("Fout bij het bijwerken van de rol")
      } else {
        alert("Rol succesvol bijgewerkt")
        fetchUsers()
      }
    } catch (err) {
      console.error("Error:", err)
      alert("Fout bij het bijwerken van de rol")
    }
  }

  const getRoleBadge = (role: string) => {
    const colors: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      farmer: { variant: "default", label: "Boer" },
      auditor: { variant: "secondary", label: "Auditor" },
      admin: { variant: "outline", label: "Admin" },
    }
    const config = colors[role] || colors.farmer
    return (
      <Badge variant={config.variant} className={role === "farmer" ? "bg-agri-green text-white" : ""}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} />
            Gebruikersbeheer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground">Laden...</div>
        </CardContent>
      </Card>
    )
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Gebruikersbeheer
          </CardTitle>
          <CardDescription>Alleen beschikbaar voor administrators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground">
            Je hebt geen toegang tot deze functie. Alleen administrators kunnen gebruikersrollen beheren.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={20} />
          Gebruikersbeheer
        </CardTitle>
        <CardDescription>Beheer gebruikersrollen en toegangsrechten</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Rolbeschrijvingen:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                <strong>Boer:</strong> Volledige toegang - kan alle data bekijken, toevoegen, wijzigen en verwijderen
              </li>
              <li>
                <strong>Auditor:</strong> Alleen-lezen toegang - kan alle data bekijken maar niets wijzigen
              </li>
              <li>
                <strong>Admin:</strong> Volledige toegang + gebruikersbeheer - kan rollen toewijzen en alle data
                beheren
              </li>
            </ul>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Huidige Rol</TableHead>
                  <TableHead>Rol Wijzigen</TableHead>
                  <TableHead>Actie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Geen gebruikers gevonden
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <UserRoleRow
                      key={user.id}
                      user={user}
                      onRoleChange={(newRole) => updateUserRole(user.id, newRole)}
                      getRoleBadge={getRoleBadge}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function UserRoleRow({
  user,
  onRoleChange,
  getRoleBadge,
}: {
  user: Profile
  onRoleChange: (role: UserRole) => void
  getRoleBadge: (role: string) => JSX.Element
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role as UserRole)

  return (
    <TableRow>
      <TableCell className="font-medium">{user.full_name || "Geen naam"}</TableCell>
      <TableCell>{user.id}</TableCell>
      <TableCell>{getRoleBadge(user.role)}</TableCell>
      <TableCell>
        <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="farmer">Boer</SelectItem>
            <SelectItem value="auditor">Auditor</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        {selectedRole !== user.role && (
          <Button
            size="sm"
            onClick={() => onRoleChange(selectedRole)}
            className="bg-agri-green hover:bg-agri-green-dark text-white"
          >
            Opslaan
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}
