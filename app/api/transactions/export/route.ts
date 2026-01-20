import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isAuditor } from "@/lib/supabase/roles-server"

/**
 * Export all financial transactions to CSV format
 * Available for auditors and admins
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is auditor or admin
    const auditor = await isAuditor()
    const { isAdmin } = await import("@/lib/supabase/roles-server")
    const admin = await isAdmin()

    if (!auditor && !admin) {
      return NextResponse.json({ error: "Forbidden: Only auditors and admins can export transactions" }, { status: 403 })
    }

    // Fetch all transactions (auditors can see all, admins can see all)
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false })

    if (error) {
      console.error("Error fetching transactions:", error)
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions found" }, { status: 404 })
    }

    // Calculate summary statistics
    const income = transactions.filter((t) => t.type === "income" && t.status === "completed")
    const expenses = transactions.filter((t) => t.type === "expense" && t.status === "completed")
    const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0)
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0)
    const net = totalIncome - totalExpenses

    // Build CSV with summary section
    const rows: string[][] = []
    
    // Header section
    rows.push(["FINANCIËLE TRANSACTIES EXPORT"])
    rows.push([`Gegenereerd op: ${new Date().toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`])
    rows.push([]) // Empty row for spacing
    
    // Summary section
    rows.push(["SAMENVATTING"])
    rows.push(["Totale Inkomsten", `€${totalIncome.toFixed(2).replace(".", ",")}`])
    rows.push(["Totale Uitgaven", `€${totalExpenses.toFixed(2).replace(".", ",")}`])
    rows.push(["Netto Resultaat", `€${net.toFixed(2).replace(".", ",")}`])
    rows.push(["Totaal Transacties", transactions.length.toString()])
    rows.push(["Voltooide Transacties", `${income.length + expenses.length}`])
    rows.push(["In behandeling", `${transactions.filter(t => t.status === "pending").length}`])
    rows.push([]) // Empty row for spacing
    
    // Data headers
    rows.push(["TRANSACTIES OVERZICHT"])
    const csvHeaders = [
      "ID",
      "Datum",
      "Beschrijving",
      "Categorie",
      "Bedrag",
      "Type",
      "Status",
      "Bank Rekening ID",
      "Externe Transactie ID",
      "Aangemaakt op",
    ]
    rows.push(csvHeaders)

    // Data rows
    const csvRows = transactions.map((tx) => {
      // Format dates as DD/MM/YYYY for Excel compatibility
      const date = formatExcelDate(tx.date)
      const created = formatExcelDateTime(tx.created_at)

      return [
        tx.id,
        date,
        escapeCsvField(tx.description),
        escapeCsvField(tx.category),
        Number(tx.amount).toFixed(2).replace(".", ","), // Dutch number format
        tx.type === "income" ? "Inkomsten" : "Uitgaven",
        tx.status === "completed" ? "Voltooid" : tx.status === "pending" ? "In behandeling" : "Geannuleerd",
        tx.bank_account_id || "",
        tx.external_transaction_id || "",
        created,
      ]
    })
    rows.push(...csvRows)

    // Combine all rows
    // Use semicolon (;) as delimiter for Excel compatibility (Dutch Excel uses ; by default)
    const delimiter = ";"
    const csvContent = rows.map((row) => 
      row.map((field) => {
        const str = String(field)
        // Always wrap in quotes for consistent Excel formatting
        return `"${str.replace(/"/g, '""')}"`
      }).join(delimiter)
    ).join("\r\n") // Use \r\n for Windows Excel compatibility

    // Add BOM for Excel compatibility (UTF-8)
    const csvWithBom = "\uFEFF" + csvContent

    // Generate filename with current date
    const now = new Date()
    const dateStr = now.toLocaleDateString("nl-NL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    const filename = `transacties-export-${dateStr}.csv`

    // Return CSV file
    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error exporting transactions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/**
 * Escape CSV field to handle semicolons, quotes, and newlines
 */
function escapeCsvField(field: string): string {
  if (!field) return ""
  // Replace newlines with spaces, remove carriage returns
  // Quotes will be escaped by wrapping function
  return field.replace(/\n/g, " ").replace(/\r/g, "")
}

/**
 * Format date to Excel-friendly format (DD/MM/YYYY)
 */
function formatExcelDate(dateString: string | Date): string {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
  } catch {
    return ""
  }
}

/**
 * Format date and time to Excel-friendly format (DD/MM/YYYY HH:MM)
 */
function formatExcelDateTime(dateString: string | Date): string {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return ""
  }
}
