"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

interface BalanceData {
  month: string
  balance: number
}

export function FinanceChart() {
  const [data, setData] = useState<BalanceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBalanceData() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data: transactions } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("date", { ascending: true })

        if (transactions) {
          // Calculate running balance
          let balance = 0
          const monthlyData: Record<string, number> = {}
          transactions.forEach((t) => {
            balance += Number(t.amount)
            const date = new Date(t.date)
            const monthKey = date.toLocaleDateString("en-US", { month: "short" })
            monthlyData[monthKey] = balance
          })

          const chartData = Object.entries(monthlyData)
            .map(([month, balance]) => ({
              month,
              balance: Math.round(balance),
            }))
            .slice(-8) // Last 8 months

          setData(chartData.length > 0 ? chartData : [])
        }
      } catch (err) {
        console.error("Error fetching balance data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchBalanceData()

    // Listen for custom event when transaction is added/updated/deleted
    const handleTransactionChange = () => {
      fetchBalanceData()
    }
    window.addEventListener("transaction-changed", handleTransactionChange)

    return () => {
      window.removeEventListener("transaction-changed", handleTransactionChange)
    }
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Balance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground" suppressHydrationWarning>Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Balance Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground" suppressHydrationWarning>
            No balance data available. Add transactions to see the chart.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Balance Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]" suppressHydrationWarning>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                formatter={(value) => `€${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value) => [`€${value}`, "Balance"]}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#2563eb"
                strokeWidth={2}
                dot={{ fill: "#2563eb", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
