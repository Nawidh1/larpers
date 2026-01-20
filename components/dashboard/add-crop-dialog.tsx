"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Crop } from "@/lib/supabase/types"

interface AddCropDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  cropToEdit?: Crop | null
  viewOnly?: boolean
}

export function AddCropDialog({ open, onOpenChange, onSuccess, cropToEdit, viewOnly = false }: AddCropDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    latitude: "",
    longitude: "",
    status: "growing" as "growing" | "harvested" | "planned" | "issue",
    variety: "",
    planted_at: "",
    expected_harvest: "",
    area_hectares: "",
    notes: "",
  })

  // Reset form data when dialog opens or cropToEdit changes
  useEffect(() => {
    if (open) {
      setError(null)
      if (cropToEdit) {
        setFormData({
          name: cropToEdit.name || "",
          location: cropToEdit.location || "",
          latitude: cropToEdit.latitude?.toString() || "",
          longitude: cropToEdit.longitude?.toString() || "",
          status: (cropToEdit.status || "growing") as "growing" | "harvested" | "planned" | "issue",
          variety: cropToEdit.variety || "",
          planted_at: cropToEdit.planted_at ? cropToEdit.planted_at.split("T")[0] : "",
          expected_harvest: cropToEdit.expected_harvest ? cropToEdit.expected_harvest.split("T")[0] : "",
          area_hectares: cropToEdit.area_hectares?.toString() || "",
          notes: cropToEdit.notes || "",
        })
      } else {
        setFormData({
          name: "",
          location: "",
          latitude: "",
          longitude: "",
          status: "growing",
          variety: "",
          planted_at: "",
          expected_harvest: "",
          area_hectares: "",
          notes: "",
        })
      }
    }
  }, [open, cropToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (viewOnly) {
      onOpenChange(false)
      return
    }
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Je bent niet ingelogd")
        setLoading(false)
        return
      }

      // Check if user has a profile (required for RLS)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profileError || !profile) {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createProfileError } = await supabase
          .from("profiles")
          .insert([{ id: user.id, role: "farmer" }])
          .select()
          .single()

        if (createProfileError) {
          console.error("Error creating profile:", {
            message: createProfileError.message,
            code: createProfileError.code,
            details: createProfileError.details,
            hint: createProfileError.hint,
          })
          setError(
            createProfileError.message || 
            "Je profiel kon niet worden aangemaakt. Ververs de pagina en probeer het opnieuw."
          )
          setLoading(false)
          return
        }
      }

      // Verify user has correct role (farmer or admin)
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (userProfile && !["farmer", "admin"].includes(userProfile.role)) {
        setError("Alleen farmers en admins kunnen crops toevoegen. Je huidige rol: " + userProfile.role)
        setLoading(false)
        return
      }

      // Validate required fields
      if (!formData.name.trim() || !formData.location.trim()) {
        setError("Naam en locatie zijn verplicht")
        setLoading(false)
        return
      }

      // Validate and parse latitude (-90 to 90)
      let latitude: number | null = null
      if (formData.latitude && formData.latitude.trim()) {
        const latValue = parseFloat(formData.latitude)
        if (isNaN(latValue)) {
          setError("Breedtegraad moet een geldig nummer zijn")
          setLoading(false)
          return
        }
        if (latValue < -90 || latValue > 90) {
          setError("Breedtegraad moet tussen -90 en 90 liggen")
          setLoading(false)
          return
        }
        // Round to 8 decimal places to match database precision (DECIMAL(10, 8))
        // Use toFixed and parseFloat to ensure proper precision
        latitude = parseFloat(latValue.toFixed(8))
      }

      // Validate and parse longitude (-180 to 180)
      let longitude: number | null = null
      if (formData.longitude && formData.longitude.trim()) {
        const lngValue = parseFloat(formData.longitude)
        if (isNaN(lngValue)) {
          setError("Lengtegraad moet een geldig nummer zijn")
          setLoading(false)
          return
        }
        if (lngValue < -180 || lngValue > 180) {
          setError("Lengtegraad moet tussen -180 en 180 liggen")
          setLoading(false)
          return
        }
        // Round to 8 decimal places to match database precision (DECIMAL(11, 8))
        // Use toFixed and parseFloat to ensure proper precision
        longitude = parseFloat(lngValue.toFixed(8))
      }

      // Validate area_hectares if provided
      let areaHectares: number | null = null
      if (formData.area_hectares && formData.area_hectares.trim()) {
        const areaValue = parseFloat(formData.area_hectares)
        if (isNaN(areaValue) || areaValue < 0) {
          setError("Oppervlakte moet een geldig positief nummer zijn")
          setLoading(false)
          return
        }
        // Round to 2 decimal places to match database precision (DECIMAL(10, 2))
        // Use toFixed and parseFloat to ensure proper precision
        areaHectares = parseFloat(areaValue.toFixed(2))
      }

      const cropData = {
        user_id: user.id,
        name: formData.name.trim(),
        location: formData.location.trim(),
        latitude: latitude,
        longitude: longitude,
        status: formData.status,
        variety: formData.variety.trim() || null,
        planted_at: formData.planted_at || null,
        expected_harvest: formData.expected_harvest || null,
        area_hectares: areaHectares,
        notes: formData.notes.trim() || null,
      }

      if (cropToEdit) {
        // Update existing crop
        const { data: updateData, error: updateError } = await supabase
          .from("crops")
          .update(cropData)
          .eq("id", cropToEdit.id)
          .select()

        if (updateError) {
          console.error("Update error details:", {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint,
            error: updateError,
          })
          throw new Error(
            updateError.message || 
            updateError.details || 
            updateError.hint || 
            updateError.code || 
            "Fout bij het bijwerken van de crop"
          )
        }
      } else {
        // Insert new crop
        const { data: insertData, error: insertError } = await supabase
          .from("crops")
          .insert([cropData])
          .select()

        if (insertError) {
          console.error("Insert error details:", {
            message: insertError.message,
            code: insertError.code,
            details: insertError.details,
            hint: insertError.hint,
            error: insertError,
            cropData: cropData,
          })
          
          // Check for specific error types
          if (insertError.code === "42501") {
            throw new Error("Je hebt geen rechten om crops toe te voegen. Alleen farmers en admins kunnen dit doen.")
          } else if (insertError.code === "23503") {
            throw new Error("Foreign key constraint error. Zorg ervoor dat je profiel bestaat.")
          } else if (insertError.code === "23505") {
            throw new Error("Deze crop bestaat al.")
          } else {
            throw new Error(
              insertError.message || 
              insertError.details || 
              insertError.hint || 
              insertError.code || 
              "Fout bij het toevoegen van de crop. Controleer je rechten en probeer het opnieuw."
            )
          }
        }
      }

      // Reset form and close dialog
      setFormData({
        name: "",
        location: "",
        latitude: "",
        longitude: "",
        status: "growing",
        variety: "",
        planted_at: "",
        expected_harvest: "",
        area_hectares: "",
        notes: "",
      })
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error("Error saving crop - full error:", {
        error: err,
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
        toString: err?.toString(),
      })
      const errorMessage = 
        err?.message || 
        err?.error?.message || 
        err?.toString() || 
        (typeof err === 'string' ? err : "Er is een fout opgetreden bij het opslaan van de crop")
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {viewOnly ? "Crop Details" : cropToEdit ? "Crop Bewerken" : "Nieuwe Crop Toevoegen"}
          </DialogTitle>
          <DialogDescription>
            {viewOnly
              ? "Bekijk de crop informatie hieronder"
              : cropToEdit
                ? "Bewerk de crop informatie hieronder"
                : "Vul de onderstaande informatie in om een nieuwe crop toe te voegen"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Crop Naam <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Bijv. Tomatenveld A"
                required
                disabled={viewOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                Locatie <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Bijv. Sectie A"
                required
                disabled={viewOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">
                Breedtegraad (Latitude)
                <span className="text-xs text-muted-foreground ml-1">(optioneel)</span>
              </Label>
              <Input
                id="latitude"
                type="number"
                step="0.00000001"
                min="-90"
                max="90"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="52.1326"
                disabled={viewOnly}
              />
              <p className="text-xs text-muted-foreground">Voor kaart weergave</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">
                Lengtegraad (Longitude)
                <span className="text-xs text-muted-foreground ml-1">(optioneel)</span>
              </Label>
              <Input
                id="longitude"
                type="number"
                step="0.00000001"
                min="-180"
                max="180"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="5.2913"
                disabled={viewOnly}
              />
              <p className="text-xs text-muted-foreground">Voor kaart weergave</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                disabled={viewOnly}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="growing">Groeiend</SelectItem>
                  <SelectItem value="harvested">Geoogst</SelectItem>
                  <SelectItem value="planned">Gepland</SelectItem>
                  <SelectItem value="issue">Probleem</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variety">Variëteit</Label>
              <Input
                id="variety"
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                placeholder="Bijv. Roma, Winter Wheat"
                disabled={viewOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="planted_at">Geplant Op</Label>
              <Input
                id="planted_at"
                type="date"
                value={formData.planted_at}
                onChange={(e) => setFormData({ ...formData, planted_at: e.target.value })}
                disabled={viewOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_harvest">Verwachte Oogst</Label>
              <Input
                id="expected_harvest"
                type="date"
                value={formData.expected_harvest}
                onChange={(e) => setFormData({ ...formData, expected_harvest: e.target.value })}
                disabled={viewOnly}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="area_hectares">Oppervlakte (hectaren)</Label>
            <Input
              id="area_hectares"
              type="number"
              step="0.01"
              min="0"
              max="99999999.99"
              value={formData.area_hectares}
              onChange={(e) => setFormData({ ...formData, area_hectares: e.target.value })}
              placeholder="Bijv. 2.5"
              disabled={viewOnly}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Extra informatie over deze crop..."
              rows={3}
              disabled={viewOnly}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {viewOnly ? "Sluiten" : "Annuleren"}
            </Button>
            {!viewOnly && (
              <Button type="submit" className="bg-agri-green hover:bg-agri-green-dark text-white" disabled={loading}>
                {loading ? "Opslaan..." : cropToEdit ? "Bijwerken" : "Toevoegen"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
