# Dead Tracker

A web application to track your Grateful Dead show listening journey. Rate shows, add notes, and explore the complete catalog of performances from 1965-1995.

## Features

- Rate shows (1-5 stars)
- Add personal notes for each show
- Search by venue, city, or date
- Filter by year
- Direct links to archive.org recordings (when available)
- Track your listening progress

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Development

Built with:
- React + Vite
- Tailwind CSS
- Local storage for data persistence

## Data

Contains 2,269 Grateful Dead shows from 1965-1995, with 1,945 shows having archive.org recordings available.

Archive availability was automatically checked against archive.org's API for accurate recording links.

## Future Plans

- Supabase integration for cloud storage
- Setlist tracking and song-level statistics
- Side project shows (Jerry Garcia Band, Phil & Friends, etc.)
- Advanced search (find specific song combinations, segues, etc.)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

See `scripts/README.md` for data import utilities.
