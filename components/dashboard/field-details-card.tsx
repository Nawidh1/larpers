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
        <div className="relative h-[120px] rounded-lg overflow-hidden bg-muted">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center p-4">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-agri-green/10 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-agri-green"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <p className="text-xs text-muted-foreground">Geen afbeelding</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
