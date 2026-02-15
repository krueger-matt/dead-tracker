# Data Import Scripts

## Quick Start: Get All 2,300+ Shows

### Run the Dead.net Scraper

This will scrape ALL Grateful Dead shows directly from dead.net.

**Steps:**

1. **Run the scraper:**
   ```bash
   cd scripts
   node scrape-dead-net.js
   ```

2. **Wait ~15 minutes:**
   - The script scrapes all years (1965-1995)
   - Politely waits between requests
   - Shows progress as it goes

3. **Import to Supabase:**
   ```bash
   # The script creates: data/grateful-dead-shows-complete.sql
   # Copy/paste that SQL into Supabase SQL Editor and run it
   ```

**Time:** ~15 minutes to scrape, gets you all shows from dead.net!

### What It Does:

✅ Scrapes dead.net for all show dates  
✅ Extracts venue, city, state information  
✅ Applies the 1976+ archive rule automatically  
✅ Generates SQL ready for Supabase import  

---

## Archive Availability Rule

**Important insight:** All Grateful Dead shows from **1976 onward** have recordings on archive.org!

The script uses this rule:
- Shows from **1965-1975**: `has_archive_recordings = false`
- Shows from **1976-1995**: `has_archive_recordings = true`

This means ~1,800 of the 2,300 shows are automatically marked as having recordings!

---

## What You Get

After running the scraper:

✅ All ~2,300 Grateful Dead shows from dead.net  
✅ Dates, venues, cities, states  
✅ Archive availability (1976+ = true)  
✅ Ready-to-import SQL file  

---

## Troubleshooting

**"Website structure may have changed"**
- Dead.net might have updated their HTML
- You can manually adjust the parsing logic in the script
- Or use the Setlist.fm API method instead

**"No shows found"**
- Check your internet connection
- Make sure dead.net is accessible
- The script might need updating if their site changed

---

## Files Generated

- `data/grateful-dead-shows-complete.sql` - Import this into Supabase
- `data/grateful-dead-shows-complete.json` - Backup/reference

---

## After Import

Once you've imported the data:

1. Update `src/App.jsx` to fetch from Supabase instead of sample data
2. Remove the sample data file
3. Your app now has all 2,300+ shows!

See the main README.md for instructions on connecting to Supabase.
