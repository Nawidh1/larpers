import { createClient } from "./server"
import type { Crop, Transaction, ClimateData, CropGrowth, Report } from "./types"

// Get current user ID
export async function getCurrentUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id
}

// Crops queries
export async function getCrops() {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("crops")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching crops:", error)
    return []
  }

  return (data as Crop[]) || []
}

export async function getCropCount() {
  const crops = await getCrops()
  return crops.length
}

// Transactions queries
export async function getTransactions(limit?: number) {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const supabase = await createClient()
  let query = supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching transactions:", error)
    return []
  }

  return (data as Transaction[]) || []
}

export async function getTotalRevenue() {
  const transactions = await getTransactions()
  const income = transactions.filter((t) => t.type === "income" && t.status === "completed")
  return income.reduce((sum, t) => sum + Number(t.amount), 0)
}

export async function getTotalBalance() {
  // Always calculate from ALL transactions, not from bank account balances
  // This ensures consistency and includes transactions without bank_account_id
  const transactions = await getTransactions()
  const completed = transactions.filter((t) => t.status === "completed")
  return completed.reduce((sum, t) => sum + Number(t.amount), 0)
}

// Helper to get bank accounts (re-exported for convenience)
async function getBankAccounts() {
  try {
    const { getBankAccounts } = await import("./banking")
    return await getBankAccounts()
  } catch {
    return []
  }
}

export async function getMonthlyIncome() {
  const transactions = await getTransactions()
  const income = transactions.filter((t) => t.type === "income" && t.status === "completed")

  // Group by month
  const monthlyData: Record<string, number> = {}
  income.forEach((t) => {
    const date = new Date(t.date)
    const monthKey = date.toLocaleDateString("en-US", { month: "short" })
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + Number(t.amount)
  })

  // Convert to array format for charts
  return Object.entries(monthlyData).map(([month, income]) => ({ month, income }))
}

// Climate data queries
export async function getClimateData(limit?: number) {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const supabase = await createClient()
  let query = supabase
    .from("climate_data")
    .select("*")
    .eq("user_id", userId)
    .order("recorded_at", { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching climate data:", error)
    return []
  }

  return (data as ClimateData[]) || []
}

export async function getLatestClimateData() {
  const climateData = await getClimateData(1)
  return climateData[0] || null
}

export type DroughtWarning = {
  isDrought: boolean
  severity: "low" | "moderate" | "high" | "extreme"
  message: string
  details: {
    rainfall14Days: number
    avgTemperature7Days: number
    avgHumidity7Days: number
    daysWithoutRain: number
  }
}

/**
 * Detect extreme drought conditions based on climate data
 * Criteria:
 * - Low rainfall over last 14 days (< 10mm = warning, < 5mm = severe)
 * - High average temperature over last 7 days (> 28°C)
 * - Low average humidity over last 7 days (< 45%)
 */
export async function detectDroughtWarning(): Promise<DroughtWarning | null> {
  const userId = await getCurrentUserId()
  if (!userId) return null

  const supabase = await createClient()
  
  // Get data from last 14 days
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  
  const { data: climateData, error } = await supabase
    .from("climate_data")
    .select("*")
    .eq("user_id", userId)
    .gte("recorded_at", fourteenDaysAgo.toISOString())
    .order("recorded_at", { ascending: false })

  if (error || !climateData || climateData.length === 0) {
    return null
  }

  // Calculate metrics
  const rainfall14Days = climateData.reduce((sum, d) => sum + (d.rainfall_mm ? Number(d.rainfall_mm) : 0), 0)
  
  // Last 7 days for temperature and humidity
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const last7Days = climateData.filter(d => new Date(d.recorded_at) >= sevenDaysAgo)
  
  const temps = last7Days.filter(d => d.temperature !== null).map(d => Number(d.temperature))
  const humidities = last7Days.filter(d => d.humidity !== null).map(d => Number(d.humidity))
  
  const avgTemperature7Days = temps.length > 0 
    ? temps.reduce((sum, t) => sum + t, 0) / temps.length 
    : null
  const avgHumidity7Days = humidities.length > 0 
    ? humidities.reduce((sum, h) => sum + h, 0) / humidities.length 
    : null

  // Count consecutive days without rain
  let daysWithoutRain = 0
  const sortedByDate = [...climateData].sort((a, b) => 
    new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  )
  for (const day of sortedByDate) {
    if (day.rainfall_mm && Number(day.rainfall_mm) > 0) {
      break
    }
    daysWithoutRain++
  }

  // Determine drought severity
  let isDrought = false
  let severity: "low" | "moderate" | "high" | "extreme" = "low"
  let message = ""

  // Extreme: Very low rain + high temp + low humidity
  if (rainfall14Days < 5 && avgTemperature7Days && avgTemperature7Days > 30 && avgHumidity7Days && avgHumidity7Days < 40) {
    isDrought = true
    severity = "extreme"
    message = "Extreme droogte gedetecteerd! Onmiddellijke irrigatie vereist."
  }
  // High: Low rain + high temp OR low humidity
  else if (rainfall14Days < 10 && (
    (avgTemperature7Days && avgTemperature7Days > 28) || 
    (avgHumidity7Days && avgHumidity7Days < 45)
  )) {
    isDrought = true
    severity = "high"
    message = "Hoge droogte risico. Overweeg extra irrigatie."
  }
  // Moderate: Low rain OR high temp OR low humidity
  else if (rainfall14Days < 15 || (avgTemperature7Days && avgTemperature7Days > 28) || (avgHumidity7Days && avgHumidity7Days < 50)) {
    isDrought = true
    severity = "moderate"
    message = "Matige droogte condities. Monitor irrigatie behoeften."
  }
  // Low: Some indicators but not critical
  else if (rainfall14Days < 20 || daysWithoutRain > 7) {
    isDrought = true
    severity = "low"
    message = "Lichte droogte condities. Houd irrigatie in de gaten."
  }

  if (!isDrought) {
    return null
  }

  return {
    isDrought: true,
    severity,
    message,
    details: {
      rainfall14Days: Math.round(rainfall14Days * 10) / 10,
      avgTemperature7Days: avgTemperature7Days ? Math.round(avgTemperature7Days * 10) / 10 : 0,
      avgHumidity7Days: avgHumidity7Days ? Math.round(avgHumidity7Days * 10) / 10 : 0,
      daysWithoutRain,
    }
  }
}

// Crop growth queries
export async function getCropGrowth(cropId?: string) {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const supabase = await createClient()

  if (cropId) {
    const { data, error } = await supabase
      .from("crop_growth")
      .select("*")
      .eq("crop_id", cropId)
      .order("recorded_at", { ascending: true })

    if (error) {
      console.error("Error fetching crop growth:", error)
      return []
    }
    return (data as CropGrowth[]) || []
  }

  // Get growth data for all user's crops
  const crops = await getCrops()
  const cropIds = crops.map((c) => c.id)

  if (cropIds.length === 0) return []

  const { data, error } = await supabase
    .from("crop_growth")
    .select("*")
    .in("crop_id", cropIds)
    .order("recorded_at", { ascending: true })

  if (error) {
    console.error("Error fetching crop growth:", error)
    return []
  }

  return (data as CropGrowth[]) || []
}

export async function getCropGrowthChartData() {
  const growthData = await getCropGrowth()

  // Group by month and calculate average growth
  const monthlyData: Record<string, { total: number; count: number }> = {}
  growthData.forEach((g) => {
    const date = new Date(g.recorded_at)
    const monthKey = date.toLocaleDateString("en-US", { month: "short" })
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { total: 0, count: 0 }
    }
    monthlyData[monthKey].total += Number(g.growth_percentage || 0)
    monthlyData[monthKey].count += 1
  })

  // Convert to array format for charts
  return Object.entries(monthlyData).map(([month, { total, count }]) => ({
    month,
    growth: Math.round(total / count),
  }))
}

// Reports queries
export async function getReports() {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })

  if (error) {
    console.error("Error fetching reports:", error)
    return []
  }

  return (data as Report[]) || []
}
