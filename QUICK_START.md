# 🎵 Grateful Dead Show Tracker - Quick Start

Your app is ready! Here's everything you need to get started.

## What You've Got

✅ **Complete React app** - Fully functional show tracker  
✅ **Sample data** - 18 shows to test with  
✅ **Mobile-friendly** - Works great on iPhone  
✅ **Search & filters** - Find shows by year, venue, or date  
✅ **Progress tracking** - See how many shows you've listened to  
✅ **Archive.org links** - Direct links to recordings  
✅ **Ready for GitHub Pages** - Deploy to mattkrueger.org  
✅ **Supabase-ready** - Set up database when you're ready  

## Try It Right Now (5 minutes)

1. **Download the project** (you already have it!)

2. **Open terminal and navigate to the folder:**
```bash
cd dead-tracker
```

3. **Install dependencies:**
```bash
npm install
```

4. **Start the app:**
```bash
npm run dev
```

5. **Open your browser** to `http://localhost:5173`

That's it! You should see the app with 18 sample shows. Try:
- ✅ Checking boxes to mark shows as listened
- 🔍 Searching for "Cornell" or "1977"
- 📅 Filtering by year
- 🎵 Clicking "Listen →" to go to archive.org

## What's Next?

### Immediate (Do This Week)
1. ✅ Test the app locally (you just did this!)
2. 📤 **Deploy to mattkrueger.org** → Follow `DEPLOYMENT.md`
3. 🎵 Use it! The sample data works great for testing

### When You're Ready for Full Features (Do This Month)
4. 🗄️ **Set up Supabase** → Follow `SUPABASE_SETUP.md` (15 minutes)
5. 📊 **Load all 2,300+ shows** → I'll create a data import script
6. ☁️ **Cloud sync** → Your progress will save permanently

## Current State

**What Works Now:**
- ✅ All features working with sample data
- ✅ Progress saves in your browser
- ✅ Search, filter, track shows
- ✅ Links to archive.org

**What Needs Supabase:**
- 📊 All 2,300+ shows (currently only 18)
- ☁️ Cloud sync across devices
- 💾 Permanent storage (currently browser-only)

## File Overview

```
dead-tracker/
├── 📄 README.md              ← Project overview
├── 📄 DEPLOYMENT.md          ← How to deploy to GitHub Pages
├── 📄 SUPABASE_SETUP.md      ← How to set up database
├── 📄 QUICK_START.md         ← You are here!
│
├── src/
│   ├── components/
│   │   ├── Header.jsx        ← Search, filters, progress bar
│   │   └── ShowList.jsx      ← Show list with checkboxes
│   │
│   ├── data/
│   │   └── sampleData.js     ← 18 sample shows
│   │
│   ├── services/
│   │   └── supabaseService.js ← Database connection
│   │
│   └── App.jsx               ← Main app
│
└── package.json              ← Dependencies
```

## Frequently Asked Questions

### Q: Is my progress saved?
**A:** Yes! In browser storage for now. After Supabase setup, it saves to the cloud.

### Q: Will this work on my iPhone?
**A:** Yes! It's designed mobile-first. Works great on iOS.

### Q: Can I use this before setting up Supabase?
**A:** Absolutely! The app is fully functional with sample data. Set up Supabase when you're ready for all shows + cloud sync.

### Q: How long does Supabase setup take?
**A:** About 15-20 minutes following the guide.

### Q: Is Supabase really free?
**A:** Yes! Free tier is more than enough for this project. See `SUPABASE_SETUP.md` for details.

### Q: What if I want to import my existing listened shows?
**A:** I can create an import tool once you have Supabase set up. Just share your list!

## Getting Help

**Check these files:**
- `README.md` - Full project documentation
- `DEPLOYMENT.md` - Deploy to GitHub Pages
- `SUPABASE_SETUP.md` - Database setup guide

**Common issues:**
- "npm not found" → Install Node.js from nodejs.org
- "Module not found" → Run `npm install`
- Blank page after deploy → Check `vite.config.js` base path

## Your Roadmap

### Week 1: Local Testing ✅
- [x] Run app locally
- [ ] Test all features
- [ ] Try on iPhone

### Week 2: Deploy
- [ ] Deploy to mattkrueger.org/dead-tracker
- [ ] Share link with friends

### Week 3: Database
- [ ] Set up Supabase account
- [ ] Connect to database
- [ ] Load full show data

### Week 4: Use It!
- [ ] Start tracking shows
- [ ] Build your listening history

### Future (V2):
- [ ] Setlist data
- [ ] Song statistics
- [ ] "I've heard I Know You Rider 47 times!"

## That's It!

You've got everything you need. Start with local testing, deploy when ready, add Supabase when you want the full feature set.

Have fun tracking your Dead shows! 🌹💀⚡

---

**Next Step:** Open terminal, run `npm install && npm run dev`, and start checking boxes!
