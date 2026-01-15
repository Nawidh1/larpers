import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { TemperatureChart } from "@/components/dashboard/charts/temperature-chart"
import { RainfallChart } from "@/components/dashboard/charts/rainfall-chart"
import { ClimateTimelineChart } from "@/components/dashboard/charts/climate-timeline-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sun, Droplets, CloudRain, AlertTriangle } from "lucide-react"
import { getLatestClimateData } from "@/lib/supabase/queries"

export default async function ClimatePage() {
  const latestClimate = await getLatestClimateData()

  const temperature = latestClimate?.temperature
    ? `${Math.round(Number(latestClimate.temperature))}°C`
    : "N/A"
  const humidity = latestClimate?.humidity ? `${Math.round(Number(latestClimate.humidity))}%` : "N/A"
  const rainfall = latestClimate?.rainfall_mm
    ? `${Math.round(Number(latestClimate.rainfall_mm))} mm`
    : "N/A"

  return (
    <div className="flex flex-col h-full">
      <Header title="Climate Insights" />

      <div className="flex-1 p-6 space-y-6">
        {/* Climate Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Current Weather" value={temperature} icon={<Sun size={32} className="text-agri-yellow" />} />
          <StatCard title="Humidity" value={humidity} icon={<Droplets size={32} className="text-agri-blue" />} />
          <StatCard title="Rainfall" value={rainfall} icon={<CloudRain size={32} className="text-agri-blue" />} />
        </div>

        {/* D3.js Timeline Chart - Last 30 Days */}
        <ClimateTimelineChart />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TemperatureChart />
          <RainfallChart />
        </div>

        {/* Climate Advisory */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle size={18} className="text-agri-yellow" />
              Climate Advisory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <AlertTriangle size={18} className="text-agri-yellow mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Rain Expected</p>
                  <p className="text-sm text-muted-foreground">
                    Consider irrigation adjustments for expected rain in the coming days
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Sun size={18} className="text-agri-yellow mt-0.5" />
                <div>
                  <p className="text-sm font-medium">High Temperature Alert</p>
                  <p className="text-sm text-muted-foreground">
                    Temperatures above 30°C expected this week. Ensure adequate watering.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
