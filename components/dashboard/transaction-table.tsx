"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw, Lock, Plus, Edit, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { canWriteClient, isAuditorClient } from "@/lib/supabase/roles"
import { AddTransactionDialog } from "@/components/dashboard/add-transaction-dialog"
import type { Transaction } from "@/lib/supabase/types"

export function TransactionTable() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [canWrite, setCanWrite] = useState(true)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

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

  const handleDelete = async (transactionId: string) => {
    if (!confirm("Weet je zeker dat je deze transactie wilt verwijderen?")) {
      return
    }

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Get transaction before deleting to check if it's linked to a bank account
      const { data: transaction } = await supabase
        .from("transactions")
        .select("bank_account_id, status")
        .eq("id", transactionId)
        .eq("user_id", user.id)
        .single()

      const { error } = await supabase.from("transactions").delete().eq("id", transactionId).eq("user_id", user.id)

      if (error) {
        throw error
      }

      // Automatically sync bank account balance if transaction was linked to an account
      if (transaction?.bank_account_id && transaction.status === "completed") {
        try {
          await fetch("/api/banking/sync", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ accountId: transaction.bank_account_id }),
          })
          // Silently update - no need to show alert for automatic sync
        } catch (syncError) {
          // Don't fail the delete if sync fails
          console.warn("Failed to auto-sync bank account:", syncError)
        }
      }

      fetchTransactions()
      // Dispatch custom event to notify other components (like BalanceCard) to refresh
      window.dispatchEvent(new Event("transaction-changed"))
    } catch (err) {
      console.error("Error deleting transaction:", err)
      alert("Fout bij het verwijderen van transactie")
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingTransaction(null)
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    fetchTransactions()
    // Dispatch custom event to notify other components (like BalanceCard) to refresh
    window.dispatchEvent(new Event("transaction-changed"))
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
          {!isReadOnly && canWrite && (
            <Button variant="default" size="sm" onClick={handleAdd} className="h-8 bg-agri-green hover:bg-agri-green-dark text-white">
              <Plus size={14} className="mr-1" />
              Toevoegen
            </Button>
          )}
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
            <p className="mb-3">Geen transacties gevonden.</p>
            {!isReadOnly && canWrite && (
              <Button onClick={handleAdd} variant="outline" size="sm" className="bg-agri-green hover:bg-agri-green-dark text-white border-0">
                <Plus size={14} className="mr-2" />
                Voeg je eerste transactie toe
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Beschrijving</TableHead>
                <TableHead>Categorie</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Bedrag</TableHead>
                {!isReadOnly && canWrite && <TableHead className="text-right">Acties</TableHead>}
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
                      {tx.status === "completed" ? "Voltooid" : tx.status === "pending" ? "In behandeling" : "Geannuleerd"}
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
                  {!isReadOnly && canWrite && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(tx)}
                          title="Bewerken"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(tx.id)}
                          title="Verwijderen"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </div>

      <AddTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleDialogSuccess}
        transactionToEdit={editingTransaction}
      />
    </div>
  )
}
