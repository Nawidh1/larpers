"use client"

import { Header } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import FieldsMap with SSR disabled (Leaflet needs window object)
const FieldsMap = dynamic(() => import("@/components/dashboard/fields-map").then((mod) => ({ default: mod.FieldsMap })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px]">
      <p className="text-muted-foreground">Kaart laden...</p>
    </div>
  ),
})

export default function MapPage() {
  return (
    <div className="flex flex-col h-full" suppressHydrationWarning>
      <Header title="Percelen Kaart" />
      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-auto" suppressHydrationWarning>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-agri-green" />
              Gewassen Kaart
            </CardTitle>
            <CardDescription>
              Bekijk de locatie van al je gewassen en percelen op de kaart
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <FieldsMap />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
