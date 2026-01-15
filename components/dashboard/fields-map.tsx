"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { isAuditorClient } from "@/lib/supabase/roles"
import type { Crop } from "@/lib/supabase/types"
import dynamic from "next/dynamic"

// Dynamically import Leaflet components (only in browser)
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false })

// Import Leaflet CSS
import "leaflet/dist/leaflet.css"

// Custom marker icons based on crop status (will be set in component)
let LeafletInstance: any = null

interface FieldsMapProps {
  selectedCrop?: Crop | null
  onCropSelect?: (crop: Crop) => void
}

export function FieldsMap({ selectedCrop, onCropSelect }: FieldsMapProps) {
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCropData, setSelectedCropData] = useState<Crop | null>(selectedCrop || null)
  const [isAuditor, setIsAuditor] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  // Initialize Leaflet only in browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        LeafletInstance = L.default
        // Fix for default marker icons in Next.js
        delete (L.default.Icon.Default.prototype as any)._getIconUrl
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })
        setLeafletLoaded(true)
      })
    }
  }, [])

  useEffect(() => {
    if (leafletLoaded) {
      fetchCrops()
      checkAuditor()
    }
  }, [leafletLoaded])

  useEffect(() => {
    if (selectedCrop) {
      setSelectedCropData(selectedCrop)
    }
  }, [selectedCrop])

  const checkAuditor = async () => {
    const auditor = await isAuditorClient()
    setIsAuditor(auditor)
  }

  // Custom marker icons based on crop status
  const getMarkerIcon = (status: string) => {
    if (!LeafletInstance) return null
    
    const colors: Record<string, string> = {
      growing: "#22c55e", // green
      harvested: "#3b82f6", // blue
      planned: "#f59e0b", // yellow
      issue: "#ef4444", // red
    }

    const color = colors[status] || "#6b7280"

    return LeafletInstance.divIcon({
      className: "custom-marker",
      html: `<div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
    })
  }

  const fetchCrops = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Check if user is auditor
      const auditor = await isAuditorClient()
      
      // For auditors, fetch all crops (read-only access)
      const query = auditor
        ? supabase.from("crops").select("*").order("created_at", { ascending: false })
        : supabase.from("crops").select("*").eq("user_id", user.id).order("created_at", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("Error fetching crops:", error)
      } else {
        // Filter crops that have coordinates
        const cropsWithCoords = (data as Crop[]).filter(
          (crop) => crop.latitude !== null && crop.longitude !== null
        )
        setCrops(cropsWithCoords)
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkerClick = (crop: Crop) => {
    setSelectedCropData(crop)
    if (onCropSelect) {
      onCropSelect(crop)
    }
  }

  // Default center (Netherlands)
  const defaultCenter: [number, number] = [52.1326, 5.2913]
  const defaultZoom = 7

  // Calculate center from crops if available
  const center =
    crops.length > 0
      ? [
          crops.reduce((sum, c) => sum + (c.latitude || 0), 0) / crops.length,
          crops.reduce((sum, c) => sum + (c.longitude || 0), 0) / crops.length,
        ]
      : defaultCenter

  const zoom = crops.length > 0 ? 10 : defaultZoom

  if (loading || !leafletLoaded) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">Kaart laden...</CardContent>
      </Card>
    )
  }

  if (crops.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Percelen Kaart</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center text-muted-foreground">
          <p>Geen percelen met coördinaten gevonden.</p>
          <p className="text-sm mt-2">Voeg coördinaten toe aan je percelen om ze op de kaart te zien.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Percelen Kaart</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full relative">
            <MapContainer
              center={center as [number, number]}
              zoom={zoom}
              style={{ height: "100%", width: "100%", zIndex: 0 }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {crops.map((crop) => {
                if (!crop.latitude || !crop.longitude) return null

                const markerIcon = getMarkerIcon(crop.status)
                return (
                  <Marker
                    key={crop.id}
                    position={[crop.latitude, crop.longitude]}
                    {...(markerIcon && { icon: markerIcon })}
                    eventHandlers={{
                      click: () => handleMarkerClick(crop),
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-sm mb-1">{crop.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{crop.location}</p>
                        <Badge
                          variant={
                            crop.status === "growing"
                              ? "default"
                              : crop.status === "harvested"
                                ? "secondary"
                                : crop.status === "planned"
                                  ? "outline"
                                  : "destructive"
                          }
                          className={
                            crop.status === "growing" ? "bg-agri-green text-white hover:bg-agri-green" : ""
                          }
                        >
                          {crop.status === "growing"
                            ? "Groeiend"
                            : crop.status === "harvested"
                              ? "Geoogst"
                              : crop.status === "planned"
                                ? "Gepland"
                                : "Probleem"}
                        </Badge>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Selected Crop Details */}
      {selectedCropData && (
        <Card>
          <CardHeader>
            <CardTitle>Perceel Details: {selectedCropData.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Locatie</p>
                <p className="font-medium">{selectedCropData.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    selectedCropData.status === "growing"
                      ? "default"
                      : selectedCropData.status === "harvested"
                        ? "secondary"
                        : selectedCropData.status === "planned"
                          ? "outline"
                          : "destructive"
                  }
                  className={
                    selectedCropData.status === "growing" ? "bg-agri-green text-white hover:bg-agri-green" : ""
                  }
                >
                  {selectedCropData.status === "growing"
                    ? "Groeiend"
                    : selectedCropData.status === "harvested"
                      ? "Geoogst"
                      : selectedCropData.status === "planned"
                        ? "Gepland"
                        : "Probleem"}
                </Badge>
              </div>
              {selectedCropData.variety && (
                <div>
                  <p className="text-sm text-muted-foreground">Variëteit</p>
                  <p className="font-medium">{selectedCropData.variety}</p>
                </div>
              )}
              {selectedCropData.area_hectares && (
                <div>
                  <p className="text-sm text-muted-foreground">Oppervlakte</p>
                  <p className="font-medium">{selectedCropData.area_hectares} hectare</p>
                </div>
              )}
              {selectedCropData.planted_at && (
                <div>
                  <p className="text-sm text-muted-foreground">Geplant op</p>
                  <p className="font-medium">
                    {new Date(selectedCropData.planted_at).toLocaleDateString("nl-NL")}
                  </p>
                </div>
              )}
              {selectedCropData.expected_harvest && (
                <div>
                  <p className="text-sm text-muted-foreground">Verwachte oogst</p>
                  <p className="font-medium">
                    {new Date(selectedCropData.expected_harvest).toLocaleDateString("nl-NL")}
                  </p>
                </div>
              )}
            </div>
            {selectedCropData.notes && (
              <div>
                <p className="text-sm text-muted-foreground">Notities</p>
                <p className="text-sm">{selectedCropData.notes}</p>
              </div>
            )}
            {selectedCropData.latitude && selectedCropData.longitude && (
              <div>
                <p className="text-sm text-muted-foreground">Coördinaten</p>
                <p className="text-sm font-mono">
                  {selectedCropData.latitude.toFixed(6)}, {selectedCropData.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
