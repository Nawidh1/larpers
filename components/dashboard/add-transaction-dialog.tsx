"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, Loader2 } from "lucide-react"
import type { Transaction, BankAccount } from "@/lib/supabase/types"

interface AddTransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  transactionToEdit?: Transaction | null
}

export function AddTransactionDialog({ open, onOpenChange, onSuccess, transactionToEdit }: AddTransactionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [formData, setFormData] = useState({
    date: "",
    description: "",
    category: "",
    amount: "",
    type: "expense" as "income" | "expense",
    status: "completed" as "pending" | "completed" | "cancelled",
    bank_account_id: "",
  })

  // Common categories for agricultural transactions
  const expenseCategories = [
    "Zaden",
    "Meststof",
    "Pesticiden",
    "Benodigdheden",
    "Apparatuur",
    "Onderhoud",
    "Transport",
    "Brandstof",
    "Arbeid",
    "Verzekering",
    "Overig",
  ]

  const incomeCategories = [
    "Verkoop",
    "Subsidie",
    "Verhuur",
    "Diensten",
    "Overig",
  ]

  useEffect(() => {
    if (open) {
      setError(null)
      fetchBankAccounts()
      
      if (transactionToEdit) {
        setFormData({
          date: transactionToEdit.date ? transactionToEdit.date.split("T")[0] : "",
          description: transactionToEdit.description || "",
          category: transactionToEdit.category || "",
          amount: Math.abs(Number(transactionToEdit.amount)).toString(),
          type: transactionToEdit.type,
          status: transactionToEdit.status,
          bank_account_id: transactionToEdit.bank_account_id || "",
        })
      } else {
        // Set today's date as default
        const today = new Date().toISOString().split("T")[0]
        setFormData({
          date: today,
          description: "",
          category: "",
          amount: "",
          type: "expense",
          status: "completed",
          bank_account_id: "",
        })
      }
    }
  }, [open, transactionToEdit])

  const fetchBankAccounts = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (!error && data) {
        setBankAccounts(data as BankAccount[])
      }
    } catch (err) {
      console.error("Error fetching bank accounts:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Je bent niet ingelogd")
        setLoading(false)
        return
      }

      // Validation
      if (!formData.date) {
        setError("Datum is verplicht")
        setLoading(false)
        return
      }

      if (!formData.description.trim()) {
        setError("Beschrijving is verplicht")
        setLoading(false)
        return
      }

      if (!formData.category.trim()) {
        setError("Categorie is verplicht")
        setLoading(false)
        return
      }

      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        setError("Bedrag moet een positief getal zijn")
        setLoading(false)
        return
      }

      const transactionData = {
        user_id: user.id,
        date: formData.date,
        description: formData.description.trim(),
        category: formData.category.trim(),
        amount: formData.type === "expense" ? -amount : amount, // Expenses are negative
        type: formData.type,
        status: formData.status,
        bank_account_id: formData.bank_account_id || null,
      }

      let affectedAccountId: string | null = null

      if (transactionToEdit) {
        // Store old account ID before update
        affectedAccountId = transactionToEdit.bank_account_id || transactionData.bank_account_id || null
        
        // Update existing transaction
        const { error: updateError } = await supabase
          .from("transactions")
          .update(transactionData)
          .eq("id", transactionToEdit.id)
          .eq("user_id", user.id)

        if (updateError) {
          throw new Error(updateError.message || "Fout bij het bijwerken van transactie")
        }
      } else {
        // Insert new transaction
        const { error: insertError } = await supabase.from("transactions").insert([transactionData])

        if (insertError) {
          throw new Error(insertError.message || "Fout bij het toevoegen van transactie")
        }
        
        affectedAccountId = transactionData.bank_account_id || null
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: "",
        amount: "",
        type: "expense",
        status: "completed",
        bank_account_id: "",
      })

      onOpenChange(false)
      onSuccess()
      
      // Dispatch event to sync all manual bank accounts (happens after onSuccess)
      // This ensures all accounts are synced, not just the linked one
      window.dispatchEvent(new Event("transaction-changed"))
    } catch (err: any) {
      console.error("Error saving transaction:", err)
      setError(err?.message || "Er is een fout opgetreden bij het opslaan van de transactie")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transactionToEdit ? "Transactie Bewerken" : "Nieuwe Transactie Toevoegen"}</DialogTitle>
          <DialogDescription>
            {transactionToEdit
              ? "Bewerk de transactie gegevens hieronder"
              : "Voeg een nieuwe inkomsten of uitgaven transactie toe aan je financiële overzicht"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                Datum <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.type} onValueChange={(value: "income" | "expense") => setFormData({ ...formData, type: value, category: "" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">💰 Inkomsten</SelectItem>
                  <SelectItem value="expense">💸 Uitgaven</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Beschrijving <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Bijv. Tomaten Verkoop, Zaad Aankoop, etc."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">
                Categorie <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer categorie" />
                </SelectTrigger>
                <SelectContent>
                  {(formData.type === "income" ? incomeCategories : expenseCategories).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">
                Bedrag (€) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value: "pending" | "completed" | "cancelled") => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">✅ Voltooid</SelectItem>
                  <SelectItem value="pending">⏳ In behandeling</SelectItem>
                  <SelectItem value="cancelled">❌ Geannuleerd</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account_id">Bankrekening (optioneel)</Label>
              <Select 
                value={formData.bank_account_id || "none"} 
                onValueChange={(value) => setFormData({ ...formData, bank_account_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Geen rekening geselecteerd" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen rekening</SelectItem>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.bank_name} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuleren
            </Button>
            <Button type="submit" disabled={loading} className="bg-agri-green hover:bg-agri-green-dark text-white">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {transactionToEdit ? "Bijwerken" : "Toevoegen"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
