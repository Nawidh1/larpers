import { createClient } from "./server"
import { createClient as createBrowserClient } from "./client"
import type { BankAccount } from "./types"

/**
 * Get all bank accounts for current user (server-side)
 */
export async function getBankAccounts() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      // Table might not exist yet - return empty array
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn("Bank accounts table does not exist yet. Run the SQL setup script.")
        return []
      }
      console.error("Error fetching bank accounts:", error)
      return []
    }

    return (data as BankAccount[]) || []
  } catch (err) {
    console.error("Error in getBankAccounts:", err)
    return []
  }
}

/**
 * Get all bank accounts for current user (client-side)
 */
export async function getBankAccountsClient() {
  try {
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      // Table might not exist yet - return empty array
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn("Bank accounts table does not exist yet. Run the SQL setup script.")
        return []
      }
      console.error("Error fetching bank accounts:", error)
      return []
    }

    return (data as BankAccount[]) || []
  } catch (err) {
    console.error("Error in getBankAccountsClient:", err)
    return []
  }
}

/**
 * Get total balance from all active bank accounts (server-side)
 */
export async function getTotalBankBalance() {
  const accounts = await getBankAccounts()
  return accounts.reduce((sum, account) => sum + Number(account.balance), 0)
}

/**
 * Sync bank account transactions (client-side)
 */
export async function syncBankAccount(accountId: string) {
  try {
    const response = await fetch("/api/banking/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Sync failed")
    }

    return await response.json()
  } catch (error: any) {
    console.error("Error syncing account:", error)
    throw error
  }
}
