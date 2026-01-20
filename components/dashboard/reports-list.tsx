"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Report } from "@/lib/supabase/types"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ReportsListProps {
  refreshKey?: number
}

export function ReportsList({ refreshKey }: ReportsListProps = {}) {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    loadReports()
  }, [refreshKey])

  async function loadReports() {
    try {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Je bent niet ingelogd")
        setLoading(false)
        return
      }

      const { data, error: fetchError } = await supabase
        .from("reports")
        .select("*")
        .eq("user_id", user.id)
        .order("generated_at", { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      setReports((data as Report[]) || [])
    } catch (err: any) {
      console.error("Error loading reports:", err)
      setError(err?.message || "Fout bij het laden van rapporten")
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadPDF(report: Report) {
    try {
      setDownloading(report.id)
      const response = await fetch("/api/reports/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: report.type,
          title: report.title,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fout bij het genereren van PDF")
      }

      const data = await response.json()

      // Open PDF in new window for printing/downloading
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(data.htmlContent)
        printWindow.document.close()
        printWindow.onload = () => {
          printWindow.print()
        }
      }
    } catch (err: any) {
      console.error("Error downloading PDF:", err)
      alert(err?.message || "Fout bij het downloaden van PDF")
    } finally {
      setDownloading(null)
    }
  }

  async function handleDownloadCSV(report: Report) {
    try {
      setDownloading(report.id)
      const response = await fetch("/api/reports/generate-csv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: report.type,
          title: report.title,
          format: "html", // Download as HTML with PDF styling (Excel-compatible)
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Fout bij het genereren van bestand")
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = `${report.title.replace(/[^a-z0-9]/gi, "_")}.html`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "")
        }
      }

      // Check content type
      const contentType = response.headers.get("Content-Type")
      if (!contentType || (!contentType.includes("html") && !contentType.includes("csv"))) {
        // Try to parse as JSON error
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || "Ongeldig bestandsformaat ontvangen")
        } catch {
          throw new Error("Ongeldig bestandsformaat ontvangen")
        }
      }

      // Create blob and download
      const blob = await response.blob()
      
      // Verify blob is not empty
      if (blob.size === 0) {
        throw new Error("Leeg bestand ontvangen. Er is mogelijk geen data beschikbaar.")
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      // Reload reports to show updated list
      loadReports()
    } catch (err: any) {
      console.error("Error downloading file:", err)
      alert(err?.message || "Fout bij het downloaden van bestand")
    } finally {
      setDownloading(null)
    }
  }

  async function handleDelete(reportId: string) {
    if (!confirm("Weet je zeker dat je dit rapport wilt verwijderen?")) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("reports").delete().eq("id", reportId)

      if (error) {
        throw error
      }

      // Reload reports
      loadReports()
    } catch (err: any) {
      console.error("Error deleting report:", err)
      alert(err?.message || "Fout bij het verwijderen van rapport")
    }
  }

  function getTypeLabel(type: string) {
    const labels: Record<string, string> = {
      crop: "Crop",
      financial: "Financieel",
      climate: "Klimaat",
      custom: "Volledig",
    }
    return labels[type] || type
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Rapporten laden...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Nog geen rapporten aangemaakt</p>
        <p className="text-sm text-muted-foreground mt-2">Maak een nieuw rapport aan om te beginnen</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <FileText size={20} className="text-agri-green" />
                </div>
                <div>
                  <p className="font-medium">{report.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-muted-foreground">{formatDate(report.generated_at)}</p>
                    <span className="text-xs px-2 py-0.5 bg-muted rounded">{getTypeLabel(report.type)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPDF(report)}
                  disabled={downloading === report.id}
                >
                  <Download size={16} className="mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadCSV(report)}
                  disabled={downloading === report.id}
                >
                  <Download size={16} className="mr-2" />
                  CSV
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(report.id)}>
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
