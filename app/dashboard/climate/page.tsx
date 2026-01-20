import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sun, Droplets, CloudRain, AlertTriangle, Thermometer } from "lucide-react"
import { getLatestClimateData } from "@/lib/supabase/queries"
import { ClimateChartsWrapper } from "@/components/dashboard/climate-charts-wrapper"

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
    <div className="flex flex-col h-full" suppressHydrationWarning>
      <Header title="Climate Insights" />

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-auto" suppressHydrationWarning>
        {/* Climate Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <StatCard 
            title="Huidige Temperatuur" 
            value={temperature} 
            icon={<Thermometer size={32} className="text-agri-yellow" />} 
          />
          <StatCard 
            title="Luchtvochtigheid" 
            value={humidity} 
            icon={<Droplets size={32} className="text-agri-blue" />} 
          />
          <StatCard 
            title="Neerslag" 
            value={rainfall} 
            icon={<CloudRain size={32} className="text-agri-blue" />} 
          />
        </div>

        {/* Climate Charts - Lazy loaded in client component */}
        <ClimateChartsWrapper />

        {/* Climate Advisory */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Klimaat Advies
            </CardTitle>
            <CardDescription>Belangrijke klimaatwaarschuwingen en aanbevelingen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3" suppressHydrationWarning>
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900/50">
                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold mb-1 text-amber-900 dark:text-amber-100">Regen Verwacht</p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Overweeg irrigatie aanpassingen voor verwachte regen in de komende dagen
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900/50">
                <Sun size={20} className="text-orange-600 dark:text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold mb-1 text-orange-900 dark:text-orange-100">Hoge Temperatuur Waarschuwing</p>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Temperaturen boven 30°C verwacht deze week. Zorg voor voldoende water.
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
