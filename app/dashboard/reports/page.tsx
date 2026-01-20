import { Header } from "@/components/dashboard/header"
import { ReportsList } from "@/components/dashboard/reports-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, FileText, Download } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="flex flex-col h-full" suppressHydrationWarning>
      <Header title="Reports">
        <div className="flex items-center gap-2 flex-wrap">
          <Button className="bg-agri-green hover:bg-agri-green-dark text-white" size="sm">
            <Plus size={16} className="mr-2" />
            Nieuw Rapport
          </Button>
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm">
            <Download size={16} className="mr-2" />
            Download CSV
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
            <ReportsList />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
