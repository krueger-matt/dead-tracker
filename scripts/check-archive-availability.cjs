#!/usr/bin/env node

/**
 * Check archive.org for 1965-1975 show availability
 * Updates the SQL file with correct has_archive_recordings flags
 */

const https = require('https');
const fs = require('fs');

const INPUT_SQL = '../data/grateful-dead-shows-ALL.sql';
const OUTPUT_SQL = '../data/grateful-dead-shows-ALL-updated.sql';
const DELAY = 2000; // 2 seconds between requests

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if a show exists on archive.org using the scraping API
 */
function checkArchive(date) {
  return new Promise((resolve) => {
    const query = `collection:GratefulDead AND date:${date}`;
    const url = `https://archive.org/services/search/v1/scrape?q=${encodeURIComponent(query)}`;
    
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.log(`\n    HTTP ${res.statusCode} for ${date}`);
        res.resume();
        resolve(false);
        return;
      }
      
      let data = '';
      res.setEncoding('utf8');
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // DEBUG: Show what we received for 1966-01-08
        if (date === '1966-01-08') {
          console.log(`  DEBUG: Received ${data.length} bytes`);
          console.log(`  DEBUG: Data = ${data.substring(0, 200)}`);
        }
        
        try {
          const json = JSON.parse(data);
          
          if (date === '1966-01-08') {
            console.log(`  DEBUG: Parsed JSON = ${JSON.stringify(json)}`);
            console.log(`  DEBUG: json.items = ${JSON.stringify(json.items)}`);
            console.log(`  DEBUG: json.items.length = ${json.items?.length}`);
          }
          
          const hasRecording = json.items && json.items.length > 0;
          resolve(hasRecording);
        } catch (e) {
          console.log(`\n    ERROR parsing JSON for ${date}: ${e.message}`);
          resolve(false);
        }
      });
      
      res.on('error', (err) => {
        console.log(`\n    Response error for ${date}: ${err.message}`);
        resolve(false);
      });
    }).on('error', (err) => {
      console.log(`\n    HTTP ERROR for ${date}: ${err.message}`);
      resolve(false);
    });
  });
}

async function main() {
  console.log('🎸 Checking archive.org for 1965-1975 shows...\n');
  
  // Read SQL file
  const sql = fs.readFileSync(INPUT_SQL, 'utf8');
  const lines = sql.split('\n');
  
  let updatedLines = [];
  let checked = 0;
  let found = 0;
  
  for (const line of lines) {
    // Check if this is an INSERT for a 1965-1975 show
    const match = line.match(/INSERT INTO shows .* VALUES \('gd(19[6-7][0-9]-.+?)'/);
    
    if (match) {
      const date = match[1];
      const year = parseInt(date.substring(0, 4));
      
      if (year >= 1965 && year <= 1975) {
        checked++;
        
        // Show what we're checking
        const query = `collection:GratefulDead AND date:${date}`;
        const testUrl = `https://archive.org/services/search/v1/scrape?q=${encodeURIComponent(query)}`;
        console.log(`\n  Checking ${date}...`);
        console.log(`  URL: ${testUrl}`);
        
        const hasArchive = await checkArchive(date);
        
        if (hasArchive) {
          found++;
          console.log(`  ✅ FOUND\n`);
          // Replace false with true
          updatedLines.push(line.replace(', false);', ', true);'));
        } else {
          console.log(`  ❌ not found\n`);
          updatedLines.push(line);
        }
        
        await sleep(DELAY);
      } else {
        updatedLines.push(line);
      }
    } else {
      updatedLines.push(line);
    }
  }
  
  // Write updated SQL
  fs.writeFileSync(OUTPUT_SQL, updatedLines.join('\n'));
  
  console.log(`\n📊 Summary:`);
  console.log(`   Shows checked: ${checked}`);
  console.log(`   Found on archive: ${found}`);
  console.log(`   Not found: ${checked - found}`);
  console.log(`\n✅ Updated SQL saved to: ${OUTPUT_SQL}`);
  console.log(`\nRun the converter again to update your app!`);
}

main();
