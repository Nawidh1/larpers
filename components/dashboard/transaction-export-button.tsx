"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Loader2 } from "lucide-react"
import { isAuditorClient, isAdminClient } from "@/lib/supabase/roles"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function TransactionExportButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  // Check if user is auditor or admin
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        const auditor = await isAuditorClient()
        const admin = await isAdminClient()
        const authorized = auditor || admin
        console.log("Authorization check:", { auditor, admin, authorized })
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

    try {
      const response = await fetch("/api/transactions/export")

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Export failed" }))
        throw new Error(errorData.error || "Export failed")
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition")
      let filename = "transacties-export.csv"
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      console.error("Error exporting transactions:", err)
      setError(err.message || "Er is een fout opgetreden bij het exporteren van de transacties")
    } finally {
      setLoading(false)
    }
  }

  // Always show the component, but disable button if not authorized
  // The API will handle the actual authorization check
  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Jaarrekening Export</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Exporteer alle financiële transacties naar CSV-formaat voor jaarrekening doeleinden
                {isAuthorized === false && (
                  <span className="block mt-1 text-xs text-destructive">
                    Alleen beschikbaar voor auditors en admins
                  </span>
                )}
              </p>
            </div>
            <Button 
              onClick={handleExport} 
              disabled={loading || isAuthorized === false} 
              className="bg-agri-green hover:bg-agri-green-dark text-white disabled:opacity-50"
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
