"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Droplets, Thermometer, Wind } from "lucide-react"
import type { DroughtWarning } from "@/lib/supabase/queries"

interface DroughtWarningProps {
  warning: DroughtWarning
}

const severityConfig = {
  low: {
    variant: "default" as const,
    icon: Droplets,
    bgColor: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    textColor: "text-blue-900 dark:text-blue-100",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  moderate: {
    variant: "default" as const,
    icon: AlertTriangle,
    bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
    textColor: "text-yellow-900 dark:text-yellow-100",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  high: {
    variant: "default" as const,
    icon: AlertTriangle,
    bgColor: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
    textColor: "text-orange-900 dark:text-orange-100",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  extreme: {
    variant: "destructive" as const,
    icon: AlertTriangle,
    bgColor: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    textColor: "text-red-900 dark:text-red-100",
    iconColor: "text-red-600 dark:text-red-400",
  },
}

export function DroughtWarning({ warning }: DroughtWarningProps) {
  const config = severityConfig[warning.severity]
  const Icon = config.icon

  return (
    <Alert className={`${config.bgColor} ${config.textColor} border-2`}>
      <Icon className={`h-5 w-5 ${config.iconColor}`} />
      <AlertTitle className="font-semibold text-lg mb-2">{warning.message}</AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="font-medium">Irrigatie aanbeveling:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          {warning.severity === "extreme" && (
            <li>Verhoog irrigatie onmiddellijk met 50-100%</li>
          )}
          {warning.severity === "high" && (
            <li>Verhoog irrigatie met 30-50%</li>
          )}
          {(warning.severity === "moderate" || warning.severity === "low") && (
            <li>Monitor bodemvochtigheid en pas irrigatie aan indien nodig</li>
          )}
        </ul>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-current/20">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            <div>
              <p className="text-xs opacity-75">Regenval (14d)</p>
              <p className="font-semibold">{warning.details.rainfall14Days} mm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4" />
            <div>
              <p className="text-xs opacity-75">Temp (7d gem.)</p>
              <p className="font-semibold">{warning.details.avgTemperature7Days}°C</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4" />
            <div>
              <p className="text-xs opacity-75">Luchtvocht (7d)</p>
              <p className="font-semibold">{warning.details.avgHumidity7Days}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <div>
              <p className="text-xs opacity-75">Dagen zonder regen</p>
              <p className="font-semibold">{warning.details.daysWithoutRain}</p>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}
