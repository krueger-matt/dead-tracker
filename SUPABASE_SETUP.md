# Supabase Setup Guide

This guide walks you through setting up Supabase for your Grateful Dead Show Tracker.

## Step 1: Create Supabase Account (5 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with:
   - GitHub (recommended - easiest)
   - Or email/password

4. Create a new organization (if prompted):
   - Organization name: Your name or "Personal"
   - Plan: Free

## Step 2: Create New Project (2 minutes)

1. Click "New Project"
2. Fill in:
   - **Name:** `grateful-dead-tracker`
   - **Database Password:** Create a strong password (SAVE THIS!)
   - **Region:** Choose the one closest to you (e.g., "US West" if you're in California)
   - **Pricing Plan:** Free

3. Click "Create new project"
4. Wait 2-3 minutes for provisioning (it will show a progress screen)

## Step 3: Set Up Database Tables (5 minutes)

1. Once your project is ready, click on the **SQL Editor** icon in the left sidebar (looks like `</>`)

2. Click "+ New Query"

3. Paste this SQL and click "Run":

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
  show_id TEXT NOT NULL REFERENCES shows(id),
  listened_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(show_id)
);

-- Create index for faster queries
CREATE INDEX idx_shows_date ON shows(date DESC);
CREATE INDEX idx_shows_has_archive ON shows(has_archive_recordings);
CREATE INDEX idx_listened_shows_show_id ON listened_shows(show_id);

-- Enable Row Level Security
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE listened_shows ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations - single user app)
CREATE POLICY "Enable all access for shows" 
  ON shows 
  FOR ALL 
  USING (true);

CREATE POLICY "Enable all access for listened_shows" 
  ON listened_shows 
  FOR ALL 
  USING (true);
```

4. You should see "Success. No rows returned" - that's perfect!

## Step 4: Get Your API Credentials (2 minutes)

1. Click on the **Settings** icon in the left sidebar (gear icon)
2. Click on **API** in the settings menu
3. You'll see two important values:

   **Project URL:** 
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **API Keys → anon public:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
   ```

4. **COPY BOTH OF THESE** - you'll need them in Step 5

## Step 5: Connect Your App to Supabase (5 minutes)

1. Open your project in your code editor

2. Install the Supabase client library:
```bash
cd dead-tracker
npm install @supabase/supabase-js
```

3. Open `src/services/supabaseService.js`

4. At the very top of the file, add this import:
```javascript
import { createClient } from '@supabase/supabase-js';
```

5. Replace the empty strings with your credentials:
```javascript
const SUPABASE_URL = 'https://xxxxxxxxxxxxx.supabase.co'; // Your Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Your anon public key
```

6. Create the Supabase client (add this after the credentials):
```javascript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

7. Change the mock mode flag:
```javascript
const USE_MOCK = false; // Changed from true to false
```

8. Update the real Supabase functions (replace the throw statements):

```javascript
const supabaseGetListenedShows = async () => {
  const { data, error } = await supabase
    .from('listened_shows')
    .select('show_id');
  
  if (error) {
    console.error('Error fetching listened shows:', error);
    return [];
  }
  
  return data.map(item => item.show_id);
};

const supabaseToggleListened = async (showId, isListened) => {
  if (isListened) {
    // Add to listened shows
    const { error } = await supabase
      .from('listened_shows')
      .insert({ show_id: showId });
    
    if (error) console.error('Error adding show:', error);
  } else {
    // Remove from listened shows
    const { error } = await supabase
      .from('listened_shows')
      .delete()
      .eq('show_id', showId);
    
    if (error) console.error('Error removing show:', error);
  }
  
  // Return updated list
  return await supabaseGetListenedShows();
};
```

9. Update App.jsx to make the functions async:

Open `src/App.jsx` and change the `handleToggleListened` function:

```javascript
// Change this:
const handleToggleListened = (showId) => {
  const newListened = toggleListened(showId);
  setListenedShows(newListened);
};

// To this:
const handleToggleListened = async (showId) => {
  const isCurrentlyListened = listenedShows.includes(showId);
  const newListened = await toggleListened(showId, !isCurrentlyListened);
  setListenedShows(newListened);
};
```

And change the useEffect to be async:

```javascript
// Change this:
useEffect(() => {
  const listened = getListenedShows();
  setListenedShows(listened);
}, []);

// To this:
useEffect(() => {
  const loadListened = async () => {
    const listened = await getListenedShows();
    setListenedShows(listened);
  };
  loadListened();
}, []);
```

## Step 6: Test the Connection (2 minutes)

1. Start your development server:
```bash
npm run dev
```

2. Open the app in your browser

3. The yellow "Development Mode" warning should be GONE

4. Try checking a box - it should work!

5. Go to Supabase → Table Editor → listened_shows
   - You should see your checked shows appear in the table!

6. Refresh your browser - the checks should persist!

## Step 7: Populate Show Data (Coming Next)

Now that Supabase is connected, you need to populate the `shows` table with all Grateful Dead shows. I'll create a separate script for this.

For now, you can manually add a few shows to test:

1. Go to Supabase → Table Editor → shows
2. Click "+ Insert row"
3. Add a show:
   - id: `gd1977-05-08`
   - date: `1977-05-08`
   - venue: `Barton Hall, Cornell University`
   - city: `Ithaca`
   - state: `NY`
   - has_archive_recordings: `true`

## Troubleshooting

### "Failed to fetch" error
- Check that your SUPABASE_URL and SUPABASE_ANON_KEY are correct
- Make sure you're using the "anon public" key, not the "service_role secret"

### Shows not appearing
- Check that you've populated the `shows` table
- Check the browser console for errors

### Checkboxes not persisting
- Check that RLS policies are enabled
- Check the `listened_shows` table in Supabase to see if data is being saved

### Free tier limits
- You have 500MB database space (plenty for ~2,300 shows)
- Projects pause after 7 days of inactivity (auto-resumes on visit)
- You get 2 free projects

## Next Steps

Once Supabase is connected:
1. ✅ Your progress will be saved permanently
2. ✅ Data syncs across all your devices
3. ✅ No risk of data loss
4. 📝 Next: Populate all show data (I'll create a script for this)

## Need Help?

- Check the [Supabase Documentation](https://supabase.com/docs)
- Look at the browser console for error messages
- Check the Supabase dashboard logs (Settings → Logs)
