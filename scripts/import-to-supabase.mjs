#!/usr/bin/env node

/**
 * Import all shows to Supabase
 * Run this once to populate your database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://gmqnwwvmnlcxapflbqat.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcW53d3ZtbmxjeGFwZmxicWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjQ3NTQsImV4cCI6MjA4NjcwMDc1NH0.VUvoK8pr_80g2eMMCFnkX9ez1Z4F5bPVQb7ZTiIo-e0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Read SQL file and parse shows
const SQL_FILE = '../data/grateful-dead-shows-ALL-updated.sql';

console.log('📝 Reading SQL file...\n');
const sql = fs.readFileSync(SQL_FILE, 'utf8');

// Extract INSERT statements
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
    has_archive_recordings: match[6] === 'true'
  });
}

console.log(`✅ Parsed ${shows.length} shows from SQL file\n`);

// Import in batches of 100
const BATCH_SIZE = 100;
let imported = 0;

async function importBatch(batch) {
  const { data, error } = await supabase
    .from('shows')
    .upsert(batch, { onConflict: 'id' });
  
  if (error) {
    console.error('❌ Error importing batch:', error);
    throw error;
  }
  
  return data;
}

async function importAll() {
  console.log('🚀 Starting import to Supabase...\n');
  
  for (let i = 0; i < shows.length; i += BATCH_SIZE) {
    const batch = shows.slice(i, i + BATCH_SIZE);
    
    try {
      await importBatch(batch);
      imported += batch.length;
      console.log(`  ✅ Imported ${imported}/${shows.length} shows`);
    } catch (error) {
      console.error(`  ❌ Failed at batch starting at ${i}`);
      throw error;
    }
  }
  
  console.log(`\n🎸 Successfully imported all ${imported} shows!`);
}

importAll().catch(error => {
  console.error('\n❌ Import failed:', error);
  process.exit(1);
});
