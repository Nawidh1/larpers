"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Plus, Lock, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { canWriteClient, isAuditorClient } from "@/lib/supabase/roles"
import { AddCropDialog } from "@/components/dashboard/add-crop-dialog"
import type { Crop } from "@/lib/supabase/types"

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  growing: { label: "Growing", variant: "default" },
  harvested: { label: "Harvested", variant: "secondary" },
  planned: { label: "Planned", variant: "outline" },
  issue: { label: "Issue", variant: "destructive" },
}

export function CropTable() {
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [canWrite, setCanWrite] = useState(true)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null)

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

  const handleDialogSuccess = () => {
    fetchCrops()
  }
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div />
          <Button size="sm" className="bg-agri-green hover:bg-agri-green-dark text-white" disabled>
            <Plus size={16} className="mr-2" />
            Add Crop
          </Button>
        </div>
        <div className="border rounded-lg bg-card p-8 text-center text-muted-foreground">Loading crops...</div>
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
          onClick={handleAddCrop}
          title={!canWrite ? "Je hebt geen rechten om crops toe te voegen" : ""}
        >
          <Plus size={16} className="mr-2" />
          Add Crop
        </Button>
      </div>

      <AddCropDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
        cropToEdit={editingCrop}
      />

      <div className="border rounded-lg bg-card">
        {crops.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No crops found. Click "Add Crop" to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[150px]">Action</TableHead>
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
                        <Button variant="link" size="sm" className="text-agri-blue p-0 h-auto">
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
                            disabled={!canWrite}
                            onClick={() => handleEditCrop(crop)}
                            className="cursor-pointer"
                          >
                            <Edit size={14} className="mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer">View Details</DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive cursor-pointer"
                            disabled={!canWrite}
                            onClick={() => handleDeleteCrop(crop.id)}
                          >
                            <Trash2 size={14} className="mr-2" />
                            Delete
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
        )}
      </div>
    </div>
  )
}
