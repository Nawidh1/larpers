"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Crop } from "@/lib/supabase/types"
import { Leaf, MapPin, Calendar, ArrowRight, AlertTriangle, Sprout, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { nl } from "date-fns/locale"
import { AddCropDialog } from "@/components/dashboard/add-crop-dialog"

interface FieldDetailsCardProps {
  name: string
  imageSrc?: string
}

interface HarvestNotification {
  id: string
  cropId: string
  cropName: string
  daysUntil: number
  harvestDate: Date
}

export function FieldDetailsCard({ name, imageSrc }: FieldDetailsCardProps) {
  const [cropsNeedingAttention, setCropsNeedingAttention] = useState<Crop[]>([])
  const [harvestNotifications, setHarvestNotifications] = useState<HarvestNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [problemDialogOpen, setProblemDialogOpen] = useState(false)
  const [selectedProblemCrop, setSelectedProblemCrop] = useState<Crop | null>(null)
  const [stats, setStats] = useState({
    issues: 0,
    needsHarvest: 0,
    total: 0,
  })

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

      // Fetch all crops
      const { data, error } = await supabase
        .from("crops")
        .select("*")
        .eq("user_id", user.id)

      if (error) {
        console.error("Error fetching crops:", error)
        setLoading(false)
        return
      }

      const allCrops = (data as Crop[]) || []
      
        // Filter crops that need attention:
        // 1. Crops with status "issue"
        // 2. Crops that need to be harvested soon (within 1 week)
        const now = new Date()
        const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 week = 7 days
        
        const cropsWithIssues = allCrops.filter((c) => c.status === "issue")
        const cropsNeedingHarvest = allCrops.filter((c) => {
          if (c.status !== "growing" || !c.expected_harvest) return false
          const harvestDate = new Date(c.expected_harvest)
          // Only include crops that need to be harvested within 1 week and are in the future (at least 1 day away)
          // Set time to start of day for accurate comparison
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const harvestDateStart = new Date(harvestDate.getFullYear(), harvestDate.getMonth(), harvestDate.getDate())
          const daysUntil = Math.ceil((harvestDateStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))
          // Only show crops that are at least 1 day in the future and within 1 week
          return daysUntil > 0 && daysUntil <= 7
        })

      // Create harvest notifications
      const harvestNotifs: HarvestNotification[] = cropsNeedingHarvest.map((crop) => {
        const harvestDate = new Date(crop.expected_harvest!)
        // Calculate days until harvest (should always be >= 0 now)
        const daysUntil = Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return {
          id: `harvest-${crop.id}`,
          cropId: crop.id,
          cropName: crop.name,
          daysUntil: Math.max(0, daysUntil), // Safety check, but should always be >= 0
          harvestDate,
        }
      })

      setHarvestNotifications(harvestNotifs)

      // Combine and remove duplicates
      const attentionNeeded = [
        ...cropsWithIssues,
        ...cropsNeedingHarvest.filter((c) => !cropsWithIssues.some((issue) => issue.id === c.id)),
      ]

      setCropsNeedingAttention(attentionNeeded)
      
      // Calculate stats
      setStats({
        issues: cropsWithIssues.length,
        needsHarvest: cropsNeedingHarvest.length,
        total: allCrops.length,
      })
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCrops()
  }, [])

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
      growing: { variant: "default", label: "Groeiend" },
      harvested: { variant: "secondary", label: "Geoogst" },
      planned: { variant: "outline", label: "Gepland" },
      issue: { variant: "destructive", label: "Probleem" },
    }
    const config = variants[status] || variants.planned
    return (
      <Badge
        variant={config.variant}
        className={status === "growing" ? "bg-agri-green text-white hover:bg-agri-green" : ""}
      >
        {config.label}
      </Badge>
    )
  }

  const getAttentionReason = (crop: Crop) => {
    if (crop.status === "issue") {
      return { icon: AlertTriangle, text: "Probleem", color: "text-destructive" }
    }
    if (crop.expected_harvest) {
      const harvestDate = new Date(crop.expected_harvest)
      const now = new Date()
      // Set time to start of day for accurate comparison
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const harvestDateStart = new Date(harvestDate.getFullYear(), harvestDate.getMonth(), harvestDate.getDate())
      const daysUntilHarvest = Math.ceil((harvestDateStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24))
      
      // Only show if harvest is in the future (at least 1 day away, within 1 week)
      if (daysUntilHarvest > 0 && daysUntilHarvest <= 7) {
        // Show days if less than 30 days, otherwise show months
        if (daysUntilHarvest < 30) {
          return { icon: Calendar, text: `Oogst over ${daysUntilHarvest} dag${daysUntilHarvest !== 1 ? "en" : ""}`, color: "text-agri-yellow" }
        } else {
          const monthsUntil = Math.floor(daysUntilHarvest / 30)
          const remainingDays = daysUntilHarvest % 30
          if (remainingDays === 0) {
            return { icon: Calendar, text: `Oogst over ${monthsUntil} maand${monthsUntil !== 1 ? "en" : ""}`, color: "text-agri-yellow" }
          } else {
            return { icon: Calendar, text: `Oogst over ${monthsUntil} maand${monthsUntil !== 1 ? "en" : ""} en ${remainingDays} dag${remainingDays !== 1 ? "en" : ""}`, color: "text-agri-yellow" }
          }
        }
      }
    }
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-destructive" size={18} />
            <CardTitle className="text-base font-medium">Percelen die aandacht nodig hebben</CardTitle>
          </div>
          <Link
            href="/dashboard/crops"
            className="text-xs text-agri-green hover:text-agri-green-dark flex items-center gap-1"
          >
            Bekijk alle <ArrowRight size={12} />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Section */}
        <div className="relative h-[120px] rounded-lg overflow-hidden bg-muted">
          {imageSrc ? (
            <Image src={imageSrc} alt={name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="text-destructive" size={32} />
                </div>
                <p className="text-xs text-muted-foreground">Geen afbeelding</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-2xl font-bold text-destructive">{stats.issues}</p>
            <p className="text-xs text-muted-foreground">Problemen</p>
          </div>
          <div className="text-center p-2 bg-agri-yellow/10 rounded-lg border border-agri-yellow/20">
            <p className="text-2xl font-bold text-agri-yellow">{stats.needsHarvest}</p>
            <p className="text-xs text-muted-foreground">Oogst binnenkort</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Totaal percelen</p>
          </div>
        </div>

        {/* Split Layout: Problems Left, Harvest Right */}
        {loading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">Laden...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Problems */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-destructive" size={16} />
                <p className="text-sm font-medium text-muted-foreground">Problemen</p>
                {cropsNeedingAttention.filter((c) => c.status === "issue").length > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {cropsNeedingAttention.filter((c) => c.status === "issue").length}
                  </Badge>
                )}
              </div>
              {cropsNeedingAttention.filter((c) => c.status === "issue").length > 0 ? (
                <div className="space-y-2">
                  {cropsNeedingAttention
                    .filter((c) => c.status === "issue")
                    .map((crop) => {
                      const attentionReason = getAttentionReason(crop)
                      const ReasonIcon = attentionReason?.icon || AlertTriangle
                      return (
                        <button
                          key={crop.id}
                          onClick={() => {
                            setSelectedProblemCrop(crop)
                            setProblemDialogOpen(true)
                          }}
                          className="w-full text-left block p-3 border border-destructive/20 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <ReasonIcon className="text-destructive" size={14} />
                                <p className="font-medium text-sm truncate">{crop.name}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {crop.location && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin size={12} />
                                    <span className="truncate">{crop.location}</span>
                                  </div>
                                )}
                              </div>
                              {crop.notes && (
                                <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md">
                                  <p className="text-xs font-medium text-destructive mb-1">Probleem:</p>
                                  <p className="text-xs text-foreground">{crop.notes}</p>
                                </div>
                              )}
                            </div>
                            <div className="ml-2">{getStatusBadge(crop.status)}</div>
                          </div>
                        </button>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-6 text-sm border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-agri-green/10 flex items-center justify-center">
                    <Leaf className="text-agri-green" size={20} />
                  </div>
                  <p className="text-muted-foreground text-xs">Geen problemen</p>
                </div>
              )}
            </div>

            {/* Right: Upcoming Harvests */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-agri-yellow" size={16} />
                <p className="text-sm font-medium text-muted-foreground">Binnenkort geoogst</p>
                {harvestNotifications.length > 0 && (
                  <Badge variant="outline" className="ml-auto border-agri-yellow/20 text-agri-yellow">
                    {harvestNotifications.length}
                  </Badge>
                )}
              </div>
              {harvestNotifications.length > 0 ? (
                <div className="space-y-2">
                  {harvestNotifications.map((notification) => {
                    const crop = cropsNeedingAttention.find((c) => c.id === notification.cropId)
                    return (
                      <Link
                        key={notification.id}
                        href="/dashboard/crops"
                        className="block p-3 border border-agri-yellow/20 bg-agri-yellow/5 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="text-agri-yellow" size={14} />
                              <p className="font-medium text-sm truncate">{notification.cropName}</p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {crop?.location && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <MapPin size={12} />
                                  <span className="truncate">{crop.location}</span>
                                </div>
                              )}
                              <span className="text-xs font-medium text-agri-yellow">
                                {notification.daysUntil < 30 ? (
                                  <>Oogst over {notification.daysUntil} {notification.daysUntil === 1 ? "dag" : "dagen"}</>
                                ) : (
                                  (() => {
                                    const monthsUntil = Math.floor(notification.daysUntil / 30)
                                    const remainingDays = notification.daysUntil % 30
                                    if (remainingDays === 0) {
                                      return <>Oogst over {monthsUntil} {monthsUntil === 1 ? "maand" : "maanden"}</>
                                    } else {
                                      return <>Oogst over {monthsUntil} {monthsUntil === 1 ? "maand" : "maanden"} en {remainingDays} {remainingDays === 1 ? "dag" : "dagen"}</>
                                    }
                                  })()
                                )}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(notification.harvestDate, {
                                addSuffix: true,
                                locale: nl,
                              })}
                            </p>
                          </div>
                          <div className="ml-2">{crop && getStatusBadge(crop.status)}</div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-sm border border-agri-yellow/20 rounded-lg bg-agri-yellow/5">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-agri-green/10 flex items-center justify-center">
                    <Calendar className="text-agri-green" size={20} />
                  </div>
                  <p className="text-muted-foreground text-xs">Geen oogsten binnenkort</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Problem Fix Dialog */}
      <AddCropDialog
        open={problemDialogOpen}
        onOpenChange={setProblemDialogOpen}
        onSuccess={() => {
          // Reload crops after fixing problem
          fetchCrops()
          setSelectedProblemCrop(null)
        }}
        cropToEdit={selectedProblemCrop}
      />
    </Card>
  )
}
