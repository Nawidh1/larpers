"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { ReportsList } from "@/components/dashboard/reports-list"
import { AddReportDialog } from "@/components/dashboard/add-report-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, FileText } from "lucide-react"

export default function ReportsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleReportCreated = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="flex flex-col h-full" suppressHydrationWarning>
      <Header title="Reports">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            className="bg-agri-green hover:bg-agri-green-dark text-white"
            size="sm"
            onClick={() => setDialogOpen(true)}
          >
            <Plus size={16} className="mr-2" />
            Nieuw Rapport
          </Button>
        </div>
      </Header>

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-auto" suppressHydrationWarning>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText size={20} className="text-agri-green" />
              Gegenereerde Rapporten
            </CardTitle>
            <CardDescription>
              Bekijk en beheer al je gegenereerde financiële en operationele rapporten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ReportsList refreshKey={refreshKey} />
          </CardContent>
        </Card>
      </div>

      <AddReportDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={handleReportCreated} />
    </div>
  )
}
