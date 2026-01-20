"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/dashboard/stat-card"
import { Euro } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function RevenueCard() {
  const [revenue, setRevenue] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRevenue = async () => {
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

      // Get all income transactions
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount, status")
        .eq("user_id", user.id)
        .eq("type", "income")
        .eq("status", "completed")

      if (error) {
        console.error("Error fetching revenue:", error)
        setRevenue(0)
      } else {
        // Calculate total revenue from income transactions
        const totalRevenue = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
        setRevenue(totalRevenue)
      }
    } catch (err) {
      console.error("Error fetching revenue:", err)
      setRevenue(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRevenue()

    // Refresh revenue when window gains focus
    const handleFocus = () => {
      fetchRevenue()
    }
    window.addEventListener("focus", handleFocus)

    // Listen for custom event when transaction is added/updated/deleted
    const handleTransactionChange = () => {
      fetchRevenue()
    }
    window.addEventListener("transaction-changed", handleTransactionChange)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("transaction-changed", handleTransactionChange)
    }
  }, [])

  const revenueFormatted = revenue !== null 
    ? `€${revenue.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : loading
    ? "Laden..."
    : "€0,00"

  return (
    <StatCard
      title="Revenue"
      value={revenueFormatted}
      icon={<Euro size={32} className="text-agri-blue" />}
    />
  )
}
