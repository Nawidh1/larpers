import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("bg-card", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {trend && (
              <p className={cn("text-xs mt-1", trend.isPositive ? "text-agri-green" : "text-destructive")}>
                {trend.isPositive ? "+" : ""}
                {trend.value}% from last month
              </p>
            )}
          </div>
          {icon && <div className="text-agri-green">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}
