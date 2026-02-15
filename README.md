# Grateful Dead Show Tracker

A web application to track which Grateful Dead shows you've listened to, with links to recordings on archive.org.

## Features

✅ Complete list of all Grateful Dead shows  
✅ Links to archive.org for shows with available recordings  
✅ Track which shows you've listened to  
✅ Search by venue, city, or date  
✅ Filter by year  
✅ Filter to show only shows with archive recordings  
✅ Progress tracking (X out of Y shows listened)  
✅ Mobile-friendly design  
✅ Database backend for permanent storage (when connected to Supabase)

## Current Status

**Development Mode:** Currently using sample data (18 shows) and browser localStorage. This is fully functional but:
- Data only includes sample shows
- Progress is saved in browser only (won't sync across devices)
- Data could be lost if you clear browser data

**Production Mode (coming soon):** Will connect to Supabase for:
- All ~2,300 Grateful Dead shows
- Permanent cloud storage
- Sync across all your devices

## Local Development

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone or download this project

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## Deploying to GitHub Pages

### Step 1: Update vite.config.js

Make sure the `base` setting matches your repository name:
```js
export default defineConfig({
  plugins: [react()],
  base: '/dead-tracker/', // Change this to match your repo name
})
```

### Step 2: Add to your existing mattkrueger.org repository

1. Copy the entire `dead-tracker` folder into your `mattkrueger.org` repository

2. Add a new script to your main `package.json` (or create one if it doesn't exist):
```json
{
  "scripts": {
    "deploy-dead-tracker": "cd dead-tracker && npm install && npm run build && npm run deploy"
  }
}
```

3. Build and deploy:
```bash
cd dead-tracker
npm install
npm run build
npm run deploy
```

This will:
- Build the production version
- Deploy to GitHub Pages
- Make it available at `https://mattkrueger.org/dead-tracker`

### Alternative: Deploy as root

If you want it at `https://mattkrueger.org/` instead:

1. Change `base` in `vite.config.js` to `'/'`
2. Move all files from `dead-tracker/` to your repository root
3. Run `npm run build` and `npm run deploy`

## Connecting to Supabase (Production Setup)

When you're ready to connect to Supabase for permanent storage:

### Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up (free)
3. Create a new project:
   - Project name: `grateful-dead-tracker`
   - Database password: (save this!)
   - Region: Choose closest to you

### Step 2: Set Up Database

Run these SQL queries in the Supabase SQL Editor:

```sql
-- Create shows table
CREATE TABLE shows (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  venue TEXT,
  city TEXT,
  state TEXT,
  has_archive_recordings BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create listened_shows table
CREATE TABLE listened_shows (
  id SERIAL PRIMARY KEY,
  show_id TEXT NOT NULL,
  listened_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (show_id) REFERENCES shows(id)
);

-- Enable Row Level Security
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE listened_shows ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - single user)
CREATE POLICY "Enable all access for shows" ON shows FOR ALL USING (true);
CREATE POLICY "Enable all access for listened_shows" ON listened_shows FOR ALL USING (true);
```

### Step 3: Configure the App

1. Get your Supabase credentials:
   - Go to Project Settings → API
   - Copy the `Project URL` and `anon public` key

2. Install Supabase client:
```bash
npm install @supabase/supabase-js
```

3. Update `src/services/supabaseService.js`:
   - Add your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Change `USE_MOCK = false`

4. Import Supabase client at the top of the file:
```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### Step 4: Populate Show Data

I'll provide a separate script to:
1. Fetch all Grateful Dead shows from available sources
2. Check archive.org for recording availability
3. Upload to your Supabase database

## Data Sources

- Show dates and venues: Dead.net, Setlist.fm, DeadLists
- Archive availability: Internet Archive API
- Sample data included for development

## Future Features (V2)

- Setlist data for each show
- Song statistics ("You've heard 'I Know You Rider' 47 out of 589 times")
- Import from your existing notes
- Export backup
- Advanced statistics and charts

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Hosting:** GitHub Pages (frontend), Supabase (backend)
- **APIs:** Internet Archive

## Project Structure

```
dead-tracker/
├── src/
│   ├── components/
│   │   ├── Header.jsx      # Search, filters, progress
│   │   └── ShowList.jsx    # Show display and checkboxes
│   ├── data/
│   │   └── sampleData.js   # Sample show data
│   ├── services/
│   │   └── supabaseService.js  # Database operations
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Tailwind styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## License

Personal project for tracking Grateful Dead shows. Recordings hosted on Internet Archive.

## Credits

- Grateful Dead recordings from [Internet Archive](https://archive.org/details/GratefulDead)
- Show data from various Deadhead community sources
