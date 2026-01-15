"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

interface RainfallData {
  month: string
  rainfall: number
}

export function RainfallChart() {
  const [data, setData] = useState<RainfallData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRainfallData() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        const { data: climateData } = await supabase
          .from("climate_data")
          .select("*")
          .eq("user_id", user.id)
          .order("recorded_at", { ascending: true })
          .limit(30)

        if (climateData) {
          // Group by month
          const monthlyData: Record<string, number> = {}
          climateData.forEach((c) => {
            const date = new Date(c.recorded_at)
            const monthKey = date.toLocaleDateString("en-US", { month: "short" })
            if (c.rainfall_mm) {
              monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(c.rainfall_mm)
            }
          })

          const chartData = Object.entries(monthlyData)
            .map(([month, rainfall]) => ({
              month,
              rainfall: Math.round(rainfall),
            }))
            .slice(-7) // Last 7 months

          setData(chartData.length > 0 ? chartData : [])
        }
      } catch (err) {
        console.error("Error fetching rainfall data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchRainfallData()
  }, [])
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Rainfall (mm)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] flex items-center justify-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Rainfall (mm)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[180px] flex items-center justify-center text-muted-foreground">
            No rainfall data available. Add climate records to see the chart.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Rainfall (mm)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
                formatter={(value) => [`${value}mm`, "Rainfall"]}
              />
              <Bar dataKey="rainfall" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
