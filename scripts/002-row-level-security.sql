-- Row Level Security Policies
-- These ensure users can only access their own data

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_growth ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE climate_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Crops policies
CREATE POLICY "Users can view own crops" ON crops
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crops" ON crops
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crops" ON crops
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own crops" ON crops
  FOR DELETE USING (auth.uid() = user_id);

-- Crop growth policies
CREATE POLICY "Users can view own crop growth" ON crop_growth
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM crops WHERE crops.id = crop_growth.crop_id AND crops.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own crop growth" ON crop_growth
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM crops WHERE crops.id = crop_growth.crop_id AND crops.user_id = auth.uid()
    )
  );

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- Climate data policies
CREATE POLICY "Users can view own climate data" ON climate_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own climate data" ON climate_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reports policies
CREATE POLICY "Users can view own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports" ON reports
  FOR DELETE USING (auth.uid() = user_id);
