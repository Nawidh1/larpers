"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddReportDialog({ open, onOpenChange, onSuccess }: AddReportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    type: "custom" as "crop" | "financial" | "climate" | "custom",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!formData.title.trim()) {
        setError("Titel is verplicht")
        setLoading(false)
        return
      }

      const response = await fetch("/api/reports/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          type: formData.type,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fout bij het aanmaken van rapport")
      }

      // Reset form and close dialog
      setFormData({
        title: "",
        type: "custom",
      })
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error("Error creating report:", err)
      setError(err?.message || "Er is een fout opgetreden bij het aanmaken van het rapport")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuw Rapport Aanmaken</DialogTitle>
          <DialogDescription>Kies een type en geef het rapport een titel</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Rapport Titel <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Bijv. Maandelijks Overzicht Januari 2025"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Rapport Type</Label>
            <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="crop">Crop Rapport</SelectItem>
                <SelectItem value="financial">Financieel Rapport</SelectItem>
                <SelectItem value="climate">Klimaat Rapport</SelectItem>
                <SelectItem value="custom">Volledig Overzicht</SelectItem>
              </SelectContent>
            </Select>
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
              {loading ? "Aanmaken..." : "Aanmaken"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
