-- Create the shows table
CREATE TABLE shows (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  venue TEXT NOT NULL,
  city TEXT,
  state TEXT,
  has_archive_recordings BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on date for faster queries
CREATE INDEX idx_shows_date ON shows(date);

-- Create index on venue for search
CREATE INDEX idx_shows_venue ON shows(venue);

-- Enable Row Level Security (optional, for future multi-user)
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Public shows are viewable by everyone"
  ON shows FOR SELECT
  USING (true);
