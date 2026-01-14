import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface FieldDetailsCardProps {
  name: string
  imageSrc?: string
}

export function FieldDetailsCard({ name, imageSrc }: FieldDetailsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-[120px] rounded-lg overflow-hidden">
          <Image
            src={imageSrc || "/placeholder.svg?height=120&width=300&query=tomato field agricultural landscape"}
            alt={name}
            fill
            className="object-cover"
          />
        </div>
      </CardContent>
    </Card>
  )
}
