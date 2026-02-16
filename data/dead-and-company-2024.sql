-- ============================================
-- Add band support + Dead & Company 2024 shows
-- ============================================

-- Step 1: Add band column to shows table
ALTER TABLE shows ADD COLUMN IF NOT EXISTS band TEXT DEFAULT 'Grateful Dead';

-- Step 2: Update all existing shows to be Grateful Dead (in case any are NULL)
UPDATE shows SET band = 'Grateful Dead' WHERE band IS NULL;

-- Step 3: Insert Dead & Company 2024 Sphere residency (30 shows)
INSERT INTO shows (id, date, show_number, venue, city, state, has_archive_recordings, band)
VALUES
  ('dc2024-05-16', '2024-05-16', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-05-17', '2024-05-17', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-05-18', '2024-05-18', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-05-24', '2024-05-24', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-05-25', '2024-05-25', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-05-26', '2024-05-26', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-05-30', '2024-05-30', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-05-31', '2024-05-31', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-06-01', '2024-06-01', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-06-06', '2024-06-06', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-06-07', '2024-06-07', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-06-08', '2024-06-08', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-06-13', '2024-06-13', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-06-14', '2024-06-14', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-06-15', '2024-06-15', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-06-20', '2024-06-20', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-06-21', '2024-06-21', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-06-22', '2024-06-22', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-07-04', '2024-07-04', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-07-05', '2024-07-05', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-07-06', '2024-07-06', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-07-11', '2024-07-11', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-07-12', '2024-07-12', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-07-13', '2024-07-13', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-08-01', '2024-08-01', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-08-02', '2024-08-02', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-08-03', '2024-08-03', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-08-08', '2024-08-08', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-08-09', '2024-08-09', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company'),
  ('dc2024-08-10', '2024-08-10', 1, 'Sphere', 'Las Vegas', 'NV', false, 'Dead & Company')
ON CONFLICT (id) DO NOTHING;
