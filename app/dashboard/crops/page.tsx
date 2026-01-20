import { Header } from "@/components/dashboard/header"
import { CropTable } from "@/components/dashboard/crop-table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sprout } from "lucide-react"

export default function CropsPage() {
  return (
    <div className="flex flex-col h-full" suppressHydrationWarning>
      <Header title="Crop Monitoring" />

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-auto" suppressHydrationWarning>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sprout className="h-5 w-5 text-agri-green" />
              Alle Gewassen
            </CardTitle>
            <CardDescription>
              Beheer en monitor al je gewassen en percelen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CropTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
