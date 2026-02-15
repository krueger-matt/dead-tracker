# Getting All 2,300+ Grateful Dead Shows

## Current Status

You have sample data (18 shows) in your app. To get all ~2,300 shows, here are your options:

## 🎯 Recommended: I'll Generate It For You

**Easiest option:** I'll create a complete SQL file with all shows for you to import.

### What I'll do:
1. Use Setlist.fm data (2,332 shows)
2. Mark which ones have archive.org recordings
3. Give you a ready-to-import SQL file

### You just:
1. Copy/paste the SQL into Supabase
2. Done!

**Time:** 2 minutes for you

---

## Alternative: DIY with Setlist.fm API

If you want to run the script yourself:

### Steps:
1. Get free API key from https://www.setlist.fm/settings/api
2. Run the Node.js script I'll create
3. Import the generated SQL

**Time:** 15-20 minutes

---

## My Recommendation

**Let me just generate the SQL file for you right now.**

I'll:
- Query the data sources
- Check archive availability
- Create the complete SQL file
- You just import it

**Want me to do this?** Just say yes and I'll create the file in the next few minutes!

## Note on Archive Availability

Checking all 2,300+ shows against archive.org would take ~4 hours due to rate limiting.

**Better approach:**
- Import all shows first (marks all as `has_archive_recordings = false`)
- Your app still works perfectly
- Later, we can run a background script to check archive availability
- Or, mark shows as "has archive" when users actually find recordings

This way you get the app working immediately with all shows, and we can add archive flags progressively.

---

**Next Step:** Tell me if you want me to generate the complete SQL file!
