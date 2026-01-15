import { createClient } from "./server"

export type UserRole = "farmer" | "auditor" | "admin"

/**
 * Get the current user's role (server-side)
 */
export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  return (profile?.role as UserRole) || "farmer"
}

/**
 * Check if user has write permissions (server-side)
 */
export async function canWrite(): Promise<boolean> {
  const role = await getUserRole()
  return role === "farmer" || role === "admin"
}

/**
 * Check if user has admin permissions (server-side)
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getUserRole()
  return role === "admin"
}

/**
 * Check if user is auditor (read-only) (server-side)
 */
export async function isAuditor(): Promise<boolean> {
  const role = await getUserRole()
  return role === "auditor"
}
