import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { FieldDetailsCard } from "@/components/dashboard/field-details-card"
import { DroughtWarning } from "@/components/dashboard/drought-warning"
import { SeedDataButton } from "@/components/dashboard/seed-data-button"
import { ChartsWrapper } from "@/components/dashboard/charts-wrapper"
import { Sprout, Euro, Sun } from "lucide-react"
import { getCropCount, getTotalRevenue, getLatestClimateData, detectDroughtWarning } from "@/lib/supabase/queries"

export default async function DashboardPage() {
  const [cropCount, revenue, latestClimate, droughtWarning] = await Promise.all([
    getCropCount(),
    getTotalRevenue(),
    getLatestClimateData(),
    detectDroughtWarning(),
  ])

  const temperature = latestClimate?.temperature ? `${Math.round(Number(latestClimate.temperature))}°C` : "N/A"
  const revenueFormatted = `€${revenue.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Seed Data Button - Only show if no data */}
        {cropCount === 0 && <SeedDataButton />}

        {/* Drought Warning */}
        {droughtWarning && <DroughtWarning warning={droughtWarning} />}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          <StatCard
            title="Total Crops"
            value={`${cropCount} ${cropCount === 1 ? "Field" : "Fields"}`}
            icon={<Sprout size={32} className="text-agri-green" />}
          />
          <StatCard
            title="Revenue"
            value={revenueFormatted}
            icon={<Euro size={32} className="text-agri-blue" />}
          />
          <StatCard title="Climate Status" value={temperature} icon={<Sun size={32} className="text-agri-yellow" />} />
        </div>

        {/* Charts Row */}
        <ChartsWrapper />

        {/* Field Details */}
        <FieldDetailsCard name="Field Details" />
      </div>
    </div>
  )
}
