"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sprout } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface GrowthData {
  month: string
  growth: number
}

export function CropGrowthChart() {
  const [data, setData] = useState<GrowthData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGrowthData() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setLoading(false)
          return
        }

        // Get user's crops
        const { data: crops } = await supabase.from("crops").select("id").eq("user_id", user.id)
        if (!crops || crops.length === 0) {
          setLoading(false)
          return
        }

        const cropIds = crops.map((c) => c.id)

        // Get growth data
        const { data: growthData } = await supabase
          .from("crop_growth")
          .select("*")
          .in("crop_id", cropIds)
          .order("recorded_at", { ascending: true })

        if (growthData && growthData.length > 0) {
          // Group by month-year for proper sorting
          const monthlyData: Record<string, { total: number; count: number; date: Date }> = {}
          growthData.forEach((g) => {
            const date = new Date(g.recorded_at)
            // Use year-month for proper chronological sorting
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
            
            if (!monthlyData[yearMonth]) {
              monthlyData[yearMonth] = { total: 0, count: 0, date }
            }
            monthlyData[yearMonth].total += Number(g.growth_percentage || 0)
            monthlyData[yearMonth].count += 1
          })

          // Sort chronologically and take last 7 months
          const chartData = Object.entries(monthlyData)
            .sort(([a], [b]) => a.localeCompare(b)) // Sort by year-month string
            .slice(-7) // Last 7 months
            .map(([yearMonth, { total, count, date }]) => {
              const monthShort = date.toLocaleDateString("nl-NL", { month: "short" })
              return {
                month: monthShort.charAt(0).toUpperCase() + monthShort.slice(1),
                growth: Math.round(total / count),
                date: date.getTime(), // Store timestamp for sorting
              }
            })
            .sort((a, b) => a.date - b.date) // Ensure final sort by date
            .map(({ month, growth }) => ({ month, growth })) // Remove date from final data

          setData(chartData.length > 0 ? chartData : [])
        } else {
          setData([])
        }
      } catch (err) {
        console.error("Error fetching growth data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchGrowthData()
  }, [])
  // Calculate domain for Y-axis
  const minGrowth = data.length > 0 ? Math.min(...data.map((d) => d.growth)) : 0
  const maxGrowth = data.length > 0 ? Math.max(...data.map((d) => d.growth)) : 100
  const domain = [Math.max(0, minGrowth - 10), Math.min(100, maxGrowth + 10)]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sprout className="h-5 w-5 text-green-600" />
            Crop Growth
          </CardTitle>
          <CardDescription>Gemiddelde groei percentage per maand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm" suppressHydrationWarning>
            Groeidata laden...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sprout className="h-5 w-5 text-green-600" />
            Crop Growth
          </CardTitle>
          <CardDescription>Gemiddelde groei percentage per maand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm" suppressHydrationWarning>
            Geen groeidata beschikbaar. Voeg crops en groeirecords toe om de grafiek te zien.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sprout className="h-5 w-5 text-green-600" />
          Crop Growth
        </CardTitle>
        <CardDescription>Gemiddelde groei percentage per maand</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]" suppressHydrationWarning>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "#6b7280" }} 
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6b7280" }}
                domain={domain}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
                formatter={(value) => [`${value}%`, "Groei"]}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Line
                type="monotone"
                dataKey="growth"
                stroke="#2d7a3a"
                strokeWidth={2.5}
                dot={{ fill: "#2d7a3a", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#2d7a3a" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
