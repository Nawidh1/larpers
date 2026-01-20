"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { canWriteClient, isAuditorClient } from "@/lib/supabase/roles"
import type { Transaction } from "@/lib/supabase/types"

export function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [canWrite, setCanWrite] = useState(true)
  const [isReadOnly, setIsReadOnly] = useState(false)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Check permissions
      const hasWriteAccess = await canWriteClient()
      const auditor = await isAuditorClient()
      setCanWrite(hasWriteAccess)
      setIsReadOnly(auditor)

      // For auditors, fetch all transactions (read-only access)
      const query = auditor
        ? supabase.from("transactions").select("*").order("date", { ascending: false }).limit(20)
        : supabase
            .from("transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(20)

      const { data, error } = await query

      if (error) {
        console.error("Error fetching transactions:", error)
      } else {
        setTransactions((data as Transaction[]) || [])
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  return (
    <div className="space-y-3" suppressHydrationWarning>
      <div className="flex items-center justify-between" suppressHydrationWarning>
        <div>
          {isReadOnly && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Lock size={12} />
              <span>Alleen-lezen modus</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchTransactions} disabled={loading} className="h-8 w-8">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden" suppressHydrationWarning>
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm" suppressHydrationWarning>
            Transacties laden...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm" suppressHydrationWarning>
            Geen transacties gevonden. Voeg je eerste transactie toe om te beginnen.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{formatDate(tx.date)}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>{tx.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={tx.status === "completed" ? "default" : "secondary"}
                      className={tx.status === "completed" ? "bg-agri-green text-white hover:bg-agri-green" : ""}
                    >
                      {tx.status === "completed" ? "Completed" : tx.status === "pending" ? "Pending" : "Cancelled"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${tx.type === "income" ? "text-agri-green" : "text-foreground"}`}
                  >
                    {tx.type === "income" ? "+" : "-"}€{Math.abs(Number(tx.amount)).toLocaleString("nl-NL", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </div>
    </div>
  )
}
