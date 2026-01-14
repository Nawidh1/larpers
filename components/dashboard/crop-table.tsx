"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const crops = [
  {
    id: "1",
    name: "Tomato Field",
    location: "Section A",
    status: "growing",
    action: "Crop Monitor",
  },
  {
    id: "2",
    name: "Wheat Field",
    location: "Section B",
    status: "harvested",
    action: "Crop Monitor",
  },
  {
    id: "3",
    name: "Corn Field",
    location: "Section C",
    status: "planned",
    action: "Crop Monitor",
  },
  {
    id: "4",
    name: "Potato Farm",
    location: "Section D",
    status: "issue",
    action: "Crop Monitor",
  },
  {
    id: "5",
    name: "Carrot Rows",
    location: "Section E",
    status: "growing",
    action: "Crop Monitor",
  },
]

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  growing: { label: "Growing", variant: "default" },
  harvested: { label: "Harvested", variant: "secondary" },
  planned: { label: "Planned", variant: "outline" },
  issue: { label: "Issue", variant: "destructive" },
}

export function CropTable() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button size="sm" className="bg-agri-green hover:bg-agri-green-dark text-white">
          <Plus size={16} className="mr-2" />
          Add Crop
        </Button>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[150px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {crops.map((crop) => {
              const status = statusConfig[crop.status]
              return (
                <TableRow key={crop.id}>
                  <TableCell className="font-medium">{crop.name}</TableCell>
                  <TableCell>{crop.location}</TableCell>
                  <TableCell>
                    <Badge
                      variant={status.variant}
                      className={crop.status === "growing" ? "bg-agri-green text-white hover:bg-agri-green" : ""}
                    >
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="link" size="sm" className="text-agri-blue p-0 h-auto">
                        {crop.action}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
