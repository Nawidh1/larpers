import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCrops, getTransactions, getClimateData } from "@/lib/supabase/queries"

// ============================================================================
// TYPES
// ============================================================================

type ReportType = "crop" | "financial" | "climate" | "custom"

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Escape CSV field to handle semicolons, quotes, and newlines
 * Note: We use semicolon as delimiter for Excel compatibility
 */
function escapeCsvField(field: string): string {
  if (!field) return ""
  // Replace newlines with spaces, remove carriage returns
  // Quotes will be escaped by arrayToCSV function
  return field.replace(/\n/g, " ").replace(/\r/g, "")
}

/**
 * Format date to Excel-friendly format (DD/MM/YYYY)
 * Excel recognizes DD/MM/YYYY format better than DD-MM-YYYY
 */
function formatDutchDate(dateString: string | null | undefined): string {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""
    
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    
    // Use slash separator for better Excel recognition
    return `${day}/${month}/${year}`
  } catch {
    return ""
  }
}

/**
 * Format amount to Dutch currency format (comma as decimal separator)
 */
function formatAmount(amount: number | null | undefined): string {
  if (!amount) return "0,00"
  return Number(amount).toFixed(2).replace(".", ",")
}

/**
 * Convert array of rows to CSV string
 * Uses semicolon (;) as delimiter for Excel compatibility (especially Dutch Excel)
 * All fields are wrapped in quotes for consistent formatting
 */
function arrayToCSV(rows: string[][]): string {
  // Use semicolon as delimiter for Excel compatibility (Dutch Excel uses ; by default)
  const delimiter = ";"
  return rows.map((row) => row.map((field) => {
    const str = String(field)
    // Always wrap in quotes for consistent Excel formatting
    // Escape quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`
  }).join(delimiter)).join("\r\n") // Use \r\n for Windows Excel compatibility
}

/**
 * Generate filename with current date
 */
function generateFilename(prefix: string): string {
  const dateStr = new Date().toISOString().split("T")[0]
  return `${prefix}-${dateStr}.csv`
}

// ============================================================================
// CSV GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate CSV for crop data with summary statistics
 */
function generateCropCSV(crops: any[]): string {
  const rows: string[][] = []
  
  // Header section
  rows.push(["GEWASSEN RAPPORT"])
  rows.push([`Gegenereerd op: ${new Date().toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`])
  rows.push([]) // Empty row for spacing
  
  if (!crops || crops.length === 0) {
    rows.push(["SAMENVATTING"])
    rows.push(["Totaal Gewassen", "0"])
    rows.push(["Totale Oppervlakte", "0,00 ha"])
    rows.push([])
    rows.push(["Naam", "Locatie", "Status", "Variëteit", "Geplant Op", "Verwachte Oogst", "Oppervlakte (ha)", "Notities"])
    rows.push(["Geen data beschikbaar", "", "", "", "", "", "", ""])
    return arrayToCSV(rows)
  }
  
  // Calculate summary statistics
  const totalArea = crops.reduce((sum, c) => sum + (Number(c.area_hectares) || 0), 0)
  const statusCounts = crops.reduce((acc: any, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})
  
  // Summary section
  rows.push(["SAMENVATTING"])
  rows.push(["Totaal Gewassen", crops.length.toString()])
  rows.push(["Totale Oppervlakte", `${totalArea.toFixed(2).replace(".", ",")} ha`])
  rows.push(["Status Overzicht", Object.entries(statusCounts).map(([status, count]) => `${status}: ${count}`).join(", ")])
  rows.push([]) // Empty row for spacing
  
  // Data headers
  rows.push(["GEWASSEN OVERZICHT"])
  rows.push(["Naam", "Locatie", "Status", "Variëteit", "Geplant Op", "Verwachte Oogst", "Oppervlakte (ha)", "Notities"])
  
  // Data rows
  crops.forEach((crop) => {
    rows.push([
      escapeCsvField(crop.name || ""),
      escapeCsvField(crop.location || ""),
      escapeCsvField(crop.status || ""),
      escapeCsvField(crop.variety || ""),
      formatDutchDate(crop.planted_at),
      formatDutchDate(crop.expected_harvest),
      crop.area_hectares ? crop.area_hectares.toString().replace(".", ",") : "",
      escapeCsvField(crop.notes || ""),
    ])
  })

  return arrayToCSV(rows)
}

/**
 * Generate CSV for financial/transaction data with summary statistics
 */
function generateFinancialCSV(transactions: any[]): string {
  const rows: string[][] = []
  
  // Header section
  rows.push(["FINANCIEEL RAPPORT"])
  rows.push([`Gegenereerd op: ${new Date().toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`])
  rows.push([]) // Empty row for spacing
  
  if (!transactions || transactions.length === 0) {
    rows.push(["SAMENVATTING"])
    rows.push(["Totale Inkomsten", "€0,00"])
    rows.push(["Totale Uitgaven", "€0,00"])
    rows.push(["Netto Resultaat", "€0,00"])
    rows.push(["Totaal Transacties", "0"])
    rows.push([])
    rows.push(["Datum", "Beschrijving", "Categorie", "Bedrag", "Type", "Status"])
    rows.push(["Geen data beschikbaar", "", "", "", "", ""])
    return arrayToCSV(rows)
  }
  
  // Calculate summary statistics
  const income = transactions.filter((t) => t.type === "income" && t.status === "completed")
  const expenses = transactions.filter((t) => t.type === "expense" && t.status === "completed")
  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0)
  const net = totalIncome - totalExpenses
  
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
  rows.push(["Datum", "Beschrijving", "Categorie", "Bedrag", "Type", "Status"])
  
  // Data rows
  transactions.forEach((tx) => {
    rows.push([
      formatDutchDate(tx.date),
      escapeCsvField(tx.description || ""),
      escapeCsvField(tx.category || ""),
      formatAmount(tx.amount),
      tx.type === "income" ? "Inkomsten" : "Uitgaven",
      tx.status === "completed" ? "Voltooid" : tx.status === "pending" ? "In behandeling" : "Geannuleerd",
    ])
  })

  return arrayToCSV(rows)
}

/**
 * Generate CSV for climate data with summary statistics
 */
function generateClimateCSV(climateData: any[]): string {
  const rows: string[][] = []
  
  // Header section
  rows.push(["KLIMAAT RAPPORT"])
  rows.push([`Gegenereerd op: ${new Date().toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`])
  rows.push([]) // Empty row for spacing
  
  if (!climateData || climateData.length === 0) {
    rows.push(["SAMENVATTING"])
    rows.push(["Gemiddelde Temperatuur", "N/A"])
    rows.push(["Totale Neerslag", "N/A"])
    rows.push(["Data Punten", "0"])
    rows.push([])
    rows.push(["Datum", "Temperatuur (°C)", "Luchtvochtigheid (%)", "Regenval (mm)", "Windsnelheid (km/h)", "Locatie"])
    rows.push(["Geen data beschikbaar", "", "", "", "", ""])
    return arrayToCSV(rows)
  }
  
  // Calculate summary statistics
  const temps = climateData.filter((d) => d.temperature !== null).map((d) => Number(d.temperature))
  const rainfall = climateData.filter((d) => d.rainfall_mm !== null).map((d) => Number(d.rainfall_mm))
  const humidity = climateData.filter((d) => d.humidity !== null).map((d) => Number(d.humidity))
  
  const avgTemp = temps.length > 0 ? temps.reduce((sum, t) => sum + t, 0) / temps.length : 0
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 0
  const minTemp = temps.length > 0 ? Math.min(...temps) : 0
  const totalRainfall = rainfall.reduce((sum, r) => sum + r, 0)
  const avgHumidity = humidity.length > 0 ? humidity.reduce((sum, h) => sum + h, 0) / humidity.length : 0
  
  // Summary section
  rows.push(["SAMENVATTING"])
  rows.push(["Gemiddelde Temperatuur", `${avgTemp.toFixed(1)}°C`])
  rows.push(["Minimale Temperatuur", `${minTemp.toFixed(1)}°C`])
  rows.push(["Maximale Temperatuur", `${maxTemp.toFixed(1)}°C`])
  rows.push(["Totale Neerslag", `${totalRainfall.toFixed(1)} mm`])
  rows.push(["Gemiddelde Luchtvochtigheid", `${avgHumidity.toFixed(1)}%`])
  rows.push(["Data Punten", climateData.length.toString()])
  rows.push([]) // Empty row for spacing
  
  // Data headers
  rows.push(["KLIMAAT DATA OVERZICHT"])
  rows.push(["Datum", "Temperatuur (°C)", "Luchtvochtigheid (%)", "Regenval (mm)", "Windsnelheid (km/h)", "Locatie"])
  
  // Data rows (limit to 100 rows for readability)
  const displayData = climateData.slice(0, 100)
  displayData.forEach((data) => {
    rows.push([
      formatDutchDate(data.recorded_at),
      data.temperature ? Number(data.temperature).toFixed(1).replace(".", ",") : "",
      data.humidity ? Number(data.humidity).toFixed(1).replace(".", ",") : "",
      data.rainfall_mm ? Number(data.rainfall_mm).toFixed(1).replace(".", ",") : "",
      data.wind_speed ? Number(data.wind_speed).toFixed(1).replace(".", ",") : "",
      escapeCsvField(data.location || ""),
    ])
  })
  
  if (climateData.length > 100) {
    rows.push([])
    rows.push([`... en ${climateData.length - 100} meer records`])
  }

  return arrayToCSV(rows)
}

/**
 * Generate CSV for custom report (combines all data types)
 */
function generateCustomCSV(crops: any[], transactions: any[], climateData: any[]): string {
  const rows: string[][] = []
  
  // Main header
  rows.push(["VOLLEDIG RAPPORT - AGRI TECH DASHBOARD"])
  rows.push([`Gegenereerd op: ${new Date().toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}`])
  rows.push([`Dit rapport bevat een compleet overzicht van alle beschikbare data`])
  rows.push([])
  rows.push([]) // Extra spacing
  
  // Generate each section
  if (crops && crops.length > 0) {
    const cropCSV = generateCropCSV(crops)
    const cropRows = cropCSV.split("\r\n").map(line => {
      const fields = line.split(";").map(f => f.replace(/^"|"$/g, ""))
      return fields
    })
    rows.push(...cropRows)
    rows.push([])
    rows.push([]) // Extra spacing between sections
  }
  
  if (transactions && transactions.length > 0) {
    const transCSV = generateFinancialCSV(transactions)
    const transRows = transCSV.split("\r\n").map(line => {
      const fields = line.split(";").map(f => f.replace(/^"|"$/g, ""))
      return fields
    })
    rows.push(...transRows)
    rows.push([])
    rows.push([]) // Extra spacing between sections
  }
  
  if (climateData && climateData.length > 0) {
    const climateCSV = generateClimateCSV(climateData)
    const climateRows = climateCSV.split("\r\n").map(line => {
      const fields = line.split(";").map(f => f.replace(/^"|"$/g, ""))
      return fields
    })
    rows.push(...climateRows)
  }
  
  if (rows.length <= 5) {
    rows.push(["Geen data beschikbaar voor export"])
  }
  
  return arrayToCSV(rows)
}

// ============================================================================
// HTML GENERATION FUNCTIONS (Excel-compatible with PDF styling)
// ============================================================================

/**
 * Generate HTML content with PDF-like styling that Excel can open
 */
async function generateHTMLContent(reportType: ReportType, title: string): Promise<{ content: string; filename: string }> {
  const reportTypeLabels: { [key: string]: string } = {
    crop: "Gewassen Rapport",
    financial: "Financieel Rapport",
    climate: "Klimaat Rapport",
    custom: "Volledig Rapport",
  }

  let htmlContent = ""
  let filename = ""

  switch (reportType) {
    case "crop": {
      const crops = await getCrops()
      if (!crops || crops.length === 0) {
        throw new Error("Geen crop data beschikbaar")
      }
      const html = generateCropHTML(crops, title, reportTypeLabels[reportType])
      htmlContent = wrapHTMLDocument(html)
      filename = generateFilename("crop-report")
      break
    }

    case "financial": {
      const transactions = await getTransactions()
      if (!transactions || transactions.length === 0) {
        throw new Error("Geen transactie data beschikbaar")
      }
      const html = generateFinancialHTML(transactions, title, reportTypeLabels[reportType])
      htmlContent = wrapHTMLDocument(html)
      filename = generateFilename("financial-report")
      break
    }

    case "climate": {
      const climateData = await getClimateData(30)
      if (!climateData || climateData.length === 0) {
        throw new Error("Geen klimaat data beschikbaar")
      }
      const html = generateClimateHTML(climateData, title, reportTypeLabels[reportType])
      htmlContent = wrapHTMLDocument(html)
      filename = generateFilename("climate-report")
      break
    }

    case "custom": {
      const [allCrops, allTransactions, allClimateData] = await Promise.all([
        getCrops(),
        getTransactions(),
        getClimateData(30),
      ])
      const html = generateCustomHTML(allCrops || [], allTransactions || [], allClimateData || [], title)
      htmlContent = wrapHTMLDocument(html)
      filename = generateFilename("custom-report")
      break
    }

    default:
      throw new Error("Invalid report type")
  }

  return { content: htmlContent, filename }
}

/**
 * Generate HTML for crop data
 */
function generateCropHTML(crops: any[], title: string, reportType: string): string {
  const totalArea = crops.reduce((sum, c) => sum + (Number(c.area_hectares) || 0), 0)
  const statusCounts = crops.reduce((acc: any, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})

  let html = `
    <table border="0" cellpadding="0" cellspacing="0" style="width:100%; font-family: 'Segoe UI', Arial, sans-serif;">
      <tr>
        <td colspan="8" style="background: #22c55e; color: white; padding: 20px; font-size: 24px; font-weight: bold;">
          🌾 Agritech Dashboard - ${reportType}
        </td>
      </tr>
      <tr>
        <td colspan="8" style="padding: 15px; background: #f8fafc; border-bottom: 3px solid #22c55e;">
          <strong>Rapport:</strong> ${escapeHtml(title)}<br>
          <strong>Gegenereerd op:</strong> ${new Date().toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </td>
      </tr>
      <tr>
        <td colspan="8" style="padding: 20px;">
          <table border="0" cellpadding="10" cellspacing="0" style="width:100%; margin-bottom: 20px;">
            <tr style="background: #f1f5f9;">
              <td style="border-left: 4px solid #22c55e; padding: 15px;"><strong>Totaal Gewassen</strong><br><span style="font-size: 20px;">${crops.length}</span></td>
              <td style="border-left: 4px solid #3b82f6; padding: 15px;"><strong>Totale Oppervlakte</strong><br><span style="font-size: 20px;">${totalArea.toFixed(2).replace(".", ",")} ha</span></td>
              <td style="border-left: 4px solid #22c55e; padding: 15px;"><strong>Status Overzicht</strong><br><span style="font-size: 14px;">${Object.entries(statusCounts).map(([status, count]) => `${status}: ${count}`).join(", ")}</span></td>
            </tr>
          </table>
          
          <h2 style="color: #22c55e; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Gewassen Overzicht</h2>
          
          <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse: collapse;">
            <thead>
              <tr style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Naam</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Locatie</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Status</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Variëteit</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Geplant Op</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Verwachte Oogst</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Oppervlakte (ha)</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Notities</th>
              </tr>
            </thead>
            <tbody>
  `

  crops.forEach((crop, index) => {
    const bgColor = index % 2 === 0 ? "#f8fafc" : "#ffffff"
    const statusColor = crop.status === "growing" ? "#d1fae5" : 
                       crop.status === "harvested" ? "#dbeafe" : 
                       crop.status === "issue" ? "#fee2e2" : "#fef3c7"
    
    html += `
              <tr style="background: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>${escapeHtml(crop.name || "-")}</strong></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${escapeHtml(crop.location || "-")}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;"><span style="background: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 600;">${escapeHtml(crop.status || "-")}</span></td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${escapeHtml(crop.variety || "-")}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${formatDutchDate(crop.planted_at)}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${formatDutchDate(crop.expected_harvest)}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-family: monospace;">${crop.area_hectares ? crop.area_hectares.toString().replace(".", ",") : "-"}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; color: #64748b; font-size: 11px;">${escapeHtml(crop.notes || "-")}</td>
              </tr>
    `
  })

  html += `
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td colspan="8" style="padding: 20px; text-align: center; color: #94a3b8; border-top: 2px solid #e5e7eb; margin-top: 40px;">
          <p>Dit rapport is gegenereerd door Agritech Dashboard - Smart Agricultural Management System</p>
        </td>
      </tr>
    </table>
  `

  return html
}

/**
 * Generate HTML for financial data
 */
function generateFinancialHTML(transactions: any[], title: string, reportType: string): string {
  const income = transactions.filter((t) => t.type === "income" && t.status === "completed")
  const expenses = transactions.filter((t) => t.type === "expense" && t.status === "completed")
  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0)
  const net = totalIncome - totalExpenses

  let html = `
    <table border="0" cellpadding="0" cellspacing="0" style="width:100%; font-family: 'Segoe UI', Arial, sans-serif;">
      <tr>
        <td colspan="6" style="background: #22c55e; color: white; padding: 20px; font-size: 24px; font-weight: bold;">
          💰 Agritech Dashboard - ${reportType}
        </td>
      </tr>
      <tr>
        <td colspan="6" style="padding: 15px; background: #f8fafc; border-bottom: 3px solid #22c55e;">
          <strong>Rapport:</strong> ${escapeHtml(title)}<br>
          <strong>Gegenereerd op:</strong> ${new Date().toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </td>
      </tr>
      <tr>
        <td colspan="6" style="padding: 20px;">
          <table border="0" cellpadding="10" cellspacing="0" style="width:100%; margin-bottom: 20px;">
            <tr style="background: #f1f5f9;">
              <td style="border-left: 4px solid #3b82f6; padding: 15px;"><strong>Totale Inkomsten</strong><br><span style="font-size: 20px; color: #10b981;">€${totalIncome.toFixed(2).replace(".", ",")}</span></td>
              <td style="border-left: 4px solid #ef4444; padding: 15px;"><strong>Totale Uitgaven</strong><br><span style="font-size: 20px; color: #ef4444;">€${totalExpenses.toFixed(2).replace(".", ",")}</span></td>
              <td style="border-left: 4px solid ${net >= 0 ? '#10b981' : '#ef4444'}; padding: 15px;"><strong>Netto Resultaat</strong><br><span style="font-size: 20px; color: ${net >= 0 ? '#10b981' : '#ef4444'};">€${net.toFixed(2).replace(".", ",")}</span></td>
              <td style="border-left: 4px solid #22c55e; padding: 15px;"><strong>Totaal Transacties</strong><br><span style="font-size: 20px;">${transactions.length}</span></td>
            </tr>
          </table>
          
          <h2 style="color: #22c55e; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Transacties Overzicht</h2>
          
          <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse: collapse;">
            <thead>
              <tr style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Datum</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Beschrijving</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Categorie</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Bedrag</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Type</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Status</th>
              </tr>
            </thead>
            <tbody>
  `

  transactions.forEach((tx, index) => {
    const bgColor = index % 2 === 0 ? "#f8fafc" : "#ffffff"
    const amountColor = tx.type === "income" ? "#10b981" : "#ef4444"
    const statusColor = tx.status === "completed" ? "#d1fae5" : 
                       tx.status === "pending" ? "#fef3c7" : "#fee2e2"
    
    html += `
              <tr style="background: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${formatDutchDate(tx.date)}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${escapeHtml(tx.description || "-")}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${escapeHtml(tx.category || "-")}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-family: monospace; font-weight: 600; color: ${amountColor};">${tx.type === "income" ? "+" : "-"}€${formatAmount(tx.amount)}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${tx.type === "income" ? "Inkomsten" : "Uitgaven"}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;"><span style="background: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 600;">${tx.status === "completed" ? "Voltooid" : tx.status === "pending" ? "In behandeling" : "Geannuleerd"}</span></td>
              </tr>
    `
  })

  html += `
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td colspan="6" style="padding: 20px; text-align: center; color: #94a3b8; border-top: 2px solid #e5e7eb; margin-top: 40px;">
          <p>Dit rapport is gegenereerd door Agritech Dashboard - Smart Agricultural Management System</p>
        </td>
      </tr>
    </table>
  `

  return html
}

/**
 * Generate HTML for climate data
 */
function generateClimateHTML(climateData: any[], title: string, reportType: string): string {
  const temps = climateData.filter((d) => d.temperature !== null).map((d) => Number(d.temperature))
  const rainfall = climateData.filter((d) => d.rainfall_mm !== null).map((d) => Number(d.rainfall_mm))
  const humidity = climateData.filter((d) => d.humidity !== null).map((d) => Number(d.humidity))
  
  const avgTemp = temps.length > 0 ? temps.reduce((sum, t) => sum + t, 0) / temps.length : 0
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 0
  const minTemp = temps.length > 0 ? Math.min(...temps) : 0
  const totalRainfall = rainfall.reduce((sum, r) => sum + r, 0)
  const avgHumidity = humidity.length > 0 ? humidity.reduce((sum, h) => sum + h, 0) / humidity.length : 0

  let html = `
    <table border="0" cellpadding="0" cellspacing="0" style="width:100%; font-family: 'Segoe UI', Arial, sans-serif;">
      <tr>
        <td colspan="6" style="background: #22c55e; color: white; padding: 20px; font-size: 24px; font-weight: bold;">
          🌡️ Agritech Dashboard - ${reportType}
        </td>
      </tr>
      <tr>
        <td colspan="6" style="padding: 15px; background: #f8fafc; border-bottom: 3px solid #22c55e;">
          <strong>Rapport:</strong> ${escapeHtml(title)}<br>
          <strong>Gegenereerd op:</strong> ${new Date().toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </td>
      </tr>
      <tr>
        <td colspan="6" style="padding: 20px;">
          <table border="0" cellpadding="10" cellspacing="0" style="width:100%; margin-bottom: 20px;">
            <tr style="background: #f1f5f9;">
              <td style="border-left: 4px solid #22c55e; padding: 15px;"><strong>Gemiddelde Temperatuur</strong><br><span style="font-size: 20px;">${avgTemp.toFixed(1)}°C</span><br><span style="font-size: 12px; color: #64748b;">Min: ${minTemp.toFixed(1)}°C | Max: ${maxTemp.toFixed(1)}°C</span></td>
              <td style="border-left: 4px solid #3b82f6; padding: 15px;"><strong>Totale Neerslag</strong><br><span style="font-size: 20px;">${totalRainfall.toFixed(1)} mm</span></td>
              <td style="border-left: 4px solid #22c55e; padding: 15px;"><strong>Gemiddelde Luchtvochtigheid</strong><br><span style="font-size: 20px;">${avgHumidity.toFixed(1)}%</span></td>
              <td style="border-left: 4px solid #22c55e; padding: 15px;"><strong>Data Punten</strong><br><span style="font-size: 20px;">${climateData.length}</span></td>
            </tr>
          </table>
          
          <h2 style="color: #22c55e; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Klimaat Data Overzicht</h2>
          
          <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse: collapse;">
            <thead>
              <tr style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white;">
                <th style="padding: 12px; text-align: left; font-weight: 600;">Datum</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Temperatuur (°C)</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Luchtvochtigheid (%)</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Regenval (mm)</th>
                <th style="padding: 12px; text-align: right; font-weight: 600;">Windsnelheid (km/h)</th>
                <th style="padding: 12px; text-align: left; font-weight: 600;">Locatie</th>
              </tr>
            </thead>
            <tbody>
  `

  climateData.slice(0, 100).forEach((data, index) => {
    const bgColor = index % 2 === 0 ? "#f8fafc" : "#ffffff"
    html += `
              <tr style="background: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${formatDutchDate(data.recorded_at)}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-family: monospace;">${data.temperature ? Number(data.temperature).toFixed(1).replace(".", ",") : "-"}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-family: monospace;">${data.humidity ? Number(data.humidity).toFixed(1).replace(".", ",") : "-"}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-family: monospace;">${data.rainfall_mm ? Number(data.rainfall_mm).toFixed(1).replace(".", ",") : "-"}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: right; font-family: monospace;">${data.wind_speed ? Number(data.wind_speed).toFixed(1).replace(".", ",") : "-"}</td>
                <td style="padding: 10px; border: 1px solid #e5e7eb;">${escapeHtml(data.location || "-")}</td>
              </tr>
    `
  })

  if (climateData.length > 100) {
    html += `
              <tr>
                <td colspan="6" style="padding: 10px; text-align: center; font-style: italic; color: #64748b;">... en ${climateData.length - 100} meer records</td>
              </tr>
    `
  }

  html += `
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td colspan="6" style="padding: 20px; text-align: center; color: #94a3b8; border-top: 2px solid #e5e7eb; margin-top: 40px;">
          <p>Dit rapport is gegenereerd door Agritech Dashboard - Smart Agricultural Management System</p>
        </td>
      </tr>
    </table>
  `

  return html
}

/**
 * Generate HTML for custom report
 */
function generateCustomHTML(crops: any[], transactions: any[], climateData: any[], title: string): string {
  let html = `
    <table border="0" cellpadding="0" cellspacing="0" style="width:100%; font-family: 'Segoe UI', Arial, sans-serif;">
      <tr>
        <td colspan="8" style="background: #22c55e; color: white; padding: 20px; font-size: 24px; font-weight: bold;">
          📊 Agritech Dashboard - Volledig Rapport
        </td>
      </tr>
      <tr>
        <td colspan="8" style="padding: 15px; background: #f8fafc; border-bottom: 3px solid #22c55e;">
          <strong>Rapport:</strong> ${escapeHtml(title)}<br>
          <strong>Gegenereerd op:</strong> ${new Date().toLocaleString("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </td>
      </tr>
  `

  if (crops && crops.length > 0) {
    html += `<tr><td colspan="8" style="padding: 20px;">${generateCropHTML(crops, title, "Gewassen Rapport")}</td></tr>`
  }

  if (transactions && transactions.length > 0) {
    html += `<tr><td colspan="8" style="padding: 20px;">${generateFinancialHTML(transactions, title, "Financieel Rapport")}</td></tr>`
  }

  if (climateData && climateData.length > 0) {
    html += `<tr><td colspan="8" style="padding: 20px;">${generateClimateHTML(climateData, title, "Klimaat Rapport")}</td></tr>`
  }

  html += `
      <tr>
        <td colspan="8" style="padding: 20px; text-align: center; color: #94a3b8; border-top: 2px solid #e5e7eb; margin-top: 40px;">
          <p>Dit rapport is gegenereerd door Agritech Dashboard - Smart Agricultural Management System</p>
        </td>
      </tr>
    </table>
  `

  return html
}

/**
 * Wrap HTML content in full document structure
 */
function wrapHTMLDocument(content: string): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <meta name="ProgId" content="Excel.Sheet">
  <meta name="Generator" content="Agritech Dashboard">
  <!--[if gte mso 9]><xml>
   <x:ExcelWorkbook>
    <x:ExcelWorksheets>
     <x:ExcelWorksheet>
      <x:Name>Rapport</x:Name>
      <x:WorksheetOptions>
       <x:Print>
        <x:ValidPrinterInfo/>
       </x:Print>
      </x:WorksheetOptions>
     </x:ExcelWorksheet>
    </x:ExcelWorksheets>
   </x:ExcelWorkbook>
  </xml><![endif]-->
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; }
    table { border-collapse: collapse; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
${content}
</body>
</html>`
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  if (!text) return ""
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// ============================================================================
// REPORT GENERATION LOGIC
// ============================================================================

/**
 * Generate CSV content based on report type
 */
async function generateCSVContent(reportType: ReportType): Promise<{ content: string; filename: string }> {
  switch (reportType) {
    case "crop": {
      const crops = await getCrops()
      if (!crops || crops.length === 0) {
        throw new Error("Geen crop data beschikbaar")
      }
      return {
        content: generateCropCSV(crops),
        filename: generateFilename("crop-report"),
      }
    }

    case "financial": {
      const transactions = await getTransactions()
      if (!transactions || transactions.length === 0) {
        throw new Error("Geen transactie data beschikbaar")
      }
      return {
        content: generateFinancialCSV(transactions),
        filename: generateFilename("financial-report"),
      }
    }

    case "climate": {
      const climateData = await getClimateData(30)
      if (!climateData || climateData.length === 0) {
        throw new Error("Geen klimaat data beschikbaar")
      }
      return {
        content: generateClimateCSV(climateData),
        filename: generateFilename("climate-report"),
      }
    }

    case "custom": {
      const [allCrops, allTransactions, allClimateData] = await Promise.all([
        getCrops(),
        getTransactions(),
        getClimateData(30),
      ])

      const hasAnyData =
        (allCrops && allCrops.length > 0) ||
        (allTransactions && allTransactions.length > 0) ||
        (allClimateData && allClimateData.length > 0)

      if (!hasAnyData) {
        throw new Error("Geen data beschikbaar voor custom rapport")
      }

      return {
        content: generateCustomCSV(allCrops || [], allTransactions || [], allClimateData || []),
        filename: generateFilename("custom-report"),
      }
    }

    default:
      throw new Error("Invalid report type")
  }
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * POST /api/reports/generate-csv
 * Generate a CSV report based on report type
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { reportType, title, format } = body // format can be 'csv' or 'html'

    if (!reportType || !title) {
      return NextResponse.json({ error: "Report type and title are required" }, { status: 400 })
    }

    // Check if HTML format is requested
    if (format === "html") {
      // Generate HTML content with PDF-like styling
      const { content: htmlContent, filename: htmlFilename } = await generateHTMLContent(reportType as ReportType, title)
      
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="${htmlFilename.replace('.csv', '.html')}"`,
        },
      })
    }

    // Generate CSV content (default)
    const { content: csvContent, filename } = await generateCSVContent(reportType as ReportType)

    // Validate CSV content
    if (!csvContent || csvContent.trim().length === 0) {
      return NextResponse.json({ error: "Geen data beschikbaar om te exporteren" }, { status: 404 })
    }

    // Save report to database (non-blocking)
    supabase
      .from("reports")
      .insert([
        {
          user_id: user.id,
          title,
          type: reportType,
          file_url: null,
          generated_at: new Date().toISOString(),
        },
      ])
      .then(({ error }) => {
        if (error) {
          console.error("Error saving report:", error)
        }
      })

    // Add BOM for Excel compatibility (UTF-8)
    const csvWithBom = "\uFEFF" + csvContent

    // Return CSV file
    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error("Error generating CSV report:", error)
    
    // Return appropriate error response
    if (error.message && error.message.includes("Geen")) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
