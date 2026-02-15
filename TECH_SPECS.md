# Technical Specifications: Grateful Dead Show Tracker

## Project Overview

**Project Name:** Grateful Dead Show Tracker  
**Purpose:** A web application to browse all Grateful Dead shows with links to archive.org and track which shows have been listened to  
**Primary User:** Solo user (personal project)  
**Current Solution:** iPhone notes document  

---

## Core Requirements

### Must Have (MVP)
- [ ] Display complete list of ALL Grateful Dead shows with dates
- [ ] Show which shows have recordings on archive.org (visual indicator)
- [ ] Link to archive.org search page (shows all recording options for that date)
- [ ] Only shows WITH archive recordings get clickable links
- [ ] Checkbox/toggle to mark shows as "listened"
- [ ] Database backend (SQLite/Supabase/PocketBase) - no data loss
- [ ] Mobile-friendly interface (primary use case: iPhone)
- [ ] Search/filter shows by year or date
- [ ] Visual indicator of listening progress (e.g., "125/2,300 shows listened")

### Nice to Have (Future Enhancements - V2)
- [ ] **Setlist data integration** - add song information for each show
- [ ] **Song statistics** - "You've heard 'I Know You Rider' 47 times out of 589 performances"
- [ ] Song-level tracking (mark favorite versions)
- [ ] Sort by date, venue, or era
- [ ] Filter by venue location
- [ ] Notes field for favorite shows or comments
- [ ] Import existing listened shows from your iPhone notes
- [ ] Export/backup your listening history
- [ ] Statistics dashboard (shows per year, listening streaks, most-heard songs)
- [ ] Dark mode
- [ ] Filter by "shows with archive recordings" vs "all shows"

### Out of Scope (Not Needed)
- Multi-user support or accounts (single user only)
- Social features or sharing
- Audio playback within the site (archive.org handles this)
- Setlist information on V1 (database designed to add this later)

---

## Technical Architecture

### Frontend
**Recommendation:** Single-page React application

**Why:**
- Interactive UI with state management (checkboxes)
- Great mobile experience
- Easy to deploy as static site
- No backend server needed initially

**Technology Stack:**
- React 18+ with hooks
- Tailwind CSS for styling (mobile-first)
- LocalStorage for persistence (client-side only)
- Deploy to: Netlify, Vercel, or GitHub Pages (all free)

### Data Source
**Grateful Dead Show Data:**

**Show Dates & Venue Information:**
- **DeadLists.com** - Comprehensive list of all ~2,300 shows with dates and venues
- **Setlist.fm API** - Has GD show data with venue info
- **Archive.org API** - Can query to see which shows have recordings

**Archive.org Availability Check:**
- Use Internet Archive API to verify which shows have recordings
- Query: `https://archive.org/advancedsearch.php?q=collection:GratefulDead+AND+date:YYYY-MM-DD`
- If results > 0, show has archive recordings
- Store this as boolean flag in database

**Collection Page Links:**
- Format: `https://archive.org/details/GratefulDead?query=date:YYYY-MM-DD`
- Shows ALL available recordings for that date
- User can browse different sources/quality

**For V2 - Setlist Data:**
- **Setlist.fm API** - Song-level data for most shows
- **HeadyVersion.com** - Community-curated setlists
- Store in `setlists` table for future "I Know You Rider" count feature

**Implementation Approach:**
1. Get complete show list from DeadLists or Setlist.fm
2. Run archive.org availability check for each show
3. Store in database with `has_archive_recordings` flag
4. Frontend only creates links for shows where flag = true

### Data Storage
**User Progress (Listened Shows):**

**Backend Database Required** (to prevent data loss)

**Option 1: SQLite + Simple Backend (Recommended)**
- SQLite database file
- Lightweight Node.js/Python backend (Express/FastAPI)
- Host on free tier: Railway, Fly.io, or Render
- Pros: Simple, portable, no vendor lock-in, backup-friendly
- Cons: Requires small server (but free tier sufficient)

**Option 2: Supabase (PostgreSQL)**
- Free PostgreSQL database with built-in auth
- Generous free tier (500MB, 50,000 rows)
- REST API auto-generated
- Pros: Managed, scalable, real-time sync
- Cons: Slight vendor lock-in

**Option 3: PocketBase**
- SQLite with built-in admin UI and API
- Single binary deployment
- Open source, can self-host or use PocketHost (free tier)
- Pros: All-in-one solution, great developer experience
- Cons: Newer project

**Recommendation:** PocketBase or Supabase for easiest setup with reliability

---

## Data Model

### Database Schema

**shows table**
```sql
CREATE TABLE shows (
  id TEXT PRIMARY KEY,           -- e.g., "gd1977-05-08"
  date DATE NOT NULL,
  venue TEXT,
  city TEXT,
  state TEXT,
  archive_identifier TEXT,       -- e.g., "gd1977-05-08" (archive.org collection ID)
  has_archive_recordings BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**listened_shows table**
```sql
CREATE TABLE listened_shows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  show_id TEXT NOT NULL,
  listened_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (show_id) REFERENCES shows(id)
);
```

**setlists table** (future - v2)
```sql
CREATE TABLE setlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  show_id TEXT NOT NULL,
  set_number INTEGER,            -- 1, 2, 3 for set 1, 2, encore
  position INTEGER,              -- song order within set
  song_name TEXT NOT NULL,
  segue BOOLEAN DEFAULT false,   -- true if > into next song
  FOREIGN KEY (show_id) REFERENCES shows(id)
);
```

### Archive.org Integration

**Archive Collection Page URL:**
- Each show has a collection identifier (e.g., `GratefulDead`)
- Search URL format: `https://archive.org/details/GratefulDead?query=date:1977-05-08`
- This shows ALL recordings available for that date
- User can choose which recording quality/source they prefer

**Show Object (API Response):**
```json
{
  "id": "gd1977-05-08",
  "date": "1977-05-08",
  "venue": "Barton Hall, Cornell University",
  "city": "Ithaca",
  "state": "NY",
  "archiveCollectionUrl": "https://archive.org/details/GratefulDead?query=date:1977-05-08",
  "hasArchiveRecordings": true,
  "listened": false
}
```

---

## User Interface Design

### Key Screens

**1. Main Show List**
- Scrollable list of all shows (ALL shows, not just ones on archive)
- Each row: Date | Venue | Archive Status | Checkbox | Link icon
- **Archive Status Indicator:**
  - 🎵 icon or badge if recordings exist on archive.org
  - Gray/dimmed if no archive recordings available
  - Only shows WITH archive recordings are clickable
- Link opens archive.org collection search (shows all recording options)
- Search bar at top
- Progress indicator (e.g., "125/589 shows with recordings listened")
- Filter options: Year dropdown, decade buttons, "has archive" toggle

**Example Row Layouts:**
```
✓ 1977-05-08  Barton Hall, Cornell  🎵  [Listen on Archive →]
  1977-05-09  Buffalo Memorial      (no recordings)
✓ 1977-05-11  St. Paul Civic Center 🎵  [Listen on Archive →]
```

**2. Individual Show (optional expanded view)**
- Show details
- Direct link to archive.org collection search
- Checkbox to mark listened
- Notes field (future)
- Setlist display (V2 - future)

### Mobile-First Design Priorities
- Large touch targets for checkboxes
- Fast scrolling/virtualization for 2,000+ shows
- Sticky header with search and progress
- Clear visual distinction between shows with/without archive recordings
- Bottom navigation if adding multiple views

---

## Technical Implementation Plan

### Phase 1: MVP - Core Functionality (Week 1-2)

**Backend Setup:**
1. Choose database solution (recommend PocketBase or Supabase)
2. Set up database schema (shows, listened_shows tables)
3. Create simple API endpoints:
   - GET /shows (with filters, pagination)
   - POST /listened/:showId (mark as listened)
   - DELETE /listened/:showId (unmark)
   - GET /stats (progress counter)

**Data Population:**
1. Scrape/gather complete Grateful Dead show list (~2,300 shows)
2. Run archive.org availability check for each show
3. Populate database with show data and archive flags
4. Create data import script for future updates

**Frontend:**
1. Set up React project with Vite
2. Build show list component with virtualization (for performance)
3. Implement checkbox functionality with API integration
4. Add search/filter by year
5. Show archive availability indicator
6. Create clickable links to archive.org (only for available shows)
7. Style for mobile-first (Tailwind)
8. Deploy frontend to Netlify/Vercel

**Deliverable:** Working tracker with all shows, archive links, and persistent checkbox state

### Phase 2: Enhanced Filtering & Stats (Week 3)
1. Add more filter options (decade, venue, archive availability)
2. Improve search (fuzzy matching, venue search)
3. Enhanced statistics dashboard
4. Import tool for your existing listened shows
5. Export/backup functionality

### Phase 3: Setlist Integration (Future - V2)
1. Add `setlists` table to database
2. Gather setlist data from Setlist.fm or HeadyVersion
3. Populate setlist database
4. Build song statistics feature:
   - "I Know You Rider: heard 47/589 times"
   - Song frequency charts
   - Favorite versions tracking
5. Show setlists on individual show pages

---

## Future Feature: Song Statistics (V2)

### Use Case
"How many times have I heard 'I Know You Rider' out of all possible performances?"

### Implementation Approach

**Data Requirements:**
- Setlist data for all shows (song names, set positions)
- Your listened show history

**Database Query Example:**
```sql
-- Total times "I Know You Rider" was performed
SELECT COUNT(*) as total_performances
FROM setlists
WHERE song_name = 'I Know You Rider';

-- Times you've heard it
SELECT COUNT(*) as times_heard
FROM setlists s
JOIN listened_shows l ON s.show_id = l.show_id
WHERE s.song_name = 'I Know You Rider';
```

**UI Components:**
- Song search/browse interface
- Song detail page showing:
  - "You've heard this X/Y times"
  - List of shows where you heard it
  - List of shows where it was played (that you haven't heard)
  - Timeline/chart of performances over the years
- Top 10 most-heard songs
- "Rare finds" - songs you've only heard once or twice

**Cool Statistics:**
- Most-heard song
- Rarest song you've heard
- Song completion percentage
- Era-based statistics (60s, 70s, 80s, 90s)
- Opener/closer frequency

This feature requires setlist database population but the schema is already designed to support it.

---

## Open Questions

**Need Your Input:**

1. ✅ **Database Backend:** Confirmed - using SQLite/PocketBase/Supabase for reliability
   - **Decision needed:** PocketBase (easiest, self-contained) vs Supabase (more features, managed)?

2. ✅ **Setlists:** Not for V1, but database designed to add later for song statistics

3. ✅ **Archive Links:** Link to collection search page showing all recordings

4. **Current Progress:** 
   - How many shows have you listened to so far? 
   - Can you share your iPhone notes list? (I can create an import script)

5. **All Shows vs Archive Only:**
   - You want ALL ~2,300 shows listed
   - Shows without archive recordings are visible but grayed/not clickable
   - Confirm this approach?

6. **Authentication:**
   - Since this is single-user with a database, do you want:
     - Simple password protection?
     - No auth (just keep URL private)?
     - More robust auth system?

7. **Hosting Budget:**
   - Free tier is fine? (PocketBase/Supabase both have generous free tiers)
   - Or willing to pay $5-10/month for guaranteed reliability?

---

## Next Steps

- [ ] Review these specs and answer open questions
- [ ] I can build a working prototype for you
- [ ] Find/prepare the Grateful Dead show dataset
- [ ] Set up the project structure
- [ ] Deploy first version

---

## Estimated Effort

**For you to build yourself:**
- MVP (basic functionality): 8-12 hours
- With enhancements: 15-20 hours

**If I help you build it:**
- I can create a working prototype in this conversation
- You'd just need to deploy it

Would you like me to start building this for you?
