#!/usr/bin/env node
/**
 * Scrape Dead & Company setlists
 *
 * Usage: node scripts/scrape-setlists.mjs [--limit N]
 *
 * This script:
 * 1. Parses dead_and_co_list.txt to get show URLs
 * 2. Scrapes setlist data from setlist.fm and otherones.net
 * 3. Generates SQL INSERT statements for songs and setlists
 * 4. Outputs to data/dead-and-co-setlists.sql
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const LIST_FILE = path.join(ROOT_DIR, 'dead_and_co_list.txt');
const OUTPUT_FILE = path.join(ROOT_DIR, 'data', 'dead-and-co-setlists.sql');

// Delay between requests (milliseconds)
const DELAY_MS = 1000;

// Parse command line args
const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const LIMIT = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;

// Sleep helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Parse the list file
function parseListFile() {
  const content = fs.readFileSync(LIST_FILE, 'utf-8');
  const lines = content.split('\n');

  const shows = [];
  let currentShow = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const showMatch = line.match(/^#(\d+)\s+(.+?)\s+\[(CONFIRMED|BROWSE)\]$/);
    if (showMatch) {
      if (currentShow) {
        shows.push(currentShow);
      }

      const showNumber = parseInt(showMatch[1]);
      const dateStr = showMatch[2].trim();
      const status = showMatch[3];
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

    if (currentShow && !currentShow.venue && line.length > 0 && !line.startsWith('http') && !line.startsWith('=')) {
      currentShow.venue = line;
      continue;
    }

    if (currentShow && !currentShow.url && line.startsWith('http')) {
      currentShow.url = line;
    }
  }

  if (currentShow) {
    shows.push(currentShow);
  }

  return shows;
}

// Generate show ID
function generateShowId(date) {
  return `dc${date}`;
}

// Fetch HTML from URL
async function fetchHTML(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

// Common Grateful Dead/Dead & Company segues
const COMMON_SEGUES = [
  ['Scarlet Begonias', 'Fire on the Mountain'],
  ['China Cat Sunflower', 'I Know You Rider'],
  ['Help on the Way', 'Slipknot!'],
  ['Slipknot!', 'Franklin\'s Tower'],
  ['Lost Sailor', 'Saint of Circumstance'],
  ['Terrapin Station', 'Terrapin'],
  ['Playing in the Band', 'Uncle John\'s Band'],
  ['The Other One', 'The Other One Jam'],
  ['Dark Star', 'Dark Star Jam']
];

// Check if two songs commonly segue
function isCommonSegue(song1, song2) {
  return COMMON_SEGUES.some(([first, second]) =>
    song1.includes(first) && song2.includes(second)
  );
}

// Scrape setlist from setlist.fm
function scrapeSetlistFM(html, showId) {
  const $ = cheerio.load(html);
  const songs = [];
  let setNumber = 1;
  let songOrder = 1;
  let setName = 'Set 1';

  // Parse HTML structure to get proper set divisions
  $('.setlistParts').each((i, el) => {
    const $el = $(el);

    // Check if this is a set/encore marker
    if ($el.hasClass('section') || $el.hasClass('encore')) {
      const label = $el.find('span').text().trim();

      if (label.includes('Set 1')) {
        setNumber = 1;
        setName = 'Set 1';
      } else if (label.includes('Set 2')) {
        setNumber = 2;
        setName = 'Set 2';
      } else if (label.includes('Set 3')) {
        setNumber = 3;
        setName = 'Set 3';
      } else if (label.includes('Encore')) {
        setNumber = 3;
        setName = 'Encore';
      }
      return; // Skip to next element
    }

    // Check if this is a song
    if ($el.hasClass('song')) {
      const songName = $el.find('.songLabel').first().text().trim();

      if (songName) {
        songs.push({
          showId,
          songName,
          setNumber,
          setName,
          order: songOrder++,
          transition: false
        });
      }
    }
  });

  // Add transitions for common segues
  for (let i = 0; i < songs.length - 1; i++) {
    if (isCommonSegue(songs[i].songName, songs[i + 1].songName)) {
      songs[i].transition = true;
    }
  }

  return songs;
}

// Scrape setlist from otherones.net
function scrapeOtherOnesNet(html, showId) {
  const $ = cheerio.load(html);
  const songs = [];
  let songOrder = 1;

  // otherones.net format: "I: Song, Song > Song" for Set 1, "II:" for Set 2, "E:" for Encore
  $('.setlist .row').each((i, rowEl) => {
    const text = $(rowEl).text().trim();

    // Parse set indicators
    let setNumber = 1;
    let setName = 'Set 1';
    let setlistText = text;

    if (text.startsWith('I:')) {
      setNumber = 1;
      setName = 'Set 1';
      setlistText = text.substring(2).trim();
    } else if (text.startsWith('II:')) {
      setNumber = 2;
      setName = 'Set 2';
      setlistText = text.substring(3).trim();
    } else if (text.startsWith('E:')) {
      setNumber = 3;
      setName = 'Encore';
      setlistText = text.substring(2).trim();
    } else {
      return; // Skip non-setlist rows
    }

    // Split by either comma or ">" (transition marker)
    // First replace " > " with a marker, then split by comma
    const parts = setlistText.split(/\s*(?:,|>)\s*/);

    for (const songName of parts) {
      const trimmed = songName.trim();
      if (trimmed) {
        // Check if previous part ended with ">"
        const hasTransition = setlistText.includes(`${trimmed} >`);

        songs.push({
          showId,
          songName: trimmed,
          setNumber,
          setName,
          order: songOrder++,
          transition: hasTransition
        });
      }
    }
  });

  return songs;
}

// Scrape setlist from URL
async function scrapeSetlist(show) {
  console.log(`Scraping ${show.date}...`);

  // Always use otherones.net for better transition data
  const otheroneslUrl = `https://otherones.net/dead-and-company/${show.date}`;

  const html = await fetchHTML(otheroneslUrl);
  if (!html) {
    return [];
  }

  const showId = generateShowId(show.date);
  return scrapeOtherOnesNet(html, showId);
}

// Escape SQL strings
function sqlEscape(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Generate song slug ID from song name
function generateSongId(songName) {
  return songName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Generate SQL for songs and setlists
function generateSQL(allSongs) {
  const statements = [];

  // Get unique song names and deduplicate by ID
  const uniqueSongs = [...new Set(allSongs.map(s => s.songName))];

  // Create a map of id -> name to handle cases where different names generate same ID
  const songMap = new Map();
  uniqueSongs.forEach(name => {
    const id = generateSongId(name);
    // Keep the first name we encounter for each ID
    if (!songMap.has(id)) {
      songMap.set(id, name);
    }
  });

  // Generate songs INSERT with slug IDs
  statements.push('-- Dead & Company Songs\n');
  statements.push('INSERT INTO songs (id, name) VALUES');

  const songValues = Array.from(songMap.entries()).map(([id, name]) => {
    return `  ('${id}', '${sqlEscape(name)}')`;
  });
  statements.push(songValues.join(',\n'));
  statements.push('ON CONFLICT (id) DO NOTHING;\n\n');

  // Generate setlists INSERT
  statements.push('-- Dead & Company Setlists\n');
  statements.push('INSERT INTO setlists (show_id, song_id, set_name, position, segue) VALUES');

  const setlistValues = allSongs.map(song => {
    const songId = generateSongId(song.songName);
    return `  ('${song.showId}', '${songId}', '${song.setName}', ${song.order}, ${song.transition})`;
  });

  statements.push(setlistValues.join(',\n'));
  statements.push(';\n');

  return statements.join('\n');
}

// Main function
async function main() {
  console.log('Parsing Dead & Company list file...');
  const shows = parseListFile();

  const showsToScrape = LIMIT ? shows.slice(0, LIMIT) : shows;
  console.log(`Will scrape ${showsToScrape.length} shows`);

  const allSongs = [];

  for (let i = 0; i < showsToScrape.length; i++) {
    const show = showsToScrape[i];
    const songs = await scrapeSetlist(show);

    if (songs.length > 0) {
      console.log(`  Found ${songs.length} songs`);
      allSongs.push(...songs);
    } else {
      console.log(`  No songs found`);
    }

    // Rate limit
    if (i < showsToScrape.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nTotal songs scraped: ${allSongs.length}`);
  console.log(`Unique songs: ${new Set(allSongs.map(s => s.songName)).size}`);

  if (allSongs.length > 0) {
    console.log('\nGenerating SQL...');
    const sql = generateSQL(allSongs);

    // Ensure data directory exists
    const dataDir = path.join(ROOT_DIR, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, sql);
    console.log(`SQL written to ${OUTPUT_FILE}`);
  } else {
    console.log('\nNo setlists scraped - check URL scraping logic');
  }
}

main().catch(console.error);
