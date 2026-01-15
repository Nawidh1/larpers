-- Agritech Dashboard Database Schema - Complete Setup
-- Run this script in your Supabase SQL Editor after connecting
-- This combines all setup scripts: create tables, RLS policies, and seed data

-- ============================================================================
-- PART 1: CREATE TABLES
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'farmer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crops table
CREATE TABLE IF NOT EXISTS crops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8), -- For map coordinates
  longitude DECIMAL(11, 8), -- For map coordinates
  status TEXT DEFAULT 'growing' CHECK (status IN ('growing', 'harvested', 'planned', 'issue')),
  variety TEXT,
  planted_at DATE,
  expected_harvest DATE,
  area_hectares DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crop growth data (for charts)
CREATE TABLE IF NOT EXISTS crop_growth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL,
  growth_percentage DECIMAL(5, 2),
  health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank accounts table (for Open Banking integration)
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT,
  iban TEXT,
  account_type TEXT DEFAULT 'checking' CHECK (account_type IN ('checking', 'savings', 'business')),
  provider TEXT NOT NULL CHECK (provider IN ('plaid', 'tink', 'yapily', 'manual')),
  access_token TEXT, -- Encrypted token for API access
  provider_account_id TEXT, -- External account ID from provider
  balance DECIMAL(12, 2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  external_transaction_id TEXT, -- ID from bank provider for deduplication
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Climate data table
CREATE TABLE IF NOT EXISTS climate_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  temperature DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  rainfall_mm DECIMAL(8, 2),
  wind_speed DECIMAL(6, 2),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('crop', 'financial', 'climate', 'custom')),
  file_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing transactions table (if table already exists)
DO $$ 
BEGIN
  -- Add bank_account_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'bank_account_id'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;
  END IF;

  -- Add external_transaction_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'external_transaction_id'
  ) THEN
    ALTER TABLE transactions 
    ADD COLUMN external_transaction_id TEXT;
  END IF;
END $$;

-- Add latitude and longitude columns to existing crops table (if table already exists)
DO $$ 
BEGIN
  -- Add latitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crops' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE crops 
    ADD COLUMN latitude DECIMAL(10, 8);
  END IF;

  -- Add longitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crops' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE crops 
    ADD COLUMN longitude DECIMAL(11, 8);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crops_user_id ON crops(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account_id ON transactions(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_transaction_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_climate_data_user_id ON climate_data(user_id);
CREATE INDEX IF NOT EXISTS idx_crop_growth_crop_id ON crop_growth(crop_id);

-- ============================================================================
-- PART 2: AUTO-CREATE PROFILES
-- ============================================================================
-- Automatically create a profile when a user signs up

-- Function to create profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'farmer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 3: ROW LEVEL SECURITY POLICIES
-- ============================================================================
-- These ensure users can only access their own data

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT COALESCE((SELECT role FROM profiles WHERE id = user_id), 'farmer');
$$ LANGUAGE sql SECURITY DEFINER;

-- Drop existing policies if they exist (to allow re-running this script)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own crops" ON crops;
DROP POLICY IF EXISTS "Users can insert own crops" ON crops;
DROP POLICY IF EXISTS "Users can update own crops" ON crops;
DROP POLICY IF EXISTS "Users can delete own crops" ON crops;
DROP POLICY IF EXISTS "Users can view crops" ON crops;
DROP POLICY IF EXISTS "Farmers and admins can insert crops" ON crops;
DROP POLICY IF EXISTS "Farmers and admins can update crops" ON crops;
DROP POLICY IF EXISTS "Farmers and admins can delete crops" ON crops;
DROP POLICY IF EXISTS "Users can view own crop growth" ON crop_growth;
DROP POLICY IF EXISTS "Users can insert own crop growth" ON crop_growth;
DROP POLICY IF EXISTS "Users can view crop growth" ON crop_growth;
DROP POLICY IF EXISTS "Farmers and admins can insert crop growth" ON crop_growth;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view transactions" ON transactions;
DROP POLICY IF EXISTS "Farmers and admins can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Farmers and admins can update transactions" ON transactions;
DROP POLICY IF EXISTS "Farmers and admins can delete transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own climate data" ON climate_data;
DROP POLICY IF EXISTS "Users can insert own climate data" ON climate_data;
DROP POLICY IF EXISTS "Users can view climate data" ON climate_data;
DROP POLICY IF EXISTS "Farmers and admins can insert climate data" ON climate_data;
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;
DROP POLICY IF EXISTS "Users can view reports" ON reports;
DROP POLICY IF EXISTS "Farmers and admins can insert reports" ON reports;
DROP POLICY IF EXISTS "Farmers and admins can delete reports" ON reports;
DROP POLICY IF EXISTS "Users can view own bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Farmers and admins can insert bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Farmers and admins can update bank accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Farmers and admins can delete bank accounts" ON bank_accounts;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles for user management
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR 
    get_user_role(auth.uid()) = 'admin'
  );

-- Admin-only: Allow admins to update user roles
CREATE POLICY "Admins can update profiles" ON profiles
  FOR UPDATE USING (
    auth.uid() = id OR get_user_role(auth.uid()) = 'admin'
  )
  WITH CHECK (
    auth.uid() = id OR get_user_role(auth.uid()) = 'admin'
  );

-- Crops policies with role-based access
-- SELECT: All authenticated users can view crops (for auditors to read)
CREATE POLICY "Users can view crops" ON crops
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      get_user_role(auth.uid()) IN ('auditor', 'admin')
    )
  );

-- INSERT/UPDATE/DELETE: Only farmers and admins can modify
CREATE POLICY "Farmers and admins can insert crops" ON crops
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    get_user_role(auth.uid()) IN ('farmer', 'admin')
  );

CREATE POLICY "Farmers and admins can update crops" ON crops
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    get_user_role(auth.uid()) IN ('farmer', 'admin')
  );

CREATE POLICY "Farmers and admins can delete crops" ON crops
  FOR DELETE USING (
    auth.uid() = user_id AND 
    get_user_role(auth.uid()) IN ('farmer', 'admin')
  );

-- Crop growth policies
CREATE POLICY "Users can view crop growth" ON crop_growth
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM crops 
        WHERE crops.id = crop_growth.crop_id 
        AND (crops.user_id = auth.uid() OR get_user_role(auth.uid()) IN ('auditor', 'admin'))
      )
    )
  );

CREATE POLICY "Farmers and admins can insert crop growth" ON crop_growth
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM crops 
      WHERE crops.id = crop_growth.crop_id 
      AND crops.user_id = auth.uid() 
      AND get_user_role(auth.uid()) IN ('farmer', 'admin')
    )
  );

-- Transactions policies
CREATE POLICY "Users can view transactions" ON transactions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      get_user_role(auth.uid()) IN ('auditor', 'admin')
    )
  );

CREATE POLICY "Farmers and admins can insert transactions" ON transactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    get_user_role(auth.uid()) IN ('farmer', 'admin')
  );

CREATE POLICY "Farmers and admins can update transactions" ON transactions
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    get_user_role(auth.uid()) IN ('farmer', 'admin')
  );

CREATE POLICY "Farmers and admins can delete transactions" ON transactions
  FOR DELETE USING (
    auth.uid() = user_id AND 
    get_user_role(auth.uid()) IN ('farmer', 'admin')
  );

-- Climate data policies
CREATE POLICY "Users can view climate data" ON climate_data
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      get_user_role(auth.uid()) IN ('auditor', 'admin')
    )
  );

CREATE POLICY "Farmers and admins can insert climate data" ON climate_data
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    get_user_role(auth.uid()) IN ('farmer', 'admin')
  );

-- Reports policies
CREATE POLICY "Users can view reports" ON reports
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      get_user_role(auth.uid()) IN ('auditor', 'admin')
    )
  );

CREATE POLICY "Farmers and admins can insert reports" ON reports
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    get_user_role(auth.uid()) IN ('farmer', 'admin')
  );

CREATE POLICY "Farmers and admins can delete reports" ON reports
  FOR DELETE USING (
    auth.uid() = user_id AND 
    get_user_role(auth.uid()) IN ('farmer', 'admin')
  );

-- Bank accounts policies
CREATE POLICY "Users can view own bank accounts" ON bank_accounts
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR 
      get_user_role(auth.uid()) IN ('auditor', 'admin')
    )
  );

CREATE POLICY "Farmers and admins can insert bank accounts" ON bank_accounts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    get_user_role(auth.uid()) IN ('farmer', 'admin')
  );

CREATE POLICY "Farmers and admins can update bank accounts" ON bank_accounts
  FOR UPDATE USING (
    auth.uid() = user_id AND 
    get_user_role(auth.uid()) IN ('farmer', 'admin')
  );

CREATE POLICY "Farmers and admins can delete bank accounts" ON bank_accounts
  FOR DELETE USING (
    auth.uid() = user_id AND 
    get_user_role(auth.uid()) IN ('farmer', 'admin')
  );

-- ============================================================================
-- PART 4: SAMPLE SEED DATA (OPTIONAL)
-- ============================================================================
-- This section is commented out by default to prevent errors.
-- To use seed data:
-- 1. First, create a user account in Supabase Auth
-- 2. Find your user UUID in Supabase Dashboard > Authentication > Users
-- 3. Uncomment the INSERT statements below and replace 'YOUR_USER_ID' with your actual UUID
-- 4. Run this section separately after completing Parts 1, 2, and 3

/*
-- Sample crops with coordinates (for map visualization)
INSERT INTO crops (user_id, name, location, latitude, longitude, status, variety, planted_at, expected_harvest, area_hectares, notes) VALUES
  -- Flevoland
  ('YOUR_USER_ID', 'Tomatenveld Oost', 'Flevoland - Sectie A', 52.5275, 5.5853, 'growing', 'Roma', '2025-01-15', '2025-04-20', 2.5, 'Biologische teelt, regelmatige irrigatie'),
  ('YOUR_USER_ID', 'Aardappelveld Noord', 'Flevoland - Sectie B', 52.5123, 5.6012, 'growing', 'Bintje', '2025-02-01', '2025-06-15', 5.0, 'Vroege oogst gepland'),
  
  -- Gelderland
  ('YOUR_USER_ID', 'Tarweveld Centraal', 'Gelderland - Veld 1', 52.0907, 5.1214, 'growing', 'Winter Tarwe', '2024-10-20', '2025-07-01', 8.0, 'Goede bodemkwaliteit'),
  ('YOUR_USER_ID', 'Maisveld Zuid', 'Gelderland - Veld 2', 52.0650, 5.1500, 'planned', 'Suikermais', NULL, '2025-09-15', 3.5, 'Planting gepland voor maart'),
  
  -- Noord-Brabant
  ('YOUR_USER_ID', 'Wortelveld West', 'Noord-Brabant - Perceel 1', 51.4416, 5.4697, 'growing', 'Nantes', '2025-01-20', '2025-05-10', 1.8, 'Drainage verbeterd'),
  ('YOUR_USER_ID', 'Uienveld Oost', 'Noord-Brabant - Perceel 2', 51.4500, 5.4800, 'growing', 'Rode Uien', '2025-02-05', '2025-08-20', 2.2, NULL),
  
  -- Zuid-Holland
  ('YOUR_USER_ID', 'Sla Kassen', 'Zuid-Holland - Kas 1', 51.9225, 4.4777, 'growing', 'Ijsbergsla', '2025-01-10', '2025-03-25', 0.5, 'Kas teelt, gecontroleerd klimaat'),
  ('YOUR_USER_ID', 'Komkommer Kas', 'Zuid-Holland - Kas 2', 51.9300, 4.4850, 'growing', 'Lange Komkommer', '2025-01-05', '2025-04-15', 0.8, 'Hydroponische teelt'),
  
  -- Friesland
  ('YOUR_USER_ID', 'Gerst Veld', 'Friesland - Sectie Noord', 53.2012, 5.7999, 'growing', 'Zomergerst', '2025-02-10', '2025-07-20', 6.5, 'Traditionele teelt'),
  ('YOUR_USER_ID', 'Koolveld', 'Friesland - Sectie Zuid', 53.1900, 5.8100, 'planned', 'Witte Kool', NULL, '2025-10-01', 2.0, 'Planting in april'),
  
  -- Overijssel
  ('YOUR_USER_ID', 'Bietenveld', 'Overijssel - Veld A', 52.2435, 6.1974, 'growing', 'Suikerbiet', '2025-01-25', '2025-09-30', 4.5, 'Contract teelt'),
  ('YOUR_USER_ID', 'Sperziebonen', 'Overijssel - Veld B', 52.2500, 6.2050, 'growing', 'Prinsesboon', '2025-02-15', '2025-05-30', 1.2, 'Stokbonen'),
  
  -- Limburg
  ('YOUR_USER_ID', 'Appelboomgaard', 'Limburg - Perceel 1', 50.8514, 5.6910, 'growing', 'Elstar', '2020-03-15', '2025-09-15', 3.0, 'Meerjarige aanplant, biologisch'),
  ('YOUR_USER_ID', 'Perenboomgaard', 'Limburg - Perceel 2', 50.8600, 5.7000, 'growing', 'Conference', '2019-03-20', '2025-08-20', 2.5, 'Meerjarige aanplant'),
  
  -- Drenthe
  ('YOUR_USER_ID', 'Roggeveld', 'Drenthe - Veld 1', 52.7896, 6.8956, 'growing', 'Winterrogge', '2024-10-15', '2025-07-10', 7.0, 'Biologisch geteeld'),
  ('YOUR_USER_ID', 'Grasland', 'Drenthe - Veld 2', 52.8000, 6.9050, 'growing', 'Weidegras', '2024-09-01', NULL, 12.0, 'Veevoeder productie'),
  
  -- Zeeland
  ('YOUR_USER_ID', 'Prei Veld', 'Zeeland - Perceel A', 51.4946, 3.8497, 'growing', 'Winterprei', '2024-11-10', '2025-05-01', 2.8, 'Zouttolerante variëteit'),
  ('YOUR_USER_ID', 'Spinazie Veld', 'Zeeland - Perceel B', 51.5000, 3.8600, 'harvested', 'Gewone Spinazie', '2024-12-01', '2025-02-15', 1.5, 'Reeds geoogst'),
  
  -- Noord-Holland
  ('YOUR_USER_ID', 'Tulpenveld', 'Noord-Holland - Veld 1', 52.3702, 4.8952, 'growing', 'Rode Tulpen', '2024-10-01', '2025-04-20', 1.0, 'Siergewassen'),
  ('YOUR_USER_ID', 'Bloemkool', 'Noord-Holland - Veld 2', 52.3800, 4.9000, 'issue', 'Witte Bloemkool', '2025-01-10', '2025-05-15', 1.8, 'Ziekte gedetecteerd - behandeling nodig');

-- Sample transactions (for finance page)
INSERT INTO transactions (user_id, date, description, category, amount, type, status) VALUES
  ('YOUR_USER_ID', '2025-01-02', 'Zaad Aankoop', 'Zaden', -150.00, 'expense', 'completed'),
  ('YOUR_USER_ID', '2025-01-05', 'Tomaten Verkoop', 'Verkoop', 2500.00, 'income', 'completed'),
  ('YOUR_USER_ID', '2025-01-08', 'Meststof', 'Benodigdheden', -320.00, 'expense', 'completed'),
  ('YOUR_USER_ID', '2025-01-10', 'Apparatuur Verhuur', 'Apparatuur', -450.00, 'expense', 'completed'),
  ('YOUR_USER_ID', '2025-01-12', 'Tarwe Verkoop', 'Verkoop', 3800.00, 'income', 'completed'),
  ('YOUR_USER_ID', '2025-01-15', 'Irrigatie Systeem', 'Apparatuur', -1250.00, 'expense', 'completed'),
  ('YOUR_USER_ID', '2025-01-18', 'Aardappelen Verkoop', 'Verkoop', 4200.00, 'income', 'completed'),
  ('YOUR_USER_ID', '2025-01-20', 'Pesticiden', 'Benodigdheden', -180.00, 'expense', 'completed'),
  ('YOUR_USER_ID', '2025-01-22', 'Wortelen Verkoop', 'Verkoop', 1500.00, 'income', 'completed'),
  ('YOUR_USER_ID', '2025-01-25', 'Brandstof', 'Transport', -95.00, 'expense', 'completed'),
  ('YOUR_USER_ID', '2025-01-28', 'Uien Verkoop', 'Verkoop', 2100.00, 'income', 'completed'),
  ('YOUR_USER_ID', '2025-02-01', 'Nieuwe Trekkers', 'Apparatuur', -8500.00, 'expense', 'pending'),
  ('YOUR_USER_ID', '2025-02-03', 'Komkommer Verkoop', 'Verkoop', 3200.00, 'income', 'completed'),
  ('YOUR_USER_ID', '2025-02-05', 'Kas Onderhoud', 'Onderhoud', -280.00, 'expense', 'completed'),
  ('YOUR_USER_ID', '2025-02-08', 'Sla Verkoop', 'Verkoop', 1800.00, 'income', 'completed'),
  ('YOUR_USER_ID', '2025-02-10', 'Bonen Zaden', 'Zaden', -120.00, 'expense', 'completed'),
  ('YOUR_USER_ID', '2025-02-12', 'Bieten Verkoop', 'Verkoop', 5500.00, 'income', 'completed'),
  ('YOUR_USER_ID', '2025-02-15', 'Landarbeiders', 'Arbeid', -850.00, 'expense', 'completed'),
  ('YOUR_USER_ID', '2025-02-18', 'Gerst Verkoop', 'Verkoop', 4800.00, 'income', 'completed'),
  ('YOUR_USER_ID', '2025-02-20', 'Verzekering', 'Overig', -450.00, 'expense', 'completed');

-- Sample climate data (for climate page - last 30 days)
INSERT INTO climate_data (user_id, recorded_at, temperature, humidity, rainfall_mm, wind_speed, location) VALUES
  ('YOUR_USER_ID', '2025-01-14 08:00:00', 8.5, 78.0, 0.0, 12.5, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-13 08:00:00', 6.2, 82.0, 5.2, 15.3, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-12 08:00:00', 4.8, 75.0, 0.0, 10.2, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-11 08:00:00', 7.1, 71.0, 12.5, 18.7, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-10 08:00:00', 9.3, 68.0, 0.0, 8.9, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-09 08:00:00', 5.7, 85.0, 8.3, 14.1, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-08 08:00:00', 3.2, 88.0, 15.6, 20.3, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-07 08:00:00', 2.8, 90.0, 22.1, 16.8, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-06 08:00:00', 4.5, 82.0, 3.5, 11.4, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-05 08:00:00', 6.9, 76.0, 0.0, 9.7, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-04 08:00:00', 8.1, 72.0, 0.0, 7.2, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-03 08:00:00', 7.5, 74.0, 1.2, 8.5, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-02 08:00:00', 5.3, 80.0, 6.8, 13.6, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2025-01-01 08:00:00', 3.9, 87.0, 18.4, 19.2, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-31 08:00:00', 2.1, 91.0, 25.7, 22.1, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-30 08:00:00', 1.8, 89.0, 19.3, 17.5, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-29 08:00:00', 4.2, 83.0, 4.6, 12.3, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-28 08:00:00', 6.7, 77.0, 0.0, 10.8, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-27 08:00:00', 8.9, 70.0, 0.0, 6.4, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-26 08:00:00', 7.3, 73.0, 0.0, 7.9, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-25 08:00:00', 5.6, 79.0, 2.1, 11.2, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-24 08:00:00', 3.4, 86.0, 9.7, 15.8, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-23 08:00:00', 2.7, 88.0, 14.2, 18.4, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-22 08:00:00', 1.5, 92.0, 28.5, 21.7, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-21 08:00:00', 0.8, 94.0, 32.1, 24.3, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-20 08:00:00', 2.3, 90.0, 16.8, 19.6, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-19 08:00:00', 4.6, 84.0, 7.3, 14.2, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-18 08:00:00', 6.2, 78.0, 0.0, 9.5, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-17 08:00:00', 7.8, 75.0, 0.0, 8.1, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-16 08:00:00', 9.1, 71.0, 0.0, 5.7, 'Hoofdlocatie'),
  ('YOUR_USER_ID', '2024-12-15 08:00:00', 8.4, 73.0, 0.0, 6.8, 'Hoofdlocatie');

-- Sample crop growth data (for crop growth charts)
INSERT INTO crop_growth (crop_id, recorded_at, growth_percentage, health_score, notes) 
SELECT 
  c.id,
  date_series.date,
  30 + (random() * 70)::int as growth_percentage,
  60 + (random() * 40)::int as health_score,
  CASE WHEN random() > 0.7 THEN 'Goede groei, geen problemen' ELSE NULL END as notes
FROM crops c
CROSS JOIN generate_series('2025-01-01'::date, '2025-01-20'::date, '1 day'::interval) as date_series
WHERE c.user_id = 'YOUR_USER_ID' AND c.status = 'growing'
LIMIT 100;
*/

-- ============================================================================
-- Setup Complete!
-- ============================================================================
-- Remember to replace 'YOUR_USER_ID' in the seed data section with your actual user UUID
-- You can find your user ID in Supabase Dashboard > Authentication > Users
