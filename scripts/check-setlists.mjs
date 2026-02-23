#!/usr/bin/env node
/**
 * Check setlists in database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^(\w+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2].trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSetlists() {
  console.log('Checking Dead & Company setlists...\n');

  // Check for DC setlists
  const { data: setlists, error } = await supabase
    .from('setlists')
    .select('show_id')
    .like('show_id', 'dc%')
    .limit(100);

  if (error) {
    console.error('Error fetching setlists:', error);
    return;
  }

  const uniqueShows = [...new Set(setlists.map(s => s.show_id))];
  console.log(`Found setlists for ${uniqueShows.length} Dead & Company shows:`);
  uniqueShows.forEach(id => console.log(`  - ${id}`));

  // Check specific 2015 shows
  console.log('\nChecking 2015 shows specifically:');
  const { data: show1 } = await supabase
    .from('setlists')
    .select('*')
    .eq('show_id', 'dc2015-10-29')
    .limit(5);

  console.log(`\ndc2015-10-29 has ${show1?.length || 0} setlist entries`);
  if (show1 && show1.length > 0) {
    console.log('Sample:', show1[0]);
  }

  // Check how many total DC setlist entries
  const { count } = await supabase
    .from('setlists')
    .select('*', { count: 'exact', head: true })
    .like('show_id', 'dc%');

  console.log(`\nTotal Dead & Company setlist entries: ${count}`);
}

checkSetlists().catch(console.error);
