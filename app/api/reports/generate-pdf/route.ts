import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCrops, getTransactions, getClimateData } from "@/lib/supabase/queries"

/**
 * Escape HTML to prevent XSS and ensure proper rendering
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

/**
 * Format date to Dutch format (DD-MM-YYYY)
 */
function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "-"
    return date.toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return "-"
  }
}

/**
 * Generate a PDF report based on report type
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { reportType, title } = body

    if (!reportType || !title) {
      return NextResponse.json({ error: "Report type and title are required" }, { status: 400 })
    }

    // Fetch data based on report type
    let reportData: any = {}
    let reportContent = ""

    switch (reportType) {
      case "crop":
        const crops = await getCrops()
        reportData = { crops }
        reportContent = generateCropReportContent(crops)
        break
      case "financial":
        const transactions = await getTransactions()
        reportData = { transactions }
        reportContent = generateFinancialReportContent(transactions)
        break
      case "climate":
        const climateData = await getClimateData(30)
        reportData = { climateData }
        reportContent = generateClimateReportContent(climateData)
        break
      case "custom":
        // Custom report includes all data
        const allCrops = await getCrops()
        const allTransactions = await getTransactions()
        const allClimateData = await getClimateData(30)
        reportData = { crops: allCrops, transactions: allTransactions, climateData: allClimateData }
        reportContent = generateCustomReportContent(allCrops, allTransactions, allClimateData)
        break
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    // Generate simple HTML content (can be converted to PDF on client side)
    const htmlContent = generateHTMLReport(title, reportContent, reportType)

    // Save report to database
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .insert([
        {
          user_id: user.id,
          title,
          type: reportType,
          file_url: null, // PDF will be generated client-side
          generated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (reportError) {
      console.error("Error saving report:", reportError)
      return NextResponse.json({ error: "Failed to save report" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reportId: report.id,
      htmlContent,
      reportData,
    })
  } catch (error) {
    console.error("Error generating PDF report:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function generateCropReportContent(crops: any[]) {
  if (!crops || crops.length === 0) {
    return "<div class='section'><p class='no-data'>Geen crop data beschikbaar</p></div>"
  }

  const totalArea = crops.reduce((sum, c) => sum + (Number(c.area_hectares) || 0), 0)
  const statusCounts = crops.reduce((acc: any, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {})

  let content = `
    <div class="section">
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-label">Totaal Gewassen</div>
          <div class="summary-value">${crops.length}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Totale Oppervlakte</div>
          <div class="summary-value">${totalArea.toFixed(2)} ha</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Status Overzicht</div>
          <div class="summary-value-small">${Object.entries(statusCounts).map(([status, count]) => `${status}: ${count}`).join(", ")}</div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>Gewassen Overzicht</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Naam</th>
            <th>Locatie</th>
            <th>Status</th>
            <th>Variëteit</th>
            <th>Geplant Op</th>
            <th>Verwachte Oogst</th>
            <th>Oppervlakte (ha)</th>
            <th>Notities</th>
          </tr>
        </thead>
        <tbody>
  `
  
  crops.forEach((crop, index) => {
    const rowClass = index % 2 === 0 ? "even" : "odd"
    const statusClass = crop.status === "growing" ? "status-growing" : 
                       crop.status === "harvested" ? "status-harvested" : 
                       crop.status === "issue" ? "status-issue" : "status-planned"
    
    content += `
      <tr class="${rowClass}">
        <td><strong>${escapeHtml(crop.name || "-")}</strong></td>
        <td>${escapeHtml(crop.location || "-")}</td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(crop.status || "-")}</span></td>
        <td>${escapeHtml(crop.variety || "-")}</td>
        <td>${formatDate(crop.planted_at)}</td>
        <td>${formatDate(crop.expected_harvest)}</td>
        <td class="number">${crop.area_hectares ? Number(crop.area_hectares).toFixed(2).replace(".", ",") : "-"}</td>
        <td class="notes">${escapeHtml(crop.notes || "-")}</td>
      </tr>
    `
  })
  
  content += `
        </tbody>
      </table>
    </div>
  `
  
  return content
}

function generateFinancialReportContent(transactions: any[]) {
  if (!transactions || transactions.length === 0) {
    return "<div class='section'><p class='no-data'>Geen financiële data beschikbaar</p></div>"
  }

  const income = transactions.filter((t) => t.type === "income" && t.status === "completed")
  const expenses = transactions.filter((t) => t.type === "expense" && t.status === "completed")
  const pending = transactions.filter((t) => t.status === "pending")
  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0)
  const net = totalIncome - totalExpenses

  let content = `
    <div class="section">
      <div class="summary-cards">
        <div class="summary-card income">
          <div class="summary-label">Totale Inkomsten</div>
          <div class="summary-value">€${totalIncome.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card expense">
          <div class="summary-label">Totale Uitgaven</div>
          <div class="summary-value">€${totalExpenses.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card ${net >= 0 ? 'profit' : 'loss'}">
          <div class="summary-label">Netto Resultaat</div>
          <div class="summary-value">€${net.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Totaal Transacties</div>
          <div class="summary-value">${transactions.length}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Transacties Overzicht</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Beschrijving</th>
            <th>Categorie</th>
            <th>Bedrag</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
  `

  transactions.forEach((tx, index) => {
    const rowClass = index % 2 === 0 ? "even" : "odd"
    const amountClass = tx.type === "income" ? "amount-income" : "amount-expense"
    const statusClass = tx.status === "completed" ? "status-completed" : 
                       tx.status === "pending" ? "status-pending" : "status-cancelled"
    
    content += `
      <tr class="${rowClass}">
        <td>${formatDate(tx.date)}</td>
        <td>${escapeHtml(tx.description || "-")}</td>
        <td>${escapeHtml(tx.category || "-")}</td>
        <td class="number ${amountClass}">${tx.type === "income" ? "+" : "-"}€${Number(tx.amount).toFixed(2).replace(".", ",")}</td>
        <td>${tx.type === "income" ? "Inkomsten" : "Uitgaven"}</td>
        <td><span class="status-badge ${statusClass}">${tx.status === "completed" ? "Voltooid" : tx.status === "pending" ? "In behandeling" : "Geannuleerd"}</span></td>
      </tr>
    `
  })

  content += `
        </tbody>
      </table>
    </div>
  `

  return content
}

function generateClimateReportContent(climateData: any[]) {
  if (!climateData || climateData.length === 0) {
    return "<div class='section'><p class='no-data'>Geen klimaat data beschikbaar</p></div>"
  }

  const temps = climateData.filter((d) => d.temperature !== null).map((d) => Number(d.temperature))
  const rainfall = climateData.filter((d) => d.rainfall_mm !== null).map((d) => Number(d.rainfall_mm))
  const humidity = climateData.filter((d) => d.humidity !== null).map((d) => Number(d.humidity))
  
  const avgTemp = temps.length > 0 ? temps.reduce((sum, t) => sum + t, 0) / temps.length : 0
  const maxTemp = temps.length > 0 ? Math.max(...temps) : 0
  const minTemp = temps.length > 0 ? Math.min(...temps) : 0
  const totalRainfall = rainfall.reduce((sum, r) => sum + r, 0)
  const avgHumidity = humidity.length > 0 ? humidity.reduce((sum, h) => sum + h, 0) / humidity.length : 0

  let content = `
    <div class="section">
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-label">Gemiddelde Temperatuur</div>
          <div class="summary-value">${avgTemp.toFixed(1)}°C</div>
          <div class="summary-sub">Min: ${minTemp.toFixed(1)}°C | Max: ${maxTemp.toFixed(1)}°C</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Totale Neerslag</div>
          <div class="summary-value">${totalRainfall.toFixed(1)} mm</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Gemiddelde Luchtvochtigheid</div>
          <div class="summary-value">${avgHumidity.toFixed(1)}%</div>
        </div>
        <div class="summary-card">
          <div class="summary-label">Data Punten</div>
          <div class="summary-value">${climateData.length}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Klimaat Data Overzicht</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Temperatuur (°C)</th>
            <th>Luchtvochtigheid (%)</th>
            <th>Neerslag (mm)</th>
            <th>Windsnelheid (km/h)</th>
            <th>Locatie</th>
          </tr>
        </thead>
        <tbody>
  `

  climateData.slice(0, 50).forEach((data, index) => { // Limit to 50 rows for PDF
    const rowClass = index % 2 === 0 ? "even" : "odd"
    content += `
      <tr class="${rowClass}">
        <td>${formatDate(data.recorded_at)}</td>
        <td class="number">${data.temperature ? Number(data.temperature).toFixed(1) : "-"}</td>
        <td class="number">${data.humidity ? Number(data.humidity).toFixed(1) : "-"}</td>
        <td class="number">${data.rainfall_mm ? Number(data.rainfall_mm).toFixed(1) : "-"}</td>
        <td class="number">${data.wind_speed ? Number(data.wind_speed).toFixed(1) : "-"}</td>
        <td>${escapeHtml(data.location || "-")}</td>
      </tr>
    `
  })

  if (climateData.length > 50) {
    content += `
      <tr>
        <td colspan="6" class="more-data">... en ${climateData.length - 50} meer records</td>
      </tr>
    `
  }

  content += `
        </tbody>
      </table>
    </div>
  `

  return content
}

function generateCustomReportContent(crops: any[], transactions: any[], climateData: any[]) {
  let content = `
    <div class="section">
      <h2>Volledig Overzicht</h2>
      <p style="color: #64748b; margin-bottom: 20px;">
        Dit rapport bevat een compleet overzicht van alle beschikbare data: gewassen, financiële transacties en klimaatgegevens.
      </p>
    </div>
  `
  
  if (crops && crops.length > 0) {
  content += generateCropReportContent(crops)
  }
  
  if (transactions && transactions.length > 0) {
  content += generateFinancialReportContent(transactions)
  }
  
  if (climateData && climateData.length > 0) {
  content += generateClimateReportContent(climateData)
  }
  
  return content
}

function generateHTMLReport(title: string, content: string, type: string) {
  const reportTypeLabels: { [key: string]: string } = {
    crop: "Gewassen Rapport",
    financial: "Financieel Rapport",
    climate: "Klimaat Rapport",
    custom: "Volledig Rapport",
  }

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Agritech Dashboard</title>
  <style>
    @page {
      margin: 1.5cm;
      size: A4;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 0;
    }
    
    .header {
      border-bottom: 3px solid #22c55e;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .header-left h1 {
      color: #22c55e;
      font-size: 24pt;
      margin-bottom: 5px;
      font-weight: 700;
    }
    
    .header-left .subtitle {
      color: #666;
      font-size: 12pt;
      font-weight: 500;
    }
    
    .header-right {
      text-align: right;
      color: #666;
      font-size: 10pt;
    }
    
    .header-right .date {
      font-weight: 600;
      color: #333;
      margin-top: 5px;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    h2 {
      color: #22c55e;
      font-size: 16pt;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
      font-weight: 600;
    }
    
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 25px;
    }
    
    .summary-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 1px solid #e2e8f0;
      border-left: 4px solid #22c55e;
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    
    .summary-card.income {
      border-left-color: #3b82f6;
    }
    
    .summary-card.expense {
      border-left-color: #ef4444;
    }
    
    .summary-card.profit {
      border-left-color: #10b981;
    }
    
    .summary-card.loss {
      border-left-color: #ef4444;
    }
    
    .summary-label {
      font-size: 9pt;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .summary-value {
      font-size: 20pt;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 5px;
    }
    
    .summary-value-small {
      font-size: 10pt;
      color: #475569;
      font-weight: 500;
    }
    
    .summary-sub {
      font-size: 9pt;
      color: #64748b;
      margin-top: 5px;
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 9pt;
      page-break-inside: auto;
    }
    
    .data-table thead {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
    }
    
    .data-table th {
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 8.5pt;
      letter-spacing: 0.5px;
      border: 1px solid #16a34a;
    }
    
    .data-table td {
      padding: 10px;
      border: 1px solid #e5e7eb;
      vertical-align: top;
    }
    
    .data-table tbody tr.even {
      background-color: #f8fafc;
    }
    
    .data-table tbody tr.odd {
      background-color: #ffffff;
    }
    
    .data-table tbody tr:hover {
      background-color: #f1f5f9;
    }
    
    .data-table .number {
      text-align: right;
      font-family: 'Courier New', monospace;
      font-weight: 500;
    }
    
    .data-table .amount-income {
      color: #10b981;
      font-weight: 600;
    }
    
    .data-table .amount-expense {
      color: #ef4444;
      font-weight: 600;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 8pt;
      font-weight: 600;
      text-transform: capitalize;
    }
    
    .status-growing {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-harvested {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .status-issue {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .status-planned {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status-completed {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .notes {
      font-size: 8.5pt;
      color: #64748b;
      max-width: 200px;
    }
    
    .no-data {
      text-align: center;
      padding: 40px;
      color: #94a3b8;
      font-style: italic;
    }
    
    .more-data {
      text-align: center;
      font-style: italic;
      color: #64748b;
      padding: 10px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #94a3b8;
      font-size: 9pt;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .data-table {
        page-break-inside: auto;
      }
      
      .data-table thead {
        display: table-header-group;
      }
      
      .data-table tbody tr {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>🌾 Agritech Dashboard</h1>
      <div class="subtitle">${reportTypeLabels[type] || type}</div>
    </div>
    <div class="header-right">
      <div><strong>Rapport:</strong> ${escapeHtml(title)}</div>
      <div class="date">${new Date().toLocaleString("nl-NL", { 
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })}</div>
    </div>
  </div>
  
  ${content}
  
  <div class="footer">
    <p>Dit rapport is gegenereerd door Agritech Dashboard - Smart Agricultural Management System</p>
    <p>Voor vragen of ondersteuning, neem contact op met uw systeembeheerder</p>
  </div>
</body>
</html>
  `
}
