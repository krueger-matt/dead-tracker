# Getting the Complete Grateful Dead Show List

## The Plan

Since Dead.net doesn't have a public API, here's the simplest approach to get all ~2,300 shows:

## Option 1: Use Setlist.fm API (Recommended - Easiest)

Setlist.fm has a free API with all Grateful Dead shows.

### Steps:

1. **Get API Key** (free):
   - Go to https://www.setlist.fm/settings/api
   - Sign up for an account
   - Get your API key

2. **Run the import script** (I'll create this for you):
   - Fetches all shows from Setlist.fm
   - Checks archive.org for each show
   - Generates SQL for Supabase

**I can build this script now** - it'll be much more reliable than web scraping.

## Option 2: Manual Export from Dead.net

If you want the official source:

1. Go to https://www.dead.net/shows
2. Browse by year
3. Copy/paste into a spreadsheet
4. Export as CSV
5. I'll create a script to convert CSV → SQL

## Option 3: Use Existing Community Dataset

There are several community-maintained datasets:

- **herbibot.com** - Has complete show list
- **GratefulStats.com** - Comprehensive database
- **setlist.fm** - API available (recommended)

## My Recommendation:

**Let me build a Setlist.fm API importer**

### Why this is best:
✅ Official API (not web scraping)  
✅ Has all shows with venue/location  
✅ Free to use  
✅ Includes setlists (for V2!)  
✅ Reliable and maintained  

### I'll create:
1. Node.js script that uses Setlist.fm API
2. Checks archive.org for each show
3. Outputs SQL file ready for Supabase
4. Takes ~10 minutes to run

**Want me to build this?**

Just say yes and I'll create the Setlist.fm importer script!

---

## Alternative: Pre-Generated Data

If you don't want to run scripts, I can also just generate a complete SQL file for you with all ~2,300 shows by querying the sources myself and giving you the ready-to-use file.

Let me know which you prefer!
