#!/usr/bin/env node

const https = require('https');

const date = '1966-01-08';
const query = `collection:GratefulDead AND date:${date}`;
const url = `https://archive.org/services/search/v1/scrape?q=${encodeURIComponent(query)}&fields=identifier&count=100`;

console.log(`Testing archive.org scraping API:`);
console.log(`URL: ${url}\n`);

https.get(url, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.setEncoding('utf8');
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`\nTotal data received: ${data.length} bytes\n`);
    
    try {
      const json = JSON.parse(data);
      console.log('✅ Parsed JSON successfully!');
      console.log('\nFull response:');
      console.log(JSON.stringify(json, null, 2));
      
      const hasRecording = json.items && json.items.length > 0;
      console.log(`\n${hasRecording ? '✅' : '❌'} Has recording: ${hasRecording ? 'YES' : 'NO'}`);
      if (hasRecording) {
        console.log(`Found ${json.items.length} recording(s)`);
      }
    } catch (e) {
      console.log('❌ Failed to parse JSON:', e.message);
      console.log('\nRaw response:');
      console.log(data.substring(0, 500));
    }
  });
}).on('error', (e) => {
  console.error('Request error:', e);
});
