-- Sample seed data for testing
-- Run this after creating a user account

-- Note: Replace 'YOUR_USER_ID' with an actual user UUID after signup

-- Sample crops
INSERT INTO crops (user_id, name, location, status, variety, planted_at, expected_harvest, area_hectares) VALUES
  ('YOUR_USER_ID', 'Tomato Field', 'Section A', 'growing', 'Roma', '2025-01-01', '2025-04-15', 2.5),
  ('YOUR_USER_ID', 'Wheat Field', 'Section B', 'growing', 'Winter Wheat', '2024-10-15', '2025-06-01', 5.0),
  ('YOUR_USER_ID', 'Corn Field', 'Section C', 'planned', 'Sweet Corn', '2025-03-01', '2025-08-15', 3.0),
  ('YOUR_USER_ID', 'Potato Farm', 'Section D', 'growing', 'Russet', '2025-01-15', '2025-05-30', 1.8),
  ('YOUR_USER_ID', 'Carrot Rows', 'Section E', 'growing', 'Nantes', '2025-02-01', '2025-05-15', 0.5);

-- Sample transactions
INSERT INTO transactions (user_id, date, description, category, amount, type, status) VALUES
  ('YOUR_USER_ID', '2025-01-02', 'Seed Purchase', 'Seeds', -150.00, 'expense', 'completed'),
  ('YOUR_USER_ID', '2025-01-05', 'Tomato Sales', 'Sales', 2500.00, 'income', 'completed'),
  ('YOUR_USER_ID', '2025-01-08', 'Fertilizer', 'Supplies', -320.00, 'expense', 'completed'),
  ('YOUR_USER_ID', '2025-01-10', 'Equipment Rental', 'Equipment', -450.00, 'expense', 'completed'),
  ('YOUR_USER_ID', '2025-01-12', 'Wheat Sales', 'Sales', 3800.00, 'income', 'completed');

-- Sample climate data
INSERT INTO climate_data (user_id, recorded_at, temperature, humidity, rainfall_mm, location) VALUES
  ('YOUR_USER_ID', '2025-01-14 08:00:00', 28.5, 78.0, 0.0, 'Main Farm'),
  ('YOUR_USER_ID', '2025-01-13 08:00:00', 26.2, 82.0, 5.2, 'Main Farm'),
  ('YOUR_USER_ID', '2025-01-12 08:00:00', 24.8, 75.0, 0.0, 'Main Farm'),
  ('YOUR_USER_ID', '2025-01-11 08:00:00', 27.1, 71.0, 12.5, 'Main Farm'),
  ('YOUR_USER_ID', '2025-01-10 08:00:00', 29.3, 68.0, 0.0, 'Main Farm');
