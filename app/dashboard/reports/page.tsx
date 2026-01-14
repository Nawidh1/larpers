import { Header } from "@/components/dashboard/header"
import { ReportsList } from "@/components/dashboard/reports-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, FileText, Download } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Reports">
        <div className="flex items-center gap-2">
          <Button className="bg-agri-green hover:bg-agri-green-dark text-white">
            <Plus size={16} className="mr-2" />
            New Report
          </Button>
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Download PDF
          </Button>
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            Download CSV
          </Button>
        </div>
      </Header>

      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={20} />
              Generated Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReportsList />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
