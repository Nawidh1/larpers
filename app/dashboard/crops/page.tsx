import { Header } from "@/components/dashboard/header"
import { CropTable } from "@/components/dashboard/crop-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function CropsPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Crop Monitoring" />

      <div className="flex-1 p-6">
        <Card>
          <CardHeader>
            <CardTitle>All Crops</CardTitle>
          </CardHeader>
          <CardContent>
            <CropTable />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
