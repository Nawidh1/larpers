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

    // Generate CSV content
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

    const csvRows = transactions.map((tx) => {
      const date = new Date(tx.date).toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      const created = new Date(tx.created_at).toLocaleDateString("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

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

    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

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
 * Escape CSV field to handle commas, quotes, and newlines
 */
function escapeCsvField(field: string): string {
  if (!field) return ""
  // Replace quotes with double quotes
  return field.replace(/"/g, '""').replace(/\n/g, " ").replace(/\r/g, "")
}
