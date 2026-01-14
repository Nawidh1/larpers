"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

const transactions = [
  {
    id: "1",
    date: "01/03/2025",
    description: "Seed Purchase",
    category: "Seeds",
    amount: -150.0,
    status: "completed",
  },
  {
    id: "2",
    date: "02/03/2025",
    description: "Tomato Sales",
    category: "Sales",
    amount: 2500.0,
    status: "completed",
  },
  {
    id: "3",
    date: "05/03/2025",
    description: "Fertilizer",
    category: "Supplies",
    amount: -320.0,
    status: "pending",
  },
  {
    id: "4",
    date: "08/03/2025",
    description: "Equipment Rental",
    category: "Equipment",
    amount: -450.0,
    status: "completed",
  },
]

export function TransactionTable() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Transactions</h3>
        <div className="flex items-center gap-2">
          <Select defaultValue="this-month">
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>{tx.date}</TableCell>
                <TableCell>{tx.description}</TableCell>
                <TableCell>
                  <Badge
                    variant={tx.status === "completed" ? "default" : "secondary"}
                    className={tx.status === "completed" ? "bg-agri-green text-white hover:bg-agri-green" : ""}
                  >
                    {tx.status === "completed" ? "Paid" : "Pending"}
                  </Badge>
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${tx.amount > 0 ? "text-agri-green" : "text-foreground"}`}
                >
                  {tx.amount > 0 ? "+" : ""}€{Math.abs(tx.amount).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
