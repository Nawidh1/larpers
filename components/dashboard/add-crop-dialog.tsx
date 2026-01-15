"use client"

import { useState } from "react"
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
}

export function AddCropDialog({ open, onOpenChange, onSuccess, cropToEdit }: AddCropDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: cropToEdit?.name || "",
    location: cropToEdit?.location || "",
    latitude: cropToEdit?.latitude?.toString() || "",
    longitude: cropToEdit?.longitude?.toString() || "",
    status: (cropToEdit?.status || "growing") as "growing" | "harvested" | "planned" | "issue",
    variety: cropToEdit?.variety || "",
    planted_at: cropToEdit?.planted_at ? cropToEdit.planted_at.split("T")[0] : "",
    expected_harvest: cropToEdit?.expected_harvest ? cropToEdit.expected_harvest.split("T")[0] : "",
    area_hectares: cropToEdit?.area_hectares?.toString() || "",
    notes: cropToEdit?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
        const { error: createProfileError } = await supabase
          .from("profiles")
          .insert([{ id: user.id, role: "farmer" }])

        if (createProfileError) {
          console.error("Error creating profile:", createProfileError)
          setError("Je profiel kon niet worden aangemaakt. Ververs de pagina en probeer het opnieuw.")
          setLoading(false)
          return
        }
      }

      // Validate required fields
      if (!formData.name.trim() || !formData.location.trim()) {
        setError("Naam en locatie zijn verplicht")
        setLoading(false)
        return
      }

      const cropData = {
        user_id: user.id,
        name: formData.name.trim(),
        location: formData.location.trim(),
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        status: formData.status,
        variety: formData.variety.trim() || null,
        planted_at: formData.planted_at || null,
        expected_harvest: formData.expected_harvest || null,
        area_hectares: formData.area_hectares ? parseFloat(formData.area_hectares) : null,
        notes: formData.notes.trim() || null,
      }

      if (cropToEdit) {
        // Update existing crop
        const { error: updateError } = await supabase
          .from("crops")
          .update(cropData)
          .eq("id", cropToEdit.id)

        if (updateError) throw updateError
      } else {
        // Insert new crop
        const { error: insertError } = await supabase.from("crops").insert([cropData])

        if (insertError) throw insertError
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
      console.error("Error saving crop:", err)
      setError(err.message || "Er is een fout opgetreden bij het opslaan van de crop")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cropToEdit ? "Crop Bewerken" : "Nieuwe Crop Toevoegen"}</DialogTitle>
          <DialogDescription>
            {cropToEdit
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
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="52.1326"
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
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="5.2913"
              />
              <p className="text-xs text-muted-foreground">Voor kaart weergave</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_harvest">Verwachte Oogst</Label>
              <Input
                id="expected_harvest"
                type="date"
                value={formData.expected_harvest}
                onChange={(e) => setFormData({ ...formData, expected_harvest: e.target.value })}
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
              value={formData.area_hectares}
              onChange={(e) => setFormData({ ...formData, area_hectares: e.target.value })}
              placeholder="Bijv. 2.5"
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
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuleren
            </Button>
            <Button type="submit" className="bg-agri-green hover:bg-agri-green-dark text-white" disabled={loading}>
              {loading ? "Opslaan..." : cropToEdit ? "Bijwerken" : "Toevoegen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
