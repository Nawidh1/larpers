export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
  updated_at: string
}

export type Crop = {
  id: string
  user_id: string
  name: string
  location: string
  latitude: number | null
  longitude: number | null
  status: "growing" | "harvested" | "planned" | "issue"
  variety: string | null
  planted_at: string | null
  expected_harvest: string | null
  area_hectares: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type CropGrowth = {
  id: string
  crop_id: string
  recorded_at: string
  growth_percentage: number | null
  health_score: number | null
  notes: string | null
  created_at: string
}

export type BankAccount = {
  id: string
  user_id: string
  bank_name: string
  account_name: string
  account_number: string | null
  iban: string | null
  account_type: "checking" | "savings" | "business"
  provider: "plaid" | "tink" | "yapily" | "manual"
  access_token: string | null
  provider_account_id: string | null
  balance: number
  currency: string
  is_active: boolean
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export type Transaction = {
  id: string
  user_id: string
  bank_account_id: string | null
  date: string
  description: string
  category: string
  amount: number
  type: "income" | "expense"
  status: "pending" | "completed" | "cancelled"
  external_transaction_id: string | null
  created_at: string
}

export type ClimateData = {
  id: string
  user_id: string
  recorded_at: string
  temperature: number | null
  humidity: number | null
  rainfall_mm: number | null
  wind_speed: number | null
  location: string | null
  created_at: string
}

export type Report = {
  id: string
  user_id: string
  title: string
  type: "crop" | "financial" | "climate" | "custom"
  file_url: string | null
  generated_at: string
  created_at: string
}
