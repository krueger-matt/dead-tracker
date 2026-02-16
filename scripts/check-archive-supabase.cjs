#!/usr/bin/env node

/**
 * Check archive.org for show availability and update Supabase
 */

const https = require('https');

const SUPABASE_URL = '***REMOVED***';
const SUPABASE_ANON_KEY = '***REMOVED***';
const DELAY = 1000; // 1 second between requests

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch all shows from Supabase with pagination
 */
async function fetchShows() {
  const allShows = [];
  const pageSize = 1000;
  let page = 0;
  
  while (true) {
    const shows = await fetchShowsPage(page, pageSize);
    if (shows.length === 0) break;
    
    allShows.push(...shows);
    console.log(`  Fetched ${allShows.length} shows so far...`);
    
    if (shows.length < pageSize) break; // Last page
    page++;
  }
  
  return allShows;
}

/**
 * Fetch one page of shows
 */
function fetchShowsPage(page, pageSize) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/shows`);
    url.searchParams.append('select', 'id,date');
    url.searchParams.append('order', 'date.asc');
    url.searchParams.append('limit', pageSize.toString());
    url.searchParams.append('offset', (page * pageSize).toString());
    
    https.get(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Update a show's archive status in Supabase
 */
function updateShow(showId, hasArchive) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ has_archive_recordings: hasArchive });
    
    const url = new URL(`${SUPABASE_URL}/rest/v1/shows`);
    url.searchParams.append('id', `eq.${showId}`);
    
    const options = {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    };
    
    const req = https.request(url, options, (res) => {
      if (res.statusCode === 204 || res.statusCode === 200) {
        resolve(true);
      } else {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log(`    ERROR updating ${showId}: ${res.statusCode} - ${data}`);
          resolve(false);
        });
      }
    });
    
    req.on('error', (e) => {
      console.log(`    HTTP ERROR updating ${showId}: ${e.message}`);
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * Check if a show exists on archive.org
 */
function checkArchive(date) {
  return new Promise((resolve) => {
    const query = `collection:GratefulDead AND date:${date}`;
    const url = `https://archive.org/services/search/v1/scrape?q=${encodeURIComponent(query)}`;
    
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        resolve(false);
        return;
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.items && json.items.length > 0);
        } catch (e) {
          resolve(false);
        }
      });
    }).on('error', () => resolve(false));
  });
}

async function main() {
  console.log('🎸 Updating archive.org availability...\n');
  
  // Fetch all shows
  console.log('Fetching shows from Supabase...');
  const shows = await fetchShows();
  // Resume from a specific date (skip shows already processed)
  const resumeFrom = '1970-07-01';
  const filteredShows = shows.filter(s => s.date >= resumeFrom);
  console.log(`Found ${shows.length} shows total, resuming from ${resumeFrom} (${filteredShows.length} remaining)\n`);

  let checked = 0;
  let found = 0;
  let autoMarked = 0;
  let updated = 0;

  for (const show of filteredShows) {
    const year = parseInt(show.date.substring(0, 4));
    
    // Auto-mark 1976+ as available
    if (year >= 1976) {
      autoMarked++;
      const progress = `[${checked + autoMarked}/${shows.length}]`;
      process.stdout.write(`${progress} ${show.date} (${year}) - auto-marking... `);
      
      const success = await updateShow(show.id, true);
      if (success) {
        updated++;
        process.stdout.write('✅\n');
      } else {
        process.stdout.write('❌\n');
      }
      
      continue;
    }
    
    // Check archive.org for 1965-1975
    checked++;
    const progress = `[${checked + autoMarked}/${shows.length}]`;
    
    process.stdout.write(`${progress} Checking ${show.date}... `);
    
    const hasArchive = await checkArchive(show.date);
    
    if (hasArchive) {
      found++;
      process.stdout.write('✅ FOUND - updating... ');
      
      const success = await updateShow(show.id, true);
      if (success) {
        updated++;
        process.stdout.write('✅\n');
      } else {
        process.stdout.write('❌ update failed\n');
      }
    } else {
      process.stdout.write('❌\n');
    }
    
    // Rate limit
    await sleep(DELAY);
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Total shows: ${filteredShows.length}`);
  console.log(`   1965-1975 checked: ${checked}`);
  console.log(`   1965-1975 found on archive: ${found}`);
  console.log(`   1976+ auto-marked: ${autoMarked}`);
  console.log(`   Successfully updated: ${updated}`);
  console.log(`\n✅ Database updated!`);
}

main().catch(console.error);
