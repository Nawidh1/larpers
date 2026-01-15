import { Header } from "@/components/dashboard/header"
import { TransactionTable } from "@/components/dashboard/transaction-table"
import { FinanceChart } from "@/components/dashboard/charts/finance-chart"
import { BankAccountsManager } from "@/components/dashboard/bank-accounts-manager"
import { TransactionExportButton } from "@/components/dashboard/transaction-export-button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTotalBalance } from "@/lib/supabase/queries"

export default async function FinancePage() {
  const balance = await getTotalBalance()
  const balanceFormatted = `€${balance.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="flex flex-col h-full">
      <Header title="Finance" />

      <div className="flex-1 p-6 space-y-6">
        {/* Export Button for Auditors */}
        <TransactionExportButton />
        {/* Balance Card */}
        <Card className="bg-agri-green text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Total Balance</p>
                <p className="text-4xl font-bold">{balanceFormatted}</p>
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bank Accounts */}
        <BankAccountsManager />

        {/* Transactions */}
        <Card>
          <CardContent className="p-6">
            <TransactionTable />
          </CardContent>
        </Card>

        {/* Chart */}
        <FinanceChart />
      </div>
    </div>
  )
}
