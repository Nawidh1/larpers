"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { canWriteClient } from "@/lib/supabase/roles"
import { CreditCard, Plus, RefreshCw, Trash2, Link2 as LinkIcon, CheckCircle2 } from "lucide-react"
import type { BankAccount } from "@/lib/supabase/types"

export function BankAccountsManager() {
  const router = useRouter()
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [canWrite, setCanWrite] = useState(true)
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts()
    checkPermissions()
  }, [])

  const checkPermissions = async () => {
    const hasWriteAccess = await canWriteClient()
    setCanWrite(hasWriteAccess)
  }

  const fetchAccounts = async () => {
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

      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching bank accounts:", error)
      } else {
        setAccounts((data as BankAccount[]) || [])
      }
    } catch (err) {
      console.error("Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (accountId: string, silent = false) => {
    try {
      if (!silent) {
        setSyncingAccountId(accountId)
      }
      
      const response = await fetch("/api/banking/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sync failed")
      }

      // Only show success message if not silent (manual sync)
      if (!silent) {
        if (data.balance !== undefined) {
          const balanceText = `€${data.balance.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          const transactionsText = data.transactionsCount > 0 
            ? `${data.transactionsCount} transactie${data.transactionsCount !== 1 ? 's' : ''}`
            : "geen transacties"
          alert(`Saldo bijgewerkt: ${balanceText}\nGebaseerd op ${transactionsText}`)
        } else {
          alert("Account gesynchroniseerd!")
        }
      }

      // Refresh accounts to show updated data
      await fetchAccounts()
      
      // Use router.refresh() instead of full page reload to preserve design state
      // This refreshes server components without losing client-side state
      if (!silent) {
        router.refresh()
      }
    } catch (err: any) {
      console.error("Error syncing:", err)
      if (!silent) {
        alert(err.message || "Fout bij synchroniseren")
      }
    } finally {
      if (!silent) {
        setSyncingAccountId(null)
      }
    }
  }

  // Listen for transaction changes to auto-sync ALL manual accounts
  useEffect(() => {
    const handleTransactionChange = async () => {
      // Small delay to ensure transaction is saved first
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Fetch fresh accounts list and auto-sync all manual accounts
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: freshAccounts } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .eq("provider", "manual")

      if (freshAccounts && freshAccounts.length > 0) {
        // Sync all manual accounts in parallel
        const syncPromises = freshAccounts.map(async (account) => {
          try {
            const response = await fetch("/api/banking/sync", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ accountId: account.id }),
            })
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}))
              throw new Error(errorData.error || `Sync failed for account ${account.id}`)
            }
            
            return { success: true, accountId: account.id }
          } catch (syncError) {
            console.warn(`Failed to auto-sync bank account ${account.account_name}:`, syncError)
            return { success: false, accountId: account.id }
          }
        })
        
        // Wait for all syncs to complete
        await Promise.all(syncPromises)
        
        // Update accounts list once after all syncs
        fetchAccounts()
      }
    }

    window.addEventListener("transaction-changed", handleTransactionChange)
    return () => {
      window.removeEventListener("transaction-changed", handleTransactionChange)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (accountId: string) => {
    if (!confirm("Weet je zeker dat je deze bankrekening wilt verwijderen?")) {
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from("bank_accounts").delete().eq("id", accountId)

      if (error) {
        console.error("Error deleting account:", error)
        alert("Fout bij verwijderen")
      } else {
        fetchAccounts()
      }
    } catch (err) {
      console.error("Error:", err)
      alert("Fout bij verwijderen")
    }
  }

  const formatBalance = (balance: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: currency,
    }).format(balance)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nog niet gesynchroniseerd"
    const date = new Date(dateString)
    return date.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard size={20} />
            Bankrekeningen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center text-muted-foreground" suppressHydrationWarning>Laden...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard size={20} />
                Bankrekeningen
              </CardTitle>
              <CardDescription>Koppel je bankrekening via Open Banking voor automatische synchronisatie</CardDescription>
            </div>
            {canWrite && (
              <Button
                size="sm"
                className="bg-agri-green hover:bg-agri-green-dark text-white"
                onClick={() => setDialogOpen(true)}
              >
                <Plus size={16} className="mr-2" />
                Rekening Koppelen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="p-8 text-center space-y-4">
              <CreditCard size={48} className="mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium mb-2">Geen bankrekeningen gekoppeld</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Koppel je eerste bankrekening om automatisch transacties te synchroniseren
                </p>
                {canWrite && (
                  <Button onClick={() => setDialogOpen(true)} className="bg-agri-green hover:bg-agri-green-dark text-white">
                    <LinkIcon size={16} className="mr-2" />
                    Eerste Rekening Koppelen
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{account.account_name}</h3>
                        <Badge variant={account.is_active ? "default" : "secondary"}>
                          {account.is_active ? "Actief" : "Inactief"}
                        </Badge>
                        <Badge variant="outline">{account.provider}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{account.bank_name}</p>
                      {account.iban && (
                        <p className="text-xs text-muted-foreground font-mono">{account.iban}</p>
                      )}
                      <div className="mt-3 flex items-center gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Saldo</p>
                          <p className="text-lg font-bold">{formatBalance(account.balance, account.currency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Laatst gesynchroniseerd</p>
                          <p className="text-sm">{formatDate(account.last_synced_at)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSync(account.id)}
                        disabled={syncingAccountId === account.id || !account.is_active}
                        title="Synchroniseer transacties"
                      >
                        <RefreshCw size={14} className={`mr-2 ${syncingAccountId === account.id ? "animate-spin" : ""}`} />
                        Sync
                      </Button>
                      {canWrite && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(account.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddBankAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchAccounts} />
    </>
  )
}

function AddBankAccountDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    bank_name: "",
    account_name: "",
    iban: "",
    account_type: "checking" as "checking" | "savings" | "business",
    provider: "manual" as "plaid" | "tink" | "yapily" | "manual",
  })

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

      // Check if user has a profile (required for RLS)
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      
      if (!profile) {
        setError("Je profiel bestaat nog niet. Ververs de pagina en probeer het opnieuw.")
        setLoading(false)
        return
      }

      // Check permissions
      const hasWriteAccess = await canWriteClient()
      if (!hasWriteAccess) {
        setError("Je hebt geen rechten om bankrekeningen toe te voegen. Alleen farmers en admins kunnen dit doen.")
        setLoading(false)
        return
      }

      if (!formData.bank_name.trim() || !formData.account_name.trim()) {
        setError("Bank naam en rekening naam zijn verplicht")
        setLoading(false)
        return
      }

      const accountData = {
        user_id: user.id,
        bank_name: formData.bank_name.trim(),
        account_name: formData.account_name.trim(),
        account_number: formData.iban.trim() || null, // Use IBAN as account_number if provided
        iban: formData.iban.trim() || null,
        account_type: formData.account_type,
        provider: formData.provider,
        balance: 0,
        currency: "EUR",
        is_active: true,
      }

      const { data, error: insertError } = await supabase.from("bank_accounts").insert([accountData]).select()

      if (insertError) {
        console.error("Supabase insert error details:", {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          error: insertError,
        })
        const errorMsg = insertError.message || insertError.code || insertError.details || "Er is een fout opgetreden bij het opslaan"
        throw new Error(errorMsg)
      }

      // Reset form
      setFormData({
        bank_name: "",
        account_name: "",
        iban: "",
        account_type: "checking",
        provider: "manual",
      })
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error("Error saving bank account - full error:", {
        error: err,
        message: err?.message,
        stack: err?.stack,
        name: err?.name,
        toString: err?.toString(),
      })
      const errorMessage = 
        err?.message || 
        err?.error?.message || 
        err?.toString() || 
        (typeof err === 'string' ? err : "Er is een fout opgetreden bij het opslaan van de bankrekening")
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Bankrekening Koppelen</DialogTitle>
          <DialogDescription>
            Voeg een bankrekening toe voor automatische transactie synchronisatie
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">
              Open Banking Provider <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.provider}
              onValueChange={(value: any) => setFormData({ ...formData, provider: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Handmatig (geen API)</SelectItem>
                <SelectItem value="plaid">Plaid</SelectItem>
                <SelectItem value="tink">Tink</SelectItem>
                <SelectItem value="yapily">Yapily</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {formData.provider === "manual"
                ? "Handmatige rekening - je moet transacties zelf toevoegen"
                : `Open Banking via ${formData.provider} - transacties worden automatisch gesynchroniseerd`}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bank_name">
                Bank Naam <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="Bijv. Rabobank, ING"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">
                Rekening Naam <span className="text-destructive">*</span>
              </Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="Bijv. Zakelijke Rekening"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN (optioneel)</Label>
            <Input
              id="iban"
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              placeholder="NL91 ABNA 0417 1643 00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_type">Rekening Type</Label>
            <Select
              value={formData.account_type}
              onValueChange={(value: any) => setFormData({ ...formData, account_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Betaalrekening</SelectItem>
                <SelectItem value="savings">Spaarrekening</SelectItem>
                <SelectItem value="business">Zakelijke Rekening</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.provider !== "manual" && (
            <Alert>
              <LinkIcon size={16} className="mr-2" />
              <AlertDescription>
                Na het toevoegen van deze rekening kun je de Open Banking autorisatie voltooien via de provider.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Annuleren
            </Button>
            <Button type="submit" className="bg-agri-green hover:bg-agri-green-dark text-white" disabled={loading}>
              {loading ? "Opslaan..." : "Koppelen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
