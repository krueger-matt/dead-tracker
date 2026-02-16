-- ============================================
-- Dead & Company 2024-05-16 Setlist (Sphere, Las Vegas)
-- ============================================

-- Step 1: Insert any songs that might not already exist
-- (Most of these should already be in the songs table from GD data)
INSERT INTO songs (id, name) VALUES
  ('feel-like-a-stranger', 'Feel Like a Stranger'),
  ('mississippi-half-step-uptown-toodeloo', 'Mississippi Half-Step Uptown Toodeloo'),
  ('jack-straw', 'Jack Straw'),
  ('bird-song', 'Bird Song'),
  ('me-and-my-uncle', 'Me and My Uncle'),
  ('brown-eyed-women', 'Brown-Eyed Women'),
  ('cold-rain-and-snow', 'Cold Rain and Snow'),
  ('uncle-johns-band', 'Uncle John''s Band'),
  ('help-on-the-way', 'Help on the Way'),
  ('slipknot', 'Slipknot!'),
  ('franklins-tower', 'Franklin''s Tower'),
  ('hes-gone', 'He''s Gone'),
  ('drums', 'Drums'),
  ('space', 'Space'),
  ('standing-on-the-moon', 'Standing on the Moon'),
  ('st-stephen', 'St. Stephen'),
  ('hell-in-a-bucket', 'Hell in a Bucket'),
  ('knockin-on-heavens-door', 'Knockin'' on Heaven''s Door'),
  ('not-fade-away', 'Not Fade Away')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Insert setlist entries
-- Set 1
INSERT INTO setlists (show_id, set_name, position, song_id, segue) VALUES
  ('dc2024-05-16', 'Set 1', 1, 'feel-like-a-stranger', false),
  ('dc2024-05-16', 'Set 1', 2, 'mississippi-half-step-uptown-toodeloo', false),
  ('dc2024-05-16', 'Set 1', 3, 'jack-straw', false),
  ('dc2024-05-16', 'Set 1', 4, 'bird-song', false),
  ('dc2024-05-16', 'Set 1', 5, 'me-and-my-uncle', false),
  ('dc2024-05-16', 'Set 1', 6, 'brown-eyed-women', false),
  ('dc2024-05-16', 'Set 1', 7, 'cold-rain-and-snow', false);

-- Set 2
INSERT INTO setlists (show_id, set_name, position, song_id, segue) VALUES
  ('dc2024-05-16', 'Set 2', 1, 'uncle-johns-band', false),
  ('dc2024-05-16', 'Set 2', 2, 'help-on-the-way', true),
  ('dc2024-05-16', 'Set 2', 3, 'slipknot', true),
  ('dc2024-05-16', 'Set 2', 4, 'franklins-tower', false),
  ('dc2024-05-16', 'Set 2', 5, 'hes-gone', true),
  ('dc2024-05-16', 'Set 2', 6, 'drums', true),
  ('dc2024-05-16', 'Set 2', 7, 'space', true),
  ('dc2024-05-16', 'Set 2', 8, 'standing-on-the-moon', false),
  ('dc2024-05-16', 'Set 2', 9, 'st-stephen', false),
  ('dc2024-05-16', 'Set 2', 10, 'hell-in-a-bucket', false),
  ('dc2024-05-16', 'Set 2', 11, 'knockin-on-heavens-door', false);

-- Encore
INSERT INTO setlists (show_id, set_name, position, song_id, segue) VALUES
  ('dc2024-05-16', 'Encore', 1, 'not-fade-away', false);
