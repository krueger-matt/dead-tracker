# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dead Tracker is a personal web app for tracking Grateful Dead and related band show listening progress. Currently includes Grateful Dead (2,269 shows, 1965-1995) and Dead & Company (30 shows, 2024 Sphere residency). Users can mark shows as listened, add notes, search/filter, switch between bands, and link out to archive.org recordings.

## Commands

- `npm run dev` — Start dev server (http://localhost:5173)
- `npm run build` — Production build (outputs to `dist/`)
- `npm run preview` — Preview production build
- `npm run deploy` — Build and deploy to GitHub Pages via gh-pages

No test runner or linter is configured.

## Architecture

**Stack:** React 18 + Vite + Tailwind CSS + Supabase (PostgreSQL)

**Routing:** React Router v7 with `basename="/dead-tracker/"` (GitHub Pages deployment path). Routes: `/` (Home), `/browse` (Browse), `/show/:showId` (ShowDetail), `/advanced-search` (AdvancedSearch).

**Data flow:** `App.jsx` is the top-level state owner. It fetches all shows from Supabase on mount, manages band selection state, and filters shows by selected band before passing them down as props. Show data (listened/notes) is stored in Supabase `user_show_data` table and managed via `src/services/supabaseService.js`.

**Supabase:** Client initialized in `src/services/supabaseService.js` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars (in `.env`). Main tables: `shows` (show catalog with `band` column), `user_show_data` (user listening progress), `songs`, and `setlists`. Schema in `supabase-setup.sql`. Shows are paginated in 1000-row chunks due to Supabase row limits.

**Multi-band support:** The `shows` table has a `band` column (defaults to 'Grateful Dead'). Show IDs use a prefix convention: `gd` for Grateful Dead, `dc` for Dead & Company. App.jsx maintains `selectedBand` state and filters shows before passing to child components. Band selector appears on Home and Browse pages.

**Static data:** `src/data/allShows.js` contains a local copy of all shows (used as fallback/reference). SQL dumps for bulk import are in `data/`.

**Scripts:** `scripts/` contains Node.js utilities for data import/scraping (`.cjs` for CommonJS, `.mjs` for ESM). These are standalone CLI scripts, not part of the app build.

## Key Conventions

- Component files use `.jsx` extension
- Pages in `src/pages/`, shared components in `src/components/`
- Supabase field names use snake_case; JS objects use camelCase (mapping happens in `supabaseService.js`)
- Single-user app — no auth system, no multi-user considerations
- Archive.org links use format: `https://archive.org/details/GratefulDead?query=date:YYYY-MM-DD`
