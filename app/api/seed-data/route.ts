import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * API route to seed sample data for the current user
 * This adds test data to all tables so you can see how the website looks
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

    const userId = user.id

    // Check if user already has data
    const { data: existingCrops } = await supabase
      .from("crops")
      .select("id")
      .eq("user_id", userId)
      .limit(1)

    if (existingCrops && existingCrops.length > 0) {
      return NextResponse.json({ 
        message: "Data already exists. Use DELETE to clear first.",
        hasData: true 
      })
    }

    // Sample crops with coordinates
    const crops = [
      { name: 'Tomatenveld Oost', location: 'Flevoland - Sectie A', latitude: 52.5275, longitude: 5.5853, status: 'growing', variety: 'Roma', planted_at: '2025-01-15', expected_harvest: '2025-04-20', area_hectares: 2.5, notes: 'Biologische teelt, regelmatige irrigatie' },
      { name: 'Aardappelveld Noord', location: 'Flevoland - Sectie B', latitude: 52.5123, longitude: 5.6012, status: 'growing', variety: 'Bintje', planted_at: '2025-02-01', expected_harvest: '2025-06-15', area_hectares: 5.0, notes: 'Vroege oogst gepland' },
      { name: 'Tarweveld Centraal', location: 'Gelderland - Veld 1', latitude: 52.0907, longitude: 5.1214, status: 'growing', variety: 'Winter Tarwe', planted_at: '2024-10-20', expected_harvest: '2025-07-01', area_hectares: 8.0, notes: 'Goede bodemkwaliteit' },
      { name: 'Maisveld Zuid', location: 'Gelderland - Veld 2', latitude: 52.0650, longitude: 5.1500, status: 'planned', variety: 'Suikermais', planted_at: null, expected_harvest: '2025-09-15', area_hectares: 3.5, notes: 'Planting gepland voor maart' },
      { name: 'Wortelveld West', location: 'Noord-Brabant - Perceel 1', latitude: 51.4416, longitude: 5.4697, status: 'growing', variety: 'Nantes', planted_at: '2025-01-20', expected_harvest: '2025-05-10', area_hectares: 1.8, notes: 'Drainage verbeterd' },
      { name: 'Uienveld Oost', location: 'Noord-Brabant - Perceel 2', latitude: 51.4500, longitude: 5.4800, status: 'growing', variety: 'Rode Uien', planted_at: '2025-02-05', expected_harvest: '2025-08-20', area_hectares: 2.2, notes: null },
      { name: 'Sla Kassen', location: 'Zuid-Holland - Kas 1', latitude: 51.9225, longitude: 4.4777, status: 'growing', variety: 'Ijsbergsla', planted_at: '2025-01-10', expected_harvest: '2025-03-25', area_hectares: 0.5, notes: 'Kas teelt, gecontroleerd klimaat' },
      { name: 'Komkommer Kas', location: 'Zuid-Holland - Kas 2', latitude: 51.9300, longitude: 4.4850, status: 'growing', variety: 'Lange Komkommer', planted_at: '2025-01-05', expected_harvest: '2025-04-15', area_hectares: 0.8, notes: 'Hydroponische teelt' },
      { name: 'Gerst Veld', location: 'Friesland - Sectie Noord', latitude: 53.2012, longitude: 5.7999, status: 'growing', variety: 'Zomergerst', planted_at: '2025-02-10', expected_harvest: '2025-07-20', area_hectares: 6.5, notes: 'Traditionele teelt' },
      { name: 'Koolveld', location: 'Friesland - Sectie Zuid', latitude: 53.1900, longitude: 5.8100, status: 'planned', variety: 'Witte Kool', planted_at: null, expected_harvest: '2025-10-01', area_hectares: 2.0, notes: 'Planting in april' },
      { name: 'Bietenveld', location: 'Overijssel - Veld A', latitude: 52.2435, longitude: 6.1974, status: 'growing', variety: 'Suikerbiet', planted_at: '2025-01-25', expected_harvest: '2025-09-30', area_hectares: 4.5, notes: 'Contract teelt' },
      { name: 'Sperziebonen', location: 'Overijssel - Veld B', latitude: 52.2500, longitude: 6.2050, status: 'growing', variety: 'Prinsesboon', planted_at: '2025-02-15', expected_harvest: '2025-05-30', area_hectares: 1.2, notes: 'Stokbonen' },
      { name: 'Appelboomgaard', location: 'Limburg - Perceel 1', latitude: 50.8514, longitude: 5.6910, status: 'growing', variety: 'Elstar', planted_at: '2020-03-15', expected_harvest: '2025-09-15', area_hectares: 3.0, notes: 'Meerjarige aanplant, biologisch' },
      { name: 'Perenboomgaard', location: 'Limburg - Perceel 2', latitude: 50.8600, longitude: 5.7000, status: 'growing', variety: 'Conference', planted_at: '2019-03-20', expected_harvest: '2025-08-20', area_hectares: 2.5, notes: 'Meerjarige aanplant' },
      { name: 'Roggeveld', location: 'Drenthe - Veld 1', latitude: 52.7896, longitude: 6.8956, status: 'growing', variety: 'Winterrogge', planted_at: '2024-10-15', expected_harvest: '2025-07-10', area_hectares: 7.0, notes: 'Biologisch geteeld' },
      { name: 'Grasland', location: 'Drenthe - Veld 2', latitude: 52.8000, longitude: 6.9050, status: 'growing', variety: 'Weidegras', planted_at: '2024-09-01', expected_harvest: null, area_hectares: 12.0, notes: 'Veevoeder productie' },
      { name: 'Prei Veld', location: 'Zeeland - Perceel A', latitude: 51.4946, longitude: 3.8497, status: 'growing', variety: 'Winterprei', planted_at: '2024-11-10', expected_harvest: '2025-05-01', area_hectares: 2.8, notes: 'Zouttolerante variëteit' },
      { name: 'Spinazie Veld', location: 'Zeeland - Perceel B', latitude: 51.5000, longitude: 3.8600, status: 'harvested', variety: 'Gewone Spinazie', planted_at: '2024-12-01', expected_harvest: '2025-02-15', area_hectares: 1.5, notes: 'Reeds geoogst' },
      { name: 'Tulpenveld', location: 'Noord-Holland - Veld 1', latitude: 52.3702, longitude: 4.8952, status: 'growing', variety: 'Rode Tulpen', planted_at: '2024-10-01', expected_harvest: '2025-04-20', area_hectares: 1.0, notes: 'Siergewassen' },
      { name: 'Bloemkool', location: 'Noord-Holland - Veld 2', latitude: 52.3800, longitude: 4.9000, status: 'issue', variety: 'Witte Bloemkool', planted_at: '2025-01-10', expected_harvest: '2025-05-15', area_hectares: 1.8, notes: 'Ziekte gedetecteerd - behandeling nodig' },
    ]

    // Insert crops
    const cropsWithUserId = crops.map(crop => ({ ...crop, user_id: userId }))
    const { data: insertedCropsData, error: cropsError } = await supabase
      .from("crops")
      .insert(cropsWithUserId)
      .select("id")

    if (cropsError) {
      console.error("Error inserting crops:", cropsError)
      return NextResponse.json({ 
        error: "Failed to insert crops", 
        details: cropsError.message,
        code: cropsError.code,
        hint: cropsError.hint 
      }, { status: 500 })
    }

    // Use inserted crops data or fetch if needed
    const insertedCrops = insertedCropsData || []

    // Sample transactions
    const transactions = [
      { date: '2025-01-02', description: 'Zaad Aankoop', category: 'Zaden', amount: -150.00, type: 'expense', status: 'completed' },
      { date: '2025-01-05', description: 'Tomaten Verkoop', category: 'Verkoop', amount: 2500.00, type: 'income', status: 'completed' },
      { date: '2025-01-08', description: 'Meststof', category: 'Benodigdheden', amount: -320.00, type: 'expense', status: 'completed' },
      { date: '2025-01-10', description: 'Apparatuur Verhuur', category: 'Apparatuur', amount: -450.00, type: 'expense', status: 'completed' },
      { date: '2025-01-12', description: 'Tarwe Verkoop', category: 'Verkoop', amount: 3800.00, type: 'income', status: 'completed' },
      { date: '2025-01-15', description: 'Irrigatie Systeem', category: 'Apparatuur', amount: -1250.00, type: 'expense', status: 'completed' },
      { date: '2025-01-18', description: 'Aardappelen Verkoop', category: 'Verkoop', amount: 4200.00, type: 'income', status: 'completed' },
      { date: '2025-01-20', description: 'Pesticiden', category: 'Benodigdheden', amount: -180.00, type: 'expense', status: 'completed' },
      { date: '2025-01-22', description: 'Wortelen Verkoop', category: 'Verkoop', amount: 1500.00, type: 'income', status: 'completed' },
      { date: '2025-01-25', description: 'Brandstof', category: 'Transport', amount: -95.00, type: 'expense', status: 'completed' },
      { date: '2025-01-28', description: 'Uien Verkoop', category: 'Verkoop', amount: 2100.00, type: 'income', status: 'completed' },
      { date: '2025-02-01', description: 'Nieuwe Trekkers', category: 'Apparatuur', amount: -8500.00, type: 'expense', status: 'pending' },
      { date: '2025-02-03', description: 'Komkommer Verkoop', category: 'Verkoop', amount: 3200.00, type: 'income', status: 'completed' },
      { date: '2025-02-05', description: 'Kas Onderhoud', category: 'Onderhoud', amount: -280.00, type: 'expense', status: 'completed' },
      { date: '2025-02-08', description: 'Sla Verkoop', category: 'Verkoop', amount: 1800.00, type: 'income', status: 'completed' },
      { date: '2025-02-10', description: 'Bonen Zaden', category: 'Zaden', amount: -120.00, type: 'expense', status: 'completed' },
      { date: '2025-02-12', description: 'Bieten Verkoop', category: 'Verkoop', amount: 5500.00, type: 'income', status: 'completed' },
      { date: '2025-02-15', description: 'Landarbeiders', category: 'Arbeid', amount: -850.00, type: 'expense', status: 'completed' },
      { date: '2025-02-18', description: 'Gerst Verkoop', category: 'Verkoop', amount: 4800.00, type: 'income', status: 'completed' },
      { date: '2025-02-20', description: 'Verzekering', category: 'Overig', amount: -450.00, type: 'expense', status: 'completed' },
    ]

    const transactionsWithUserId = transactions.map(tx => ({ ...tx, user_id: userId }))
    const { error: transactionsError } = await supabase.from("transactions").insert(transactionsWithUserId)

    if (transactionsError) {
      console.error("Error inserting transactions:", transactionsError)
    }

    // Sample climate data (last 30 days)
    const now = new Date()
    const climateData = []
    for (let i = 0; i < 30; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const temp = 2 + Math.random() * 8 // 2-10°C (winter temps)
      const humidity = 65 + Math.random() * 25 // 65-90%
      const rainfall = Math.random() > 0.7 ? Math.random() * 30 : 0 // Sometimes rain
      const windSpeed = 5 + Math.random() * 20 // 5-25 km/h
      
      climateData.push({
        user_id: userId,
        recorded_at: date.toISOString(),
        temperature: Math.round(temp * 10) / 10,
        humidity: Math.round(humidity * 10) / 10,
        rainfall_mm: Math.round(rainfall * 10) / 10,
        wind_speed: Math.round(windSpeed * 10) / 10,
        location: 'Hoofdlocatie',
      })
    }

    const { error: climateError } = await supabase.from("climate_data").insert(climateData)

    if (climateError) {
      console.error("Error inserting climate data:", climateError)
    }

    // Sample crop growth data
    if (insertedCrops && insertedCrops.length > 0) {
      const growthData = []
      for (const crop of insertedCrops.slice(0, 10)) { // First 10 crops
        for (let day = 0; day < 20; day++) {
          const date = new Date('2025-01-01')
          date.setDate(date.getDate() + day)
          growthData.push({
            crop_id: crop.id,
            recorded_at: date.toISOString().split('T')[0],
            growth_percentage: Math.round(30 + (day * 3) + (Math.random() * 5)),
            health_score: Math.round(60 + (Math.random() * 40)),
            notes: Math.random() > 0.8 ? 'Goede groei, geen problemen' : null,
          })
        }
      }
      const { error: growthError } = await supabase.from("crop_growth").insert(growthData)
      if (growthError) {
        console.error("Error inserting crop growth:", growthError)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: "Sample data toegevoegd!",
      crops: crops.length,
      transactions: transactions.length,
      climateData: climateData.length,
    })
  } catch (error: any) {
    console.error("Error seeding data:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

/**
 * DELETE route to clear all user data
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = user.id

    // Get crop IDs first
    const { data: userCrops } = await supabase
      .from("crops")
      .select("id")
      .eq("user_id", userId)

    const cropIds = userCrops?.map(c => c.id) || []

    // Delete in correct order (respecting foreign keys)
    if (cropIds.length > 0) {
      await supabase.from("crop_growth").delete().in("crop_id", cropIds)
    }
    await supabase.from("transactions").delete().eq("user_id", userId)
    await supabase.from("climate_data").delete().eq("user_id", userId)
    await supabase.from("crops").delete().eq("user_id", userId)

    return NextResponse.json({ success: true, message: "Alle data verwijderd" })
  } catch (error: any) {
    console.error("Error deleting data:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}
