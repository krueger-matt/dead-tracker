#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import * as cheerio from 'cheerio';

// Read the dates from the file
const dates = readFileSync('furthur_list.txt', 'utf-8')
  .trim()
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

console.log(`Will scrape ${dates.length} shows`);

const shows = [];
const allSongs = new Map(); // Use Map to deduplicate songs by ID
const allSetlists = [];

function generateShowId(date) {
  return `fu${date}`;
}

function generateSongId(songName) {
  return songName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function scrapeOtherOnesNet(date) {
  const url = `https://otherones.net/furthur/${date}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Error fetching ${url}: HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract the full setlist text
    const fullText = $('.setlist').text().trim();

    if (!fullText) {
      return null;
    }

    // First line contains: date, venue, city, state
    // Format: "7/4/2010 Oxford Fairgrounds, Oxford, ME"
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const firstLine = lines[0];

    // Extract venue and location from first line
    // Skip the date part and take the rest
    const withoutDate = firstLine.replace(/^\d+\/\d+\/\d+\s+/, '');

    // Split by comma to get venue and location
    const parts = withoutDate.split(',').map(p => p.trim());
    let venue = '';
    let city = '';
    let state = '';

    if (parts.length >= 2) {
      venue = parts[0];
      city = parts[1];
      if (parts.length >= 3) {
        state = parts[2];
      }
    } else if (parts.length === 1) {
      venue = parts[0];
    }

    // Find setlist lines (starting with "I:", "II:", "E:", etc.)
    const setlistLines = lines.filter(line => /^[IVE]+:/.test(line));
    const setlistText = setlistLines.join('\n');

    return {
      venue,
      city,
      state,
      setlist: setlistText
    };
  } catch (error) {
    console.error(`Error fetching ${url}: ${error.message}`);
    return null;
  }
}

function parseSetlist(setlistText, showId) {
  if (!setlistText) return [];

  const entries = [];
  const sets = setlistText.split(/\n/).filter(line => line.trim());

  // Track encore count for multiple encores
  let encoreCount = 0;

  for (const setLine of sets) {
    // Parse format like "I: song1, song2 > song3"
    const setMatch = setLine.match(/^([IVE]+):\s*(.+)$/);
    if (!setMatch) continue;

    const setIndicator = setMatch[1];
    const songsText = setMatch[2];

    // Determine set name
    let setName;
    if (setIndicator === 'E') {
      encoreCount++;
      setName = encoreCount === 1 ? 'Encore' : `Encore ${encoreCount}`;
    } else if (setIndicator === 'I') {
      setName = 'Set 1';
    } else if (setIndicator === 'II') {
      setName = 'Set 2';
    } else if (setIndicator === 'III') {
      setName = 'Set 3';
    } else if (setIndicator === 'IV') {
      setName = 'Set 4';
    } else {
      setName = `Set ${setIndicator.length}`;
    }

    // Split by comma to get individual songs/transitions
    const songParts = songsText.split(',').map(s => s.trim());

    let position = 1;
    for (const part of songParts) {
      // Check if this part contains a transition (>)
      const transitionParts = part.split('>').map(s => s.trim());

      for (let i = 0; i < transitionParts.length; i++) {
        const songName = transitionParts[i];
        if (!songName) continue;

        const songId = generateSongId(songName);
        const segue = i < transitionParts.length - 1; // True if not the last in transition chain

        // Store song
        if (!allSongs.has(songId)) {
          allSongs.set(songId, songName);
        }

        entries.push({
          showId,
          songId,
          setName,
          position,
          segue
        });

        position++;
      }
    }
  }

  return entries;
}

// Scrape all shows
for (const date of dates) {
  console.log(`Scraping ${date}...`);
  const data = await scrapeOtherOnesNet(date);

  if (data) {
    const showId = generateShowId(date);

    shows.push({
      id: showId,
      date,
      venue: data.venue,
      city: data.city,
      state: data.state
    });

    const setlistEntries = parseSetlist(data.setlist, showId);
    allSetlists.push(...setlistEntries);

    console.log(`  Found ${setlistEntries.length} songs`);
  } else {
    console.log(`  No data found`);
  }

  // Small delay to be nice to the server
  await new Promise(resolve => setTimeout(resolve, 100));
}

console.log(`\nTotal shows scraped: ${shows.length}`);
console.log(`Total songs scraped: ${allSetlists.length}`);
console.log(`Unique songs: ${allSongs.size}`);

// Generate SQL for shows
let showsSql = '';
for (const show of shows) {
  const venue = show.venue.replace(/'/g, "''");
  const city = show.city.replace(/'/g, "''");
  const state = show.state.replace(/'/g, "''");

  showsSql += `INSERT INTO shows (id, date, venue, city, state, band, has_archive_recordings)
VALUES ('${show.id}', '${show.date}', '${venue}', '${city}', '${state}', 'Furthur', true);\n`;
}

// Generate SQL for songs
let songsSql = '';
for (const [songId, songName] of allSongs.entries()) {
  const name = songName.replace(/'/g, "''");
  songsSql += `INSERT INTO songs (id, name) VALUES ('${songId}', '${name}') ON CONFLICT (id) DO NOTHING;\n`;
}

// Generate SQL for setlists
let setlistsSql = '';
for (const entry of allSetlists) {
  setlistsSql += `INSERT INTO setlists (show_id, set_name, position, song_id, segue)
VALUES ('${entry.showId}', '${entry.setName}', ${entry.position}, '${entry.songId}', ${entry.segue});\n`;
}

// Write SQL files
console.log('\nGenerating SQL...');
writeFileSync('data/furthur-shows.sql', showsSql);
writeFileSync('data/furthur-setlists.sql', songsSql + '\n' + setlistsSql);
console.log('SQL written to data/furthur-shows.sql and data/furthur-setlists.sql');
