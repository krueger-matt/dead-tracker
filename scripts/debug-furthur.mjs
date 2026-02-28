#!/usr/bin/env node

import * as cheerio from 'cheerio';

const url = 'https://otherones.net/furthur/2010-07-04';
const response = await fetch(url);
const html = await response.text();
const $ = cheerio.load(html);

// Extract the full setlist text
const fullText = $('.setlist').text().trim();

console.log('=== FULL TEXT ===');
console.log(fullText);

if (fullText) {
  // First line contains: date, venue, city, state
  const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const firstLine = lines[0];

  console.log('\n=== FIRST LINE ===');
  console.log(firstLine);

  // Extract venue and location from first line
  const withoutDate = firstLine.replace(/^\d+\/\d+\/\d+\s+/, '');

  console.log('\n=== WITHOUT DATE ===');
  console.log(withoutDate);

  // Split by comma
  const parts = withoutDate.split(',').map(p => p.trim());
  console.log('\n=== PARTS ===');
  console.log(parts);

  let venue = '';
  let city = '';
  let state = '';

  if (parts.length >= 2) {
    venue = parts[0];
    city = parts[1];
    if (parts.length >= 3) {
      state = parts[2];
    }
  }

  console.log('\n=== PARSED ===');
  console.log('Venue:', venue);
  console.log('City:', city);
  console.log('State:', state);

  // Find setlist lines
  const setlistLines = lines.filter(line => /^[IVE]+:/.test(line));
  console.log('\n=== SETLIST LINES ===');
  console.log(setlistLines.join('\n'));
}
