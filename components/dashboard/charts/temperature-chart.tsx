"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Thermometer } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface TempData {
  month: string
  temp: number
}

export function TemperatureChart() {
  const [data, setData] = useState<TempData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTemperatureData() {
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
          const monthlyData: Record<string, { total: number; count: number }> = {}
          climateData.forEach((c) => {
            const date = new Date(c.recorded_at)
            const monthKey = date.toLocaleDateString("nl-NL", { month: "short" })
            if (!monthlyData[monthKey]) {
              monthlyData[monthKey] = { total: 0, count: 0 }
            }
            if (c.temperature) {
              monthlyData[monthKey].total += Number(c.temperature)
              monthlyData[monthKey].count += 1
            }
          })

          const chartData = Object.entries(monthlyData)
            .map(([month, { total, count }]) => ({
              month: month.charAt(0).toUpperCase() + month.slice(1),
              temp: Math.round(total / count),
            }))
            .slice(-7) // Last 7 months

          setData(chartData.length > 0 ? chartData : [])
        }
      } catch (err) {
        console.error("Error fetching temperature data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTemperatureData()
  }, [])
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-amber-500" />
            Temperatuur Overzicht
          </CardTitle>
          <CardDescription>Gemiddelde temperatuur per maand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm" suppressHydrationWarning>
            Temperatuurdata laden...
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
            <Thermometer className="h-5 w-5 text-amber-500" />
            Temperatuur Overzicht
          </CardTitle>
          <CardDescription>Gemiddelde temperatuur per maand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm" suppressHydrationWarning>
            Geen temperatuurdata beschikbaar. Voeg klimaatrecords toe om de grafiek te zien.
          </div>
        </CardContent>
      </Card>
    )
  }

  const minTemp = Math.min(...data.map((d) => d.temp))
  const maxTemp = Math.max(...data.map((d) => d.temp))
  const domain = [Math.max(0, minTemp - 5), maxTemp + 5]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-amber-500" />
          Temperatuur Overzicht
        </CardTitle>
        <CardDescription>Gemiddelde temperatuur per maand</CardDescription>
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
                tickFormatter={(value) => `${value}°C`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
                formatter={(value) => [`${value}°C`, "Temperatuur"]}
                labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              />
              <Line
                type="monotone"
                dataKey="temp"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#f59e0b" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
