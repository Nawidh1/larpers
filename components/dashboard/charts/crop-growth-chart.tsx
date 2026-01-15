"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

        if (growthData) {
          // Group by month
          const monthlyData: Record<string, { total: number; count: number }> = {}
          growthData.forEach((g) => {
            const date = new Date(g.recorded_at)
            const monthKey = date.toLocaleDateString("en-US", { month: "short" })
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { total: 0, count: 0 }
            }
            monthlyData[monthKey].total += Number(g.growth_percentage || 0)
            monthlyData[monthKey].count += 1
          })

          const chartData = Object.entries(monthlyData)
            .map(([month, { total, count }]) => ({
              month,
              growth: Math.round(total / count),
            }))
            .slice(-8) // Last 8 months

          setData(chartData.length > 0 ? chartData : [])
        }
      } catch (err) {
        console.error("Error fetching growth data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchGrowthData()
  }, [])
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Crop Growth</CardTitle>
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
          <CardTitle className="text-base font-medium">Crop Growth</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No growth data available. Add crops and growth records to see the chart.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Crop Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2d7a3a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2d7a3a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Area type="monotone" dataKey="growth" stroke="#2d7a3a" strokeWidth={2} fill="url(#growthGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
