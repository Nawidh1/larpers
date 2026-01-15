"use client"

import dynamic from "next/dynamic"

// Lazy load heavy chart components for better performance on slow connections
const CropGrowthChart = dynamic(
  () => import("@/components/dashboard/charts/crop-growth-chart").then((mod) => ({ default: mod.CropGrowthChart })),
  {
    loading: () => <div className="h-[300px] flex items-center justify-center text-muted-foreground">Chart laden...</div>,
    ssr: false,
  }
)

const IncomeChart = dynamic(
  () => import("@/components/dashboard/charts/income-chart").then((mod) => ({ default: mod.IncomeChart })),
  {
    loading: () => <div className="h-[300px] flex items-center justify-center text-muted-foreground">Chart laden...</div>,
    ssr: false,
  }
)

export function ChartsWrapper() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      <CropGrowthChart />
      <IncomeChart />
    </div>
  )
}
