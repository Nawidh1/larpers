import { Header } from "@/components/dashboard/header"
import { TransactionTable } from "@/components/dashboard/transaction-table"
import { FinanceChart } from "@/components/dashboard/charts/finance-chart"
import { BankAccountsManager } from "@/components/dashboard/bank-accounts-manager"
import { TransactionExportButton } from "@/components/dashboard/transaction-export-button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTotalBalance } from "@/lib/supabase/queries"
import { DollarSign, TrendingUp, Wallet } from "lucide-react"

export default async function FinancePage() {
  const balance = await getTotalBalance()
  const balanceFormatted = `€${balance.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="flex flex-col h-full" suppressHydrationWarning>
      <Header title="Finance" />

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-auto" suppressHydrationWarning>
        {/* Balance Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Balance Card */}
          <Card className="lg:col-span-2 bg-gradient-to-br from-agri-green to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-5 w-5 text-green-100" />
                    <p className="text-green-100 text-sm font-medium">Totaal Saldo</p>
                  </div>
                  <p className="text-4xl md:text-5xl font-bold mb-2">{balanceFormatted}</p>
                  <p className="text-green-100 text-sm">Alle gekoppelde bankrekeningen</p>
                </div>
                <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-white/20">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Card */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-agri-green" />
                Export
              </CardTitle>
              <CardDescription className="text-xs">
                Exporteer transacties voor jaarrekening
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionExportButton />
            </CardContent>
          </Card>
        </div>

        {/* Bank Accounts Section */}
        <div>
          <BankAccountsManager />
        </div>

        {/* Charts and Transactions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Finance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Saldo Overzicht</CardTitle>
              <CardDescription>Bekijk je saldo ontwikkeling over tijd</CardDescription>
            </CardHeader>
            <CardContent>
              <FinanceChart />
            </CardContent>
          </Card>

          {/* Transactions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recente Transacties</CardTitle>
              <CardDescription>Laatste financiële transacties</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionTable />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
