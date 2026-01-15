"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Database, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export function SeedDataButton() {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)

  const handleSeed = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch("/api/seed-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      let data
      try {
        data = await response.json()
      } catch (e) {
        throw new Error(`Server response error: ${response.status} ${response.statusText}`)
      }

      if (!response.ok) {
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          data: data
        })
        throw new Error(data.error || data.details || `Server error: ${response.status}`)
      }

      if (data.hasData) {
        setMessage({
          type: "info",
          text: "Je hebt al data. Verwijder eerst je bestaande data om nieuwe toe te voegen.",
        })
      } else {
        setMessage({
          type: "success",
          text: `Sample data toegevoegd! ${data.crops} percelen, ${data.transactions} transacties, ${data.climateData} klimaatmetingen. Ververs de pagina om het te zien.`,
        })
        // Auto refresh after 2 seconds
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error: any) {
      console.error("Error seeding data:", error)
      setMessage({
        type: "error",
        text: error.message || "Er is een fout opgetreden bij het toevoegen van sample data. Check de console voor details.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Weet je zeker dat je alle data wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.")) {
      return
    }

    setDeleting(true)
    setMessage(null)

    try {
      const response = await fetch("/api/seed-data", {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Er is een fout opgetreden")
      }

      setMessage({
        type: "success",
        text: "Alle data is verwijderd. Ververs de pagina.",
      })
      // Auto refresh after 2 seconds
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Er is een fout opgetreden bij het verwijderen van data",
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Test Data Beheer
        </CardTitle>
        <CardDescription>
          Voeg sample data toe om te zien hoe de website eruit ziet met informatie, of verwijder alle data om opnieuw te beginnen.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert
            variant={message.type === "error" ? "destructive" : message.type === "success" ? "default" : "default"}
            className={
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100"
                : message.type === "error"
                  ? ""
                  : "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-100"
            }
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : message.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handleSeed}
            disabled={loading || deleting}
            className="bg-agri-green hover:bg-agri-green-dark text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Data toevoegen...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Voeg Sample Data Toe
              </>
            )}
          </Button>

          <Button onClick={handleDelete} disabled={loading || deleting} variant="destructive">
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verwijderen...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Verwijder Alle Data
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Dit voegt 20 percelen, 20 transacties, 30 dagen klimaatdata en crop growth data toe voor demonstratie doeleinden.
        </p>
      </CardContent>
    </Card>
  )
}
