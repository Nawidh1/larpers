import { Header } from "@/components/dashboard/header"
import { StatCard } from "@/components/dashboard/stat-card"
import { CropGrowthChart } from "@/components/dashboard/charts/crop-growth-chart"
import { IncomeChart } from "@/components/dashboard/charts/income-chart"
import { FieldDetailsCard } from "@/components/dashboard/field-details-card"
import { Sprout, Euro, Sun } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Crops" value="24 Fields" icon={<Sprout size={32} className="text-agri-green" />} />
          <StatCard
            title="Revenue"
            value="€15,200"
            icon={<Euro size={32} className="text-agri-blue" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatCard title="Climate Status" value="28°C" icon={<Sun size={32} className="text-agri-yellow" />} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CropGrowthChart />
          <IncomeChart />
        </div>

        {/* Field Details */}
        <FieldDetailsCard name="Tomato Field Details" />
      </div>
    </div>
  )
}
