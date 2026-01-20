"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, FileSpreadsheet, AlertCircle } from "lucide-react"
import { isAuditorClient, isAdminClient } from "@/lib/supabase/roles"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function TransactionExportButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [success, setSuccess] = useState(false)

  // Check if user is auditor or admin
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const auditor = await isAuditorClient()
        const admin = await isAdminClient()
        const authorized = auditor || admin
        setIsAuthorized(authorized)
      } catch (err) {
        console.error("Error checking authorization:", err)
        setIsAuthorized(false)
      }
    }
    checkAuthorization()
  }, [])

  const handleExport = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/transactions/export")

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = "Export mislukt"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      // Check if response is CSV (should start with BOM or CSV content)
      const contentType = response.headers.get("Content-Type")
      if (!contentType || !contentType.includes("csv")) {
        // Try to parse as JSON error
        try {
          const errorData = await response.json()
          throw new Error(errorData.error || "Ongeldig bestandsformaat ontvangen")
        } catch {
          throw new Error("Ongeldig bestandsformaat ontvangen")
        }
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = "transacties-export.csv"
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, "")
        }
      }

      // Create blob and download
      const blob = await response.blob()
      
      // Verify blob is not empty
      if (blob.size === 0) {
        throw new Error("Leeg bestand ontvangen")
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error("Error exporting transactions:", err)
      setError(err.message || "Er is een fout opgetreden bij het exporteren van de transacties")
    } finally {
      setLoading(false)
    }
  }

  // Don't show button if not authorized
  if (isAuthorized === false) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Export is alleen beschikbaar voor auditors en admins
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="py-2 border-green-500 bg-green-50">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-xs text-green-800">
            Export succesvol gedownload!
          </AlertDescription>
        </Alert>
      )}
      <Button 
        onClick={handleExport} 
        disabled={loading || isAuthorized === null} 
        className="w-full bg-agri-green hover:bg-agri-green-dark text-white disabled:opacity-50 disabled:cursor-not-allowed"
        size="sm"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporteren...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Exporteer naar CSV
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Download alle transacties voor jaarrekening
      </p>
    </div>
  )
}
