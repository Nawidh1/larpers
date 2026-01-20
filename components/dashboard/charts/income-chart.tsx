"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

interface IncomeData {
  month: string
  income: number
}

export function IncomeChart() {
  const [data, setData] = useState<IncomeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchIncomeData() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        // Get income transactions
        const { data: transactions } = await supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .eq("type", "income")
          .eq("status", "completed")
          .order("date", { ascending: true })

        if (transactions) {
          // Group by month
          const monthlyData: Record<string, number> = {}
          transactions.forEach((t) => {
            const date = new Date(t.date)
            const monthKey = date.toLocaleDateString("en-US", { month: "short" })
            monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(t.amount)
          })

          const chartData = Object.entries(monthlyData)
            .map(([month, income]) => ({
              month,
              income: Math.round(income),
            }))
            .slice(-8) // Last 8 months

          setData(chartData.length > 0 ? chartData : [])
        }
      } catch (err) {
        console.error("Error fetching income data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchIncomeData()

    // Listen for custom event when transaction is added/updated/deleted
    const handleTransactionChange = () => {
      fetchIncomeData()
    }
    window.addEventListener("transaction-changed", handleTransactionChange)

    return () => {
      window.removeEventListener("transaction-changed", handleTransactionChange)
    }
  }, [])
  // Calculate total income for display
  const totalIncome = data.length > 0 ? data.reduce((sum, d) => sum + d.income, 0) : 0
  const avgIncome = data.length > 0 ? Math.round(totalIncome / data.length) : 0

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Income per Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2563eb] border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Income per Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <line x1="12" x2="12" y1="2" y2="22" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <p className="text-sm font-medium text-foreground">No income data available</p>
              <p className="text-xs text-muted-foreground">Add income transactions to see the chart</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Income per Month</CardTitle>
          {data.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#2563eb]" />
              <span className="text-xs font-medium text-muted-foreground">
                Avg: €{avgIncome.toLocaleString("nl-NL")}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 15, right: 15, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e5e7eb"
                strokeOpacity={0.5}
                className="stroke-muted"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                interval={0}
                padding={{ left: 5, right: 5 }}
                className="text-xs"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af", fontWeight: 500 }}
                width={50}
                tickFormatter={(value) => {
                  if (value >= 1000) return `€${(value / 1000).toFixed(1)}k`
                  return `€${value}`
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  padding: "8px 12px",
                }}
                labelStyle={{
                  color: "#111827",
                  fontWeight: 600,
                  fontSize: "13px",
                  marginBottom: "4px",
                }}
                itemStyle={{
                  color: "#2563eb",
                  fontWeight: 500,
                  fontSize: "13px",
                }}
                formatter={(value: number) => [
                  `€${value.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  "Income",
                ]}
                cursor={{ fill: "#2563eb", fillOpacity: 0.1 }}
              />
              <Bar
                dataKey="income"
                fill="url(#incomeGradient)"
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
