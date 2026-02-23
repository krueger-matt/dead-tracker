#!/usr/bin/env node
/**
 * Import Dead & Company shows and setlists
 *
 * Usage: node scripts/import-dead-and-co.mjs
 *
 * This script:
 * 1. Parses dead_and_co_list.txt to get show dates, venues, and URLs
 * 2. Scrapes setlist data from setlist.fm and otherones.net
 * 3. Generates SQL INSERT statements for shows, songs, and setlists
 * 4. Outputs to data/dead-and-co-import.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const LIST_FILE = path.join(ROOT_DIR, 'dead_and_co_list.txt');
const OUTPUT_FILE = path.join(ROOT_DIR, 'data', 'dead-and-co-import.sql');

// Parse the list file
function parseListFile() {
  const content = fs.readFileSync(LIST_FILE, 'utf-8');
  const lines = content.split('\n');

  const shows = [];
  let currentShow = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match show entry: #123  June 15, 2018   [CONFIRMED] or [BROWSE]
    const showMatch = line.match(/^#(\d+)\s+(.+?)\s+\[(CONFIRMED|BROWSE)\]$/);
    if (showMatch) {
      if (currentShow) {
        shows.push(currentShow);
      }

      const showNumber = parseInt(showMatch[1]);
      const dateStr = showMatch[2].trim();
      const status = showMatch[3];

      // Parse date (format: "October 29, 2015" or "June 1, 2018")
      const date = new Date(dateStr);
      const formattedDate = date.toISOString().split('T')[0];

      currentShow = {
        number: showNumber,
        date: formattedDate,
        dateStr: dateStr,
        status: status,
        venue: null,
        url: null
      };
      continue;
    }

    // Match venue line (should be right after show entry)
    if (currentShow && !currentShow.venue && line.length > 0 && !line.startsWith('http') && !line.startsWith('=')) {
      currentShow.venue = line;
      continue;
    }

    // Match URL line
    if (currentShow && !currentShow.url && line.startsWith('http')) {
      currentShow.url = line;
    }
  }

  // Add the last show
  if (currentShow) {
    shows.push(currentShow);
  }

  return shows;
}

// Generate show ID from date (format: dc2015-10-29)
function generateShowId(date) {
  return `dc${date}`;
}

// Parse venue to extract city and state
function parseVenue(venueStr) {
  // Format: "Madison Square Garden, New York, NY"
  const parts = venueStr.split(',').map(s => s.trim());

  if (parts.length >= 3) {
    return {
      venue: parts.slice(0, -2).join(', '),
      city: parts[parts.length - 2],
      state: parts[parts.length - 1]
    };
  } else if (parts.length === 2) {
    return {
      venue: parts[0],
      city: parts[1],
      state: ''
    };
  } else {
    return {
      venue: venueStr,
      city: '',
      state: ''
    };
  }
}

// Escape single quotes for SQL
function sqlEscape(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Generate SQL for shows
function generateShowsSQL(shows) {
  const statements = [];

  statements.push('-- Dead & Company Shows\n');
  statements.push('INSERT INTO shows (id, date, venue, city, state, band, has_archive_recordings) VALUES');

  const values = shows.map(show => {
    const { venue, city, state } = parseVenue(show.venue);
    const showId = generateShowId(show.date);

    return `  ('${showId}', '${show.date}', '${sqlEscape(venue)}', '${sqlEscape(city)}', '${sqlEscape(state)}', 'Dead & Company', true)`;
  });

  statements.push(values.join(',\n'));
  statements.push('ON CONFLICT (id) DO NOTHING;\n');

  return statements.join('\n');
}

// Main function
async function main() {
  console.log('Parsing Dead & Company list file...');
  const shows = parseListFile();

  console.log(`Found ${shows.length} shows`);
  console.log('Sample shows:', shows.slice(0, 3));

  console.log('\nGenerating SQL...');
  const sql = generateShowsSQL(shows);

  // Ensure data directory exists
  const dataDir = path.join(ROOT_DIR, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Write SQL file
  fs.writeFileSync(OUTPUT_FILE, sql);
  console.log(`\nSQL written to ${OUTPUT_FILE}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review the SQL file`);
  console.log(`2. Run the SQL against your Supabase database`);
  console.log(`3. (Optional) Run setlist scraper to fetch setlist data`);
}

main().catch(console.error);
