"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Plus, Lock, Edit, Trash2, Eye, MapPin, Calendar, Ruler, FileText, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { canWriteClient, isAuditorClient } from "@/lib/supabase/roles"
import { AddCropDialog } from "@/components/dashboard/add-crop-dialog"
import type { Crop } from "@/lib/supabase/types"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  growing: { label: "Groeiend", variant: "default" },
  harvested: { label: "Geoogst", variant: "secondary" },
  planned: { label: "Gepland", variant: "outline" },
  issue: { label: "Probleem", variant: "destructive" },
}

export function CropTable() {
  const router = useRouter()
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [canWrite, setCanWrite] = useState(true)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [monitorDialogOpen, setMonitorDialogOpen] = useState(false)
  const [monitoringCrop, setMonitoringCrop] = useState<Crop | null>(null)
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null)
  const [viewingCrop, setViewingCrop] = useState<Crop | null>(null)

  const fetchCrops = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Check permissions
      const hasWriteAccess = await canWriteClient()
      const auditor = await isAuditorClient()
      setCanWrite(hasWriteAccess)
      setIsReadOnly(auditor)

      // For auditors, fetch all crops (read-only access)
      const query = auditor
        ? supabase.from("crops").select("*").order("created_at", { ascending: false })
        : supabase.from("crops").select("*").eq("user_id", user.id).order("created_at", { ascending: false })

      const { data, error } = await query

      if (error) {
        console.error("Error fetching crops:", error)
      } else {
        setCrops((data as Crop[]) || [])
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCrops()
  }, [])

  const handleAddCrop = () => {
    setEditingCrop(null)
    setDialogOpen(true)
  }

  const handleEditCrop = (crop: Crop) => {
    setEditingCrop(crop)
    setDialogOpen(true)
  }

  const handleDeleteCrop = async (cropId: string) => {
    if (!confirm("Weet je zeker dat je deze crop wilt verwijderen?")) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("crops").delete().eq("id", cropId)

      if (error) {
        console.error("Error deleting crop:", error)
        alert("Fout bij het verwijderen van de crop")
      } else {
        fetchCrops()
      }
    } catch (err) {
      console.error("Error:", err)
      alert("Fout bij het verwijderen van de crop")
    }
  }

  const handleMonitorCrop = (crop: Crop) => {
    setMonitoringCrop(crop)
    setMonitorDialogOpen(true)
  }

  const handleViewDetails = (crop: Crop) => {
    setViewingCrop(crop)
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    fetchCrops()
    setEditingCrop(null)
    setViewingCrop(null)
  }
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div />
          <Button size="sm" className="bg-agri-green hover:bg-agri-green-dark text-white" disabled>
            <Plus size={16} className="mr-2" />
            Gewas Toevoegen
          </Button>
        </div>
        <div className="border rounded-lg bg-card p-8 text-center text-muted-foreground">Gewassen laden...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {isReadOnly && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock size={16} />
            <span>Alleen-lezen modus - Je hebt geen rechten om data te wijzigen</span>
          </div>
        )}
        <div />
        <Button
          size="sm"
          className="bg-agri-green hover:bg-agri-green-dark text-white"
          disabled={!canWrite}
          onClick={(e) => {
            e.preventDefault()
            handleAddCrop()
          }}
          title={!canWrite ? "Je hebt geen rechten om crops toe te voegen" : ""}
        >
          <Plus size={16} className="mr-2" />
          Gewas Toevoegen
        </Button>
      </div>

      <AddCropDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingCrop(null)
            setViewingCrop(null)
          }
        }}
        onSuccess={handleDialogSuccess}
        cropToEdit={editingCrop || viewingCrop}
        viewOnly={!!viewingCrop && !editingCrop}
      />

      {/* Crop Monitor Dialog */}
      <Dialog open={monitorDialogOpen} onOpenChange={setMonitorDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-agri-green" />
              Monitor: {monitoringCrop?.name}
            </DialogTitle>
            <DialogDescription>
              Bekijk de monitoring informatie voor dit gewas
            </DialogDescription>
          </DialogHeader>
          {monitoringCrop && (
            <div className="space-y-4">
              {/* Basic Information */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Locatie</p>
                      <p className="font-medium flex items-center gap-2">
                        <MapPin size={16} className="text-agri-green" />
                        {monitoringCrop.location}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <Badge
                        variant={
                          monitoringCrop.status === "growing"
                            ? "default"
                            : monitoringCrop.status === "harvested"
                              ? "secondary"
                              : monitoringCrop.status === "planned"
                                ? "outline"
                                : "destructive"
                        }
                        className={
                          monitoringCrop.status === "growing" ? "bg-agri-green text-white hover:bg-agri-green" : ""
                        }
                      >
                        {statusConfig[monitoringCrop.status]?.label || monitoringCrop.status}
                      </Badge>
                    </div>
                    {monitoringCrop.variety && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Variëteit</p>
                        <p className="font-medium">{monitoringCrop.variety}</p>
                      </div>
                    )}
                    {monitoringCrop.area_hectares && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Oppervlakte</p>
                        <p className="font-medium flex items-center gap-2">
                          <Ruler size={16} className="text-muted-foreground" />
                          {monitoringCrop.area_hectares} hectare
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dates */}
              {(monitoringCrop.planted_at || monitoringCrop.expected_harvest) && (
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Calendar size={16} className="text-agri-green" />
                      Tijdlijn
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {monitoringCrop.planted_at && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Geplant Op</p>
                          <p className="font-medium">
                            {new Date(monitoringCrop.planted_at).toLocaleDateString("nl-NL", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                      {monitoringCrop.expected_harvest && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Verwachte Oogst</p>
                          <p className="font-medium">
                            {new Date(monitoringCrop.expected_harvest).toLocaleDateString("nl-NL", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Coordinates */}
              {(monitoringCrop.latitude && monitoringCrop.longitude) && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <MapPin size={16} className="text-agri-green" />
                      Coördinaten
                    </p>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Breedtegraad</p>
                        <p className="font-mono text-sm">{monitoringCrop.latitude}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lengtegraad</p>
                        <p className="font-mono text-sm">{monitoringCrop.longitude}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMonitorDialogOpen(false)
                          router.push(`/dashboard/map?crop=${monitoringCrop.id}`)
                        }}
                        className="ml-auto"
                      >
                        <MapPin size={14} className="mr-2" />
                        Bekijk op Kaart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              {monitoringCrop.notes && (
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <FileText size={16} className="text-agri-green" />
                      Notities
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{monitoringCrop.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setMonitorDialogOpen(false)
                    handleEditCrop(monitoringCrop)
                  }}
                  disabled={!canWrite}
                >
                  <Edit size={14} className="mr-2" />
                  Bewerken
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMonitorDialogOpen(false)
                    router.push(`/dashboard/map?crop=${monitoringCrop.id}`)
                  }}
                >
                  <MapPin size={14} className="mr-2" />
                  Bekijk op Kaart
                </Button>
                <Button onClick={() => setMonitorDialogOpen(false)} className="bg-agri-green hover:bg-agri-green-dark text-white">
                  Sluiten
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="border rounded-lg bg-card">
        {crops.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Geen gewassen gevonden. Klik op "Gewas Toevoegen" om te beginnen.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naam</TableHead>
                  <TableHead>Locatie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[150px]">Acties</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {crops.map((crop) => {
                const status = statusConfig[crop.status] || statusConfig.growing
                return (
                  <TableRow key={crop.id}>
                    <TableCell className="font-medium">{crop.name}</TableCell>
                    <TableCell>{crop.location}</TableCell>
                    <TableCell>
                      <Badge
                        variant={status.variant}
                        className={crop.status === "growing" ? "bg-agri-green text-white hover:bg-agri-green" : ""}
                      >
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-agri-blue p-0 h-auto hover:underline"
                          onClick={(e) => {
                            e.preventDefault()
                            handleMonitorCrop(crop)
                          }}
                        >
                          Monitor
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault()
                                handleViewDetails(crop)
                              }}
                              className="cursor-pointer"
                            >
                              <Eye size={14} className="mr-2" />
                              Bekijk Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={!canWrite}
                              onClick={(e) => {
                                e.preventDefault()
                                handleEditCrop(crop)
                              }}
                              className="cursor-pointer"
                            >
                              <Edit size={14} className="mr-2" />
                              Bewerken
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive cursor-pointer"
                              disabled={!canWrite}
                              onClick={(e) => {
                                e.preventDefault()
                                handleDeleteCrop(crop.id)
                              }}
                            >
                              <Trash2 size={14} className="mr-2" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
