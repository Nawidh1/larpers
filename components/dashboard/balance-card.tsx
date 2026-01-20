"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Wallet, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function BalanceCard() {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBalance = async () => {
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

      // Get all transactions
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("amount, status")
        .eq("user_id", user.id)
        .eq("status", "completed")

      if (error) {
        console.error("Error fetching transactions:", error)
        // Try to get balance from bank accounts as fallback
        const { data: accounts } = await supabase
          .from("bank_accounts")
          .select("balance")
          .eq("user_id", user.id)
          .eq("is_active", true)

        if (accounts) {
          const bankBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance || 0), 0)
          setBalance(bankBalance)
        } else {
          setBalance(0)
        }
      } else {
        // Calculate balance from transactions
        const calculatedBalance = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
        setBalance(calculatedBalance)
      }
    } catch (err) {
      console.error("Error fetching balance:", err)
      setBalance(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBalance()

    // Refresh balance when window gains focus (user returns to tab)
    const handleFocus = () => {
      fetchBalance()
    }
    window.addEventListener("focus", handleFocus)

    // Listen for custom event when transaction is added/updated/deleted
    const handleTransactionChange = () => {
      fetchBalance()
    }
    window.addEventListener("transaction-changed", handleTransactionChange)

    return () => {
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("transaction-changed", handleTransactionChange)
    }
  }, [])

  const balanceFormatted = balance !== null 
    ? `€${balance.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "€0,00"

  return (
    <Card className="lg:col-span-2 bg-gradient-to-br from-agri-green to-green-600 text-white border-0 shadow-lg">
      <CardContent className="p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-green-100" />
              <p className="text-green-100 text-sm font-medium">Totaal Saldo</p>
              {loading && (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-100 border-t-transparent ml-2" />
              )}
            </div>
            <p className="text-4xl md:text-5xl font-bold mb-2">{balanceFormatted}</p>
            <p className="text-green-100 text-sm">
              {balance !== null && balance === 0 
                ? "Voeg transacties toe om je saldo te zien"
                : "Berekend op basis van alle transacties"}
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-white/20">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
