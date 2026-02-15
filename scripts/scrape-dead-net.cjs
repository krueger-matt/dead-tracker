#!/usr/bin/env node

/**
 * Dead.net Show Scraper (using paginated shows-by-year endpoint)
 * 
 * Scrapes all Grateful Dead shows from dead.net/shows-by-year
 * Archive availability rule: All shows from 1976+ have recordings
 */

const https = require('https');
const fs = require('fs');
const zlib = require('zlib');

// Configuration
const OUTPUT_SQL_FILE = '../data/grateful-dead-shows-complete.sql';
const OUTPUT_JSON_FILE = '../data/grateful-dead-shows-complete.json';
const ARCHIVE_CUTOFF_YEAR = 1976;
const MIN_DELAY = 2000; // Minimum 2 seconds between requests
const MAX_DELAY = 5000; // Maximum 5 seconds between requests

// RESUME FEATURE: Set this to resume from a specific page
// Example: If you got pages 0-200, set START_PAGE = 201
const START_PAGE = 0; // Change this to 201 for the second run

// Random delay to appear more human
const randomDelay = () => {
  const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
  return Math.floor(delay);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch HTML from URL with browser-like headers
 */
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'DNT': '1',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.dead.net/'
      }
    };
    
    https.get(options, (res) => {
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchHtml(res.headers.location).then(resolve).catch(reject);
        return;
      }
      
      // Check if response is gzipped
      const encoding = res.headers['content-encoding'];
      let stream = res;
      
      if (encoding === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      } else if (encoding === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      }
      
      let data = '';
      stream.on('data', (chunk) => data += chunk.toString('utf8'));
      stream.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${url}`));
        }
      });
      stream.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Parse shows from the shows-by-year page
 */
function parseShowsFromPage(html) {
  const shows = [];
  
  // The actual HTML format is:
  // <a href="/show/may-05-1965" hreflang="en">Magoo's Pizza Parlor - May 5, 1965</a>
  
  // Match the <a> tags with show links
  const showPattern = /<a href="\/show\/[\w-]+" hreflang="en">([^<]+?)\s*-\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d+),\s+(\d{4})<\/a>/gi;
  const matches = html.matchAll(showPattern);
  
  const monthMap = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12'
  };
  
  let matchCount = 0;
  for (const match of matches) {
    matchCount++;
    const venueFull = match[1].trim();
    const monthName = match[2].toLowerCase();
    const day = match[3].padStart(2, '0');
    const year = match[4];
    
    const month = monthMap[monthName];
    const date = `${year}-${month}-${day}`;
    
    // Decode HTML entities (&#039; = apostrophe)
    let venue = venueFull.replace(/&#039;/g, "'");
    let city = '';
    let state = '';
    
    // Try to extract city and state if present
    const locationMatch = venue.match(/^(.+?),\s*(.+?),\s*([A-Z]{2})$/);
    if (locationMatch) {
      venue = locationMatch[1].trim();
      city = locationMatch[2].trim();
      state = locationMatch[3].trim();
    } else {
      // Check for just venue, city format
      const cityMatch = venue.match(/^(.+?),\s*(.+)$/);
      if (cityMatch) {
        venue = cityMatch[1].trim();
        city = cityMatch[2].trim();
      }
    }
    
    // Apply archive availability rule
    const hasArchive = parseInt(year) >= ARCHIVE_CUTOFF_YEAR;
    
    // Check for duplicates
    const showId = `gd${date}`;
    if (!shows.find(s => s.id === showId)) {
      shows.push({
        id: showId,
        date,
        venue,
        city,
        state,
        hasArchiveRecordings: hasArchive
      });
    }
  }
  
  console.log(`    DEBUG: Found ${matchCount} pattern matches, ${shows.length} unique shows`);
  
  return shows;
}

/**
 * Check if there's a "next page" link
 */
function hasNextPage(html) {
  // Look for pagination links
  return html.includes('page=') && 
         (html.includes('next') || html.includes('»') || html.match(/page=\d+/));
}

/**
 * Scrape all shows from Dead.net
 */
async function scrapeDeadNet() {
  console.log('📡 Scraping show data from Dead.net/shows-by-year...');
  console.log('   Using random delays (2-5 seconds) to avoid bot detection');
  
  if (START_PAGE > 0) {
    console.log(`   ⚡ RESUMING from page ${START_PAGE}\n`);
  } else {
    console.log('\n');
  }
  
  const allShows = [];
  let page = START_PAGE;
  let hasMore = true;
  let consecutiveErrors = 0;
  
  while (hasMore) {
    try {
      const delay = randomDelay();
      console.log(`  Fetching page ${page}... (waiting ${Math.round(delay/1000)}s first)`);
      
      // Wait BEFORE the request (except first page)
      if (page > START_PAGE) {
        await sleep(delay);
      }
      
      const url = `https://www.dead.net/shows-by-year?page=${page}`;
      const html = await fetchHtml(url);
      
      const shows = parseShowsFromPage(html);
      
      if (shows.length > 0) {
        console.log(`    ✅ Found ${shows.length} shows on this page`);
        allShows.push(...shows);
        consecutiveErrors = 0; // Reset error counter on success
      } else {
        console.log(`    ℹ️  No shows found on page ${page} - probably reached the end`);
        hasMore = false;
        break;
      }
      
      // Check if there's a next page
      if (!hasNextPage(html)) {
        console.log(`    ℹ️  No more pages found`);
        hasMore = false;
      } else {
        page++;
      }
      
    } catch (error) {
      consecutiveErrors++;
      
      if (error.message.includes('403')) {
        console.error(`  ⚠️  Got 403 on page ${page} - bot detected!`);
        console.log(`     We collected ${allShows.length} shows before being blocked.`);
        console.log(`     You can import what we have, or try running again later.`);
      } else {
        console.error(`  ❌ Error fetching page ${page}:`, error.message);
      }
      
      // If we got some data before the error, save it and exit gracefully
      if (allShows.length > 0) {
        console.log(`\n💡 Saving ${allShows.length} shows collected so far...`);
        hasMore = false;
      } else {
        // No data yet, give up
        throw error;
      }
    }
  }
  
  console.log(`\n✅ Collected ${allShows.length} total shows`);
  
  // Sort by date and remove duplicates
  const uniqueShows = Array.from(new Map(allShows.map(s => [s.id, s])).values());
  uniqueShows.sort((a, b) => a.date.localeCompare(b.date));
  
  return uniqueShows;
}

/**
 * Generate SQL insert statements
 */
function generateSQL(shows) {
  console.log('\n📝 Generating SQL...');
  
  const withArchive = shows.filter(s => s.hasArchiveRecordings).length;
  const withoutArchive = shows.length - withArchive;

  let sql = `-- Grateful Dead Shows Complete Dataset
-- Generated: ${new Date().toISOString()}
-- Source: Dead.net (shows-by-year)
-- Total shows: ${shows.length}
-- With archive recordings (1976+): ${withArchive}
-- Without archive recordings (1965-1975): ${withoutArchive}

-- Archive availability rule: All shows from 1976 onward have recordings

-- Clear existing data
DELETE FROM shows;

-- Insert all shows
`;

  for (const show of shows) {
    const venue = show.venue.replace(/'/g, "''");
    const city = show.city.replace(/'/g, "''");
    const state = show.state.replace(/'/g, "''");
    
    sql += `INSERT INTO shows (id, date, venue, city, state, has_archive_recordings) VALUES ('${show.id}', '${show.date}', '${venue}', '${city}', '${state}', ${show.hasArchiveRecordings});\n`;
  }

  return sql;
}

/**
 * Main execution
 */
async function main() {
  console.log('🎸 Dead.net Show Scraper\n');
  console.log('Scraping from: https://www.dead.net/shows-by-year');
  console.log('This may take 10-20 minutes depending on pagination...\n');
  
  try {
    const shows = await scrapeDeadNet();
    
    if (shows.length === 0) {
      console.error('\n❌ No shows found!');
      console.log('   The website structure may have changed.');
      console.log('   Try viewing the page in your browser to see the current format.');
      process.exit(1);
    }
    
    // Generate SQL
    const sql = generateSQL(shows);
    
    // Save files
    fs.writeFileSync(OUTPUT_SQL_FILE, sql);
    console.log(`✅ SQL saved to: ${OUTPUT_SQL_FILE}`);
    
    fs.writeFileSync(OUTPUT_JSON_FILE, JSON.stringify(shows, null, 2));
    console.log(`✅ JSON saved to: ${OUTPUT_JSON_FILE}`);
    
    // Summary
    const withArchive = shows.filter(s => s.hasArchiveRecordings).length;
    const yearRange = shows.length > 0 
      ? `${shows[0].date.substring(0, 4)} to ${shows[shows.length-1].date.substring(0, 4)}`
      : 'N/A';
    
    console.log('\n📊 Summary:');
    console.log(`   Total shows: ${shows.length}`);
    console.log(`   With archive (1976-1995): ${withArchive}`);
    console.log(`   Without archive (1965-1975): ${shows.length - withArchive}`);
    console.log(`   Year range: ${yearRange}`);
    
    console.log('\n✨ Done! Import the SQL file into Supabase.');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run
if (require.main === module) {
  main();
}

module.exports = { scrapeDeadNet, generateSQL };
