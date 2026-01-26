import { Header } from "@/components/dashboard/header"
import { TransactionTable } from "@/components/dashboard/transaction-table"
import { FinanceChart } from "@/components/dashboard/charts/finance-chart"
import { BankAccountsManager } from "@/components/dashboard/bank-accounts-manager"
import { TransactionExportButton } from "@/components/dashboard/transaction-export-button"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign } from "lucide-react"

export default async function FinancePage() {
  return (
    <div className="flex flex-col h-full" suppressHydrationWarning>
      <Header title="Finance" />

      <div className="flex-1 p-4 md:p-6 space-y-4 md:space-y-6 overflow-auto" suppressHydrationWarning>
        {/* Balance Overview Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Balance Card - Now client-side for auto-updates */}
          <BalanceCard />

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

        {/* Finance Chart Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Saldo Overzicht</CardTitle>
            <CardDescription>Bekijk je saldo ontwikkeling over tijd</CardDescription>
          </CardHeader>
          <CardContent>
            <FinanceChart />
          </CardContent>
        </Card>

        {/* Transactions Card - Full Width */}
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
  )
}
