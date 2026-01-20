"use client"

import dynamic from "next/dynamic"

// Lazy load heavy chart components for better performance on slow connections
const TemperatureChart = dynamic(
  () => import("@/components/dashboard/charts/temperature-chart").then((mod) => ({ default: mod.TemperatureChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-agri-yellow border-t-transparent" />
          <p className="text-sm text-muted-foreground">Temperatuur chart laden...</p>
        </div>
      </div>
    ),
  }
)

const RainfallChart = dynamic(
  () => import("@/components/dashboard/charts/rainfall-chart").then((mod) => ({ default: mod.RainfallChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-agri-blue border-t-transparent" />
          <p className="text-sm text-muted-foreground">Neerslag chart laden...</p>
        </div>
      </div>
    ),
  }
)

const ClimateTimelineChart = dynamic(
  () => import("@/components/dashboard/charts/climate-timeline-chart").then((mod) => ({ default: mod.ClimateTimelineChart })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-agri-green border-t-transparent" />
          <p className="text-sm text-muted-foreground">Klimaat overzicht laden...</p>
        </div>
      </div>
    ),
  }
)

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function ClimateChartsWrapper() {
  return (
    <>
      {/* D3.js Timeline Chart - Last 30 Days */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Klimaat Overzicht</CardTitle>
          <CardDescription>Bekijk het klimaat over de afgelopen 30 dagen</CardDescription>
        </CardHeader>
        <CardContent>
          <ClimateTimelineChart />
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <TemperatureChart />
        <RainfallChart />
      </div>
    </>
  )
}
