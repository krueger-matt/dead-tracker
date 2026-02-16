#!/usr/bin/env python3
"""
Insert songs and setlists directly to Supabase via API
"""
import yaml
import sys
import os
import re
import requests
from typing import Dict, List, Tuple

# Supabase config
SUPABASE_URL = "***REMOVED***"
SUPABASE_ANON_KEY = "***REMOVED***"

def slugify(text):
    """Convert song name to slug ID"""
    slug = text.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    slug = slug.strip('-')
    return slug

def load_song_refs(song_refs_path):
    """Load the canonical song reference list"""
    with open(song_refs_path, 'r') as f:
        data = yaml.safe_load(f)
    
    songs = []
    for item in data:
        for song_name, uuid in item.items():
            slug = slugify(song_name)
            songs.append({'id': slug, 'name': song_name})
    
    return songs

def insert_songs(songs):
    """Insert songs into Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/songs"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates"
    }
    
    # Insert in batches of 100
    batch_size = 100
    total = len(songs)
    
    for i in range(0, total, batch_size):
        batch = songs[i:i+batch_size]
        response = requests.post(url, json=batch, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"Inserted songs {i+1}-{min(i+batch_size, total)} of {total}")
        else:
            print(f"Error inserting batch {i//batch_size + 1}: {response.status_code}")
            print(response.text)
            return False
    
    return True

def insert_shows(shows):
    """Insert shows into Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/shows"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=ignore-duplicates"
    }
    
    # Insert in batches of 100
    batch_size = 100
    total = len(shows)
    
    for i in range(0, total, batch_size):
        batch = shows[i:i+batch_size]
        response = requests.post(url, json=batch, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"Inserted shows {i+1}-{min(i+batch_size, total)} of {total}")
        else:
            print(f"Error inserting batch {i//batch_size + 1}: {response.status_code}")
            print(response.text)
            return False
    
    return True

def parse_yaml_file(yaml_path, song_map):
    """Parse a YAML file and extract shows and setlists"""
    with open(yaml_path, 'r') as f:
        data = yaml.safe_load(f)
    
    shows = []
    setlists = []
    
    for date_str, show_data in data.items():
        # Parse date (format: 1972/01/02 or 1972/01/02/0 for multiple shows)
        parts = date_str.split('/')
        
        # Extract date and show number
        if len(parts) == 4:
            # Multiple shows: 1970/01/02/0
            date = f"{parts[0]}-{parts[1]}-{parts[2]}"
            show_number = int(parts[3]) + 1  # Convert 0->1, 1->2
        elif len(parts) == 3:
            # Single show: 1972/01/02
            date = f"{parts[0]}-{parts[1]}-{parts[2]}"
            show_number = 1
        else:
            print(f"WARNING: Unexpected date format: {date_str}")
            continue
        
        show_id = f"gd{date}-{show_number}" if show_number > 1 else f"gd{date}"
        
        # Extract show info
        venue = show_data.get(':venue', '')
        city = show_data.get(':city', '')
        state = show_data.get(':state', '')
        
        # Add show
        shows.append({
            'id': show_id,
            'date': date,
            'show_number': show_number,
            'venue': venue,
            'city': city,
            'state': state,
            'has_archive_recordings': False  # We'll update this later
        })
        
        sets = show_data.get(':sets', [])
        for set_idx, set_data in enumerate(sets, 1):
            total_sets = len(sets)
            if set_idx == total_sets and total_sets > 2:
                set_name = 'Encore'
            elif set_idx == total_sets - 1 and total_sets > 3:
                set_name = f'Encore {set_idx - 2}'
            else:
                set_name = f'Set {set_idx}'
            
            songs = set_data.get(':songs', [])
            for song_idx, song_data in enumerate(songs, 1):
                song_name = song_data.get(':name', '')
                segued = song_data.get(':segued', False)
                
                song_slug = song_map.get(song_name, slugify(song_name))
                
                setlists.append({
                    'show_id': show_id,
                    'set_name': set_name,
                    'position': song_idx,
                    'song_id': song_slug,
                    'segue': segued
                })
    
    return shows, setlists

def insert_setlists(setlists):
    """Insert setlists into Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/setlists"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json"
    }
    
    # Insert in batches of 100
    batch_size = 100
    total = len(setlists)
    
    for i in range(0, total, batch_size):
        batch = setlists[i:i+batch_size]
        response = requests.post(url, json=batch, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"Inserted setlists {i+1}-{min(i+batch_size, total)} of {total}")
        else:
            print(f"Error inserting batch {i//batch_size + 1}: {response.status_code}")
            print(response.text)
            return False
    
    return True

def clear_data():
    """Clear existing setlists, shows, and songs"""
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
    }
    
    print("Clearing setlists...")
    response = requests.delete(
        f"{SUPABASE_URL}/rest/v1/setlists?id=neq.00000000-0000-0000-0000-000000000000",
        headers=headers
    )
    print(f"Setlists cleared: {response.status_code}")
    
    print("Clearing shows...")
    response = requests.delete(
        f"{SUPABASE_URL}/rest/v1/shows?id=neq.none",
        headers=headers
    )
    print(f"Shows cleared: {response.status_code}")
    
    print("Clearing songs...")
    response = requests.delete(
        f"{SUPABASE_URL}/rest/v1/songs?id=neq.none",
        headers=headers
    )
    print(f"Songs cleared: {response.status_code}")

def main():
    if len(sys.argv) < 3:
        print("Usage: python import_to_supabase.py <song_refs.yaml> <year.yaml> [--clear]")
        print("Example: python import_to_supabase.py song_refs.yaml 1972.yaml --clear")
        sys.exit(1)
    
    song_refs_file = sys.argv[1]
    yaml_file = sys.argv[2]
    should_clear = '--clear' in sys.argv
    
    if should_clear:
        clear_data()
    
    print(f"\nLoading song references from {song_refs_file}...")
    songs = load_song_refs(song_refs_file)
    song_map = {s['name']: s['id'] for s in songs}
    print(f"Loaded {len(songs)} songs")
    
    print(f"\nInserting songs into Supabase...")
    if insert_songs(songs):
        print(f"✓ Successfully inserted {len(songs)} songs")
    else:
        print("✗ Failed to insert songs")
        sys.exit(1)
    
    print(f"\nParsing {yaml_file}...")
    shows, setlists = parse_yaml_file(yaml_file, song_map)
    print(f"Found {len(shows)} shows")
    print(f"Found {len(setlists)} setlist entries")
    
    print(f"\nInserting shows into Supabase...")
    if insert_shows(shows):
        print(f"✓ Successfully inserted {len(shows)} shows")
    else:
        print("✗ Failed to insert shows")
        sys.exit(1)
    
    print(f"\nInserting setlists into Supabase...")
    if insert_setlists(setlists):
        print(f"✓ Successfully inserted {len(setlists)} setlist entries")
    else:
        print("✗ Failed to insert setlists")
        sys.exit(1)
    
    print("\n✓ Import complete!")

if __name__ == '__main__':
    main()
