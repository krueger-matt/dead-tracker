-- ============================================
-- Add "want to listen" support
-- ============================================

-- Add want_to_listen column to user_show_data
ALTER TABLE user_show_data ADD COLUMN IF NOT EXISTS want_to_listen BOOLEAN DEFAULT false;
