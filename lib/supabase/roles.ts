import { createClient as createBrowserClient } from "./client"

export type UserRole = "farmer" | "auditor" | "admin"

/**
 * Get the current user's role (client-side)
 */
export async function getUserRoleClient(): Promise<UserRole | null> {
  const supabase = createBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  return (profile?.role as UserRole) || "farmer"
}

/**
 * Client-side check for write permissions
 */
export async function canWriteClient(): Promise<boolean> {
  const role = await getUserRoleClient()
  return role === "farmer" || role === "admin"
}

/**
 * Client-side check for admin permissions
 */
export async function isAdminClient(): Promise<boolean> {
  const role = await getUserRoleClient()
  return role === "admin"
}

/**
 * Client-side check if user is auditor
 */
export async function isAuditorClient(): Promise<boolean> {
  const role = await getUserRoleClient()
  return role === "auditor"
}
