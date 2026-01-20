"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CloudRain } from "lucide-react"
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
            const monthKey = date.toLocaleDateString("nl-NL", { month: "short" })
            if (c.rainfall_mm) {
              monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(c.rainfall_mm)
            }
          })

          const chartData = Object.entries(monthlyData)
            .map(([month, rainfall]) => ({
              month: month.charAt(0).toUpperCase() + month.slice(1),
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
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CloudRain className="h-5 w-5 text-blue-500" />
            Neerslag Overzicht
          </CardTitle>
          <CardDescription>Totale neerslag per maand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm" suppressHydrationWarning>
            Neerslagdata laden...
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
            <CloudRain className="h-5 w-5 text-blue-500" />
            Neerslag Overzicht
          </CardTitle>
          <CardDescription>Totale neerslag per maand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm" suppressHydrationWarning>
            Geen neerslagdata beschikbaar. Voeg klimaatrecords toe om de grafiek te zien.
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate max rainfall for gradient intensity
  const maxRainfall = Math.max(...data.map((d) => d.rainfall), 1)
  
  // Create gradient colors based on rainfall amount
  const getBarColor = (value: number) => {
    const intensity = value / maxRainfall
    if (intensity > 0.7) return "url(#rainfallGradientHigh)"
    if (intensity > 0.4) return "url(#rainfallGradientMedium)"
    return "url(#rainfallGradientLow)"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CloudRain className="h-5 w-5 text-blue-500" />
          Neerslag Overzicht
        </CardTitle>
        <CardDescription>Totale neerslag per maand</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]" suppressHydrationWarning>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 15, right: 15, left: -15, bottom: 5 }}>
              <defs>
                <linearGradient id="rainfallGradientLow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="rainfallGradientMedium" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                </linearGradient>
                <linearGradient id="rainfallGradientHigh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }} 
                padding={{ left: 10, right: 10 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "#6b7280", fontWeight: 500 }}
                tickFormatter={(value) => `${value}mm`}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  padding: "8px 12px",
                }}
                formatter={(value: number) => [`${value}mm`, "Neerslag"]}
                labelStyle={{ fontWeight: 600, marginBottom: 4, color: "#1f2937" }}
                cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
              />
              <Bar 
                dataKey="rainfall" 
                radius={[8, 8, 0, 0]}
                barSize={35}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.rainfall)}
                    style={{
                      filter: "drop-shadow(0 2px 4px rgba(37, 99, 235, 0.3))",
                      transition: "all 0.2s ease",
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
