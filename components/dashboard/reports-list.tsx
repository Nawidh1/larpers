"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download } from "lucide-react"

const reports = [
  { id: "1", title: "Weekly Crop Report", type: "PDF", date: "Jan 12, 2025" },
  { id: "2", title: "Financial Overview", type: "CSV", date: "Jan 10, 2025" },
  { id: "3", title: "Climate Analysis", type: "CSV", date: "Jan 8, 2025" },
  { id: "4", title: "Monthly Summary", type: "PDF", date: "Jan 1, 2025" },
  { id: "5", title: "Harvest Forecast", type: "PDF", date: "Dec 28, 2024" },
]

export function ReportsList() {
  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <FileText size={20} className="text-agri-green" />
                </div>
                <div>
                  <p className="font-medium">{report.title}</p>
                  <p className="text-sm text-muted-foreground">{report.date}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download size={16} className="mr-2" />
                Download {report.type}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
