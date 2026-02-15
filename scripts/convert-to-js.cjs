#!/usr/bin/env node

/**
 * Convert SQL file to JavaScript sample data format
 * This lets you preview all shows in the app without Supabase
 */

const fs = require('fs');

const SQL_FILE = '../data/grateful-dead-shows-ALL-updated.sql';
const OUTPUT_FILE = '../src/data/allShows.js';

console.log('📝 Converting SQL to JavaScript format...\n');

// Read the SQL file
const sql = fs.readFileSync(SQL_FILE, 'utf8');

// Extract INSERT statements
// Note: SQL escapes single quotes as '' so we need to handle that
const insertPattern = /INSERT INTO shows \(id, date, venue, city, state, has_archive_recordings\) VALUES \('([^']+)', '([^']+)', '((?:''|[^'])*)', '((?:''|[^'])*)', '((?:''|[^'])*)', (true|false)\);/g;

const shows = [];
let match;

while ((match = insertPattern.exec(sql)) !== null) {
  shows.push({
    id: match[1],
    date: match[2],
    venue: match[3].replace(/''/g, "'"), // Unescape quotes
    city: match[4].replace(/''/g, "'"),
    state: match[5].replace(/''/g, "'"),
    hasArchiveRecordings: match[6] === 'true'
  });
}

console.log(`✅ Found ${shows.length} shows\n`);

// Generate JavaScript file
const jsContent = `// All Grateful Dead Shows
// Generated from SQL data
// Total: ${shows.length} shows

export const allShows = ${JSON.stringify(shows, null, 2)};

// Helper function to get year from date
export const getYear = (dateString) => {
  return dateString.substring(0, 4);
};

// Helper function to format date for display
export const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return \`\${monthNames[parseInt(month) - 1]} \${parseInt(day)}, \${year}\`;
};

// Helper function to get archive.org URL
export const getArchiveUrl = (date) => {
  return \`https://archive.org/search.php?query=collection%3AGratefulDead%20AND%20date%3A\${date}\`;
};
`;

fs.writeFileSync(OUTPUT_FILE, jsContent);
console.log(`✅ JavaScript file created: ${OUTPUT_FILE}`);

// Also update App.jsx automatically
const APP_FILE = '../src/App.jsx';
try {
  let appContent = fs.readFileSync(APP_FILE, 'utf8');
  
  // Check if already using allShows
  if (appContent.includes("from './data/allShows'")) {
    console.log(`✅ App.jsx already using allShows`);
  } else {
    // Replace the import
    appContent = appContent.replace(
      "import { sampleShows, getYear } from './data/sampleData';",
      "import { allShows as sampleShows, getYear } from './data/allShows';"
    );
    
    fs.writeFileSync(APP_FILE, appContent);
    console.log(`✅ App.jsx updated to use allShows`);
  }
} catch (e) {
  console.log(`⚠️  Could not update App.jsx automatically: ${e.message}`);
  console.log(`   You may need to update it manually.`);
}

console.log(`\n📊 Summary:`);
console.log(`   Total shows: ${shows.length}`);
console.log(`   With archive: ${shows.filter(s => s.hasArchiveRecordings).length}`);
console.log(`   Without archive: ${shows.filter(s => !s.hasArchiveRecordings).length}`);
console.log(`\n✨ Now update App.jsx to import from './data/allShows' instead of './data/sampleData'!`);
