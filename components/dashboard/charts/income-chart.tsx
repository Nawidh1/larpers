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
  }, [])
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Income per Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Income per Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No income data available. Add income transactions to see the chart.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Income per Month</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value) => [`€${value}`, "Income"]}
              />
              <Bar dataKey="income" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
