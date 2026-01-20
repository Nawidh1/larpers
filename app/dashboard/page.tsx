import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { RevenueCard } from "@/components/dashboard/revenue-card"
import { FieldDetailsCard } from "@/components/dashboard/field-details-card"
import { DroughtWarning } from "@/components/dashboard/drought-warning"
import { ChartsWrapper } from "@/components/dashboard/charts-wrapper"
import { Sprout, Sun, DollarSign } from "lucide-react"
import { getCropCount, getLatestClimateData, detectDroughtWarning, getTotalBalance } from "@/lib/supabase/queries"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

export default async function DashboardPage() {
  const [cropCount, latestClimate, droughtWarning, balance] = await Promise.all([
    getCropCount(),
    getLatestClimateData(),
    detectDroughtWarning(),
    getTotalBalance(),
  ])

  const temperature = latestClimate?.temperature ? `${Math.round(Number(latestClimate.temperature))}°C` : "N/A"
  const balanceFormatted = `€${balance.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Drought Warning */}
        {droughtWarning && <DroughtWarning warning={droughtWarning} />}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Total Crops"
            value={`${cropCount} ${cropCount === 1 ? "Field" : "Fields"}`}
            icon={<Sprout size={32} className="text-agri-green" />}
          />
          <RevenueCard />
          <StatCard title="Climate Status" value={temperature} icon={<Sun size={32} className="text-agri-yellow" />} />
          <Link href="/dashboard/finance" className="block">
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-agri-green">
              <CardContent className="p-4 md:p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Balance</p>
                  <p className="text-2xl md:text-3xl font-bold text-agri-green">{balanceFormatted}</p>
                  <p className="text-xs text-muted-foreground mt-1">View Finance →</p>
                </div>
                <DollarSign size={32} className="text-agri-green" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Charts Row */}
        <ChartsWrapper />

        {/* Field Details */}
        <FieldDetailsCard name="Field Details" />
      </div>
    </div>
  )
}
