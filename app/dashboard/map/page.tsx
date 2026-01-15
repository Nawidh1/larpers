"use client"

import { Header } from "@/components/dashboard/header"
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
    <div className="flex flex-col h-full">
      <Header title="Percelen Kaart" />
      <div className="flex-1 p-6">
        <FieldsMap />
      </div>
    </div>
  )
}
