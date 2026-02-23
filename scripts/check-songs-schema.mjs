#!/usr/bin/env node
/**
 * Check the songs table schema and existing data
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

async function checkSongsTable() {
  console.log('Checking songs table...\n');

  // Try to fetch a few songs
  const { data: songs, error } = await supabase
    .from('songs')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error fetching songs:', error.message);
    console.log('\nThe songs table may not exist yet.');
    return;
  }

  if (songs && songs.length > 0) {
    console.log(`Found ${songs.length} songs in the database.\n`);
    console.log('Sample songs:');
    songs.forEach(song => {
      console.log(`  ID: ${song.id} (type: ${typeof song.id})`);
      console.log(`  Name: ${song.name}`);
      console.log('');
    });

    // Analyze ID pattern
    const firstId = songs[0].id;
    if (typeof firstId === 'string') {
      if (firstId.includes('-')) {
        console.log('ID format appears to be: UUID');
      } else if (/^\d+$/.test(firstId)) {
        console.log('ID format appears to be: String number');
      } else {
        console.log('ID format appears to be: Custom string');
      }
    } else if (typeof firstId === 'number') {
      console.log('ID format appears to be: Integer');
    }
  } else {
    console.log('No songs found in the database.');
    console.log('The table exists but is empty.');
  }
}

checkSongsTable().catch(console.error);
