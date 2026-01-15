"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle, Droplets, Sprout, CheckCircle2, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { nl } from "date-fns/locale"

interface Notification {
  id: string
  type: "drought" | "crop_health" | "harvest" | "system"
  title: string
  message: string
  read: boolean
  created_at: string
  actionUrl?: string
  cropId?: string
}

export function NotificationsDropdown() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadNotifications() {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Check for drought warnings
      const { data: climateData } = await supabase
        .from("climate_data")
        .select("recorded_at, rainfall_mm")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(14)

      // Check for crops with issues
      const { data: cropsWithIssues } = await supabase
        .from("crops")
        .select("id, name, status, expected_harvest")
        .eq("user_id", user.id)
        .in("status", ["issue"])
        .limit(5)

      // Check for upcoming harvests
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)

      const { data: upcomingHarvests } = await supabase
        .from("crops")
        .select("id, name, expected_harvest")
        .eq("user_id", user.id)
        .eq("status", "growing")
        .not("expected_harvest", "is", null)
        .gte("expected_harvest", today.toISOString().split("T")[0])
        .lte("expected_harvest", nextWeek.toISOString().split("T")[0])
        .limit(5)

      const notificationList: Notification[] = []

      // Drought warning notification
      if (climateData && climateData.length >= 14) {
        const totalRainfall = climateData.reduce((sum, d) => sum + (Number(d.rainfall_mm) || 0), 0)
        const daysWithoutRain = climateData.filter((d) => !d.rainfall_mm || Number(d.rainfall_mm) === 0).length

        if (totalRainfall < 10 && daysWithoutRain > 7) {
          notificationList.push({
            id: "drought-warning",
            type: "drought",
            title: "Droogte Waarschuwing",
            message: `Weinig regenval in de afgelopen 14 dagen (${totalRainfall.toFixed(1)}mm). Overweeg irrigatie aan te passen.`,
            read: false,
            created_at: climateData[0]?.recorded_at || new Date().toISOString(),
          })
        }
      }

      // Crop issues
      if (cropsWithIssues && cropsWithIssues.length > 0) {
        cropsWithIssues.forEach((crop) => {
          notificationList.push({
            id: `crop-issue-${crop.id}`,
            type: "crop_health",
            title: "Crop Probleem",
            message: `${crop.name} heeft een probleem status en heeft aandacht nodig.`,
            read: false,
            created_at: new Date().toISOString(),
            actionUrl: "/dashboard/crops",
            cropId: crop.id,
          })
        })
      }

      // Upcoming harvests
      if (upcomingHarvests && upcomingHarvests.length > 0) {
        upcomingHarvests.forEach((crop) => {
          const harvestDate = new Date(crop.expected_harvest!)
          const daysUntil = Math.ceil((harvestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          notificationList.push({
            id: `harvest-${crop.id}`,
            type: "harvest",
            title: "Oogst Binnenkort",
            message: `${crop.name} is klaar voor oogst over ${daysUntil} ${daysUntil === 1 ? "dag" : "dagen"}.`,
            read: false,
            created_at: new Date().toISOString(),
            actionUrl: "/dashboard/crops",
            cropId: crop.id,
          })
        })
      }

      // Sort by date (newest first)
      notificationList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setNotifications(notificationList)
      setUnreadCount(notificationList.filter((n) => !n.read).length)
    } catch (err) {
      console.error("Error loading notifications:", err)
    } finally {
      setLoading(false)
    }
  }

  function getNotificationIcon(type: Notification["type"]) {
    switch (type) {
      case "drought":
        return <Droplets className="h-4 w-4 text-orange-500" />
      case "crop_health":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "harvest":
        return <Sprout className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10">
        <Bell size={18} className="md:w-5 md:h-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 md:h-10 md:w-10">
          <Bell size={18} className="md:w-5 md:h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Notificaties</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-muted-foreground">{unreadCount} nieuw</span>
            )}
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                <p>Geen notificaties</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors group ${
                      !notification.read ? "bg-muted/50 border-primary/20" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      
                      // Mark as read
                      setNotifications((prev) =>
                        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
                      )
                      setUnreadCount((prev) => Math.max(0, prev - 1))

                      // Navigate to action URL if available
                      if (notification.actionUrl) {
                        // Close dropdown first
                        setDropdownOpen(false)
                        // Small delay to allow dropdown to close smoothly
                        setTimeout(() => {
                          window.location.href = notification.actionUrl!
                        }, 200)
                      }
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                                locale: nl,
                              })}
                            </p>
                          </div>
                          {notification.actionUrl && (
                            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
