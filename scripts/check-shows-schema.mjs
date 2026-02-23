#!/usr/bin/env node
/**
 * Check if shows table has band column and setlists table exists
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

async function checkSchema() {
  console.log('Checking database schema...\n');

  // Check shows table
  const { data: shows, error: showsError } = await supabase
    .from('shows')
    .select('*')
    .limit(1);

  if (showsError) {
    console.error('Error fetching shows:', showsError.message);
  } else if (shows && shows.length > 0) {
    console.log('✓ shows table exists');
    console.log('  Columns:', Object.keys(shows[0]).join(', '));
    console.log('  Has "band" column?', 'band' in shows[0] ? 'YES' : 'NO');
  }

  // Check setlists table
  const { data: setlists, error: setlistsError } = await supabase
    .from('setlists')
    .select('*')
    .limit(1);

  console.log('\n✓ setlists table exists?', setlistsError ? 'NO' : 'YES');

  if (setlists && setlists.length > 0) {
    console.log('  Sample setlist:', setlists[0]);
  }

  // Check for Dead & Company shows
  const { data: dcShows, error: dcError } = await supabase
    .from('shows')
    .select('id, date, venue, band')
    .like('id', 'dc%')
    .limit(5);

  if (!dcError && dcShows) {
    console.log('\n✓ Dead & Company shows found:', dcShows.length);
    if (dcShows.length > 0) {
      dcShows.forEach(s => console.log('  -', s.id, s.venue));
    }
  }
}

checkSchema().catch(console.error);
