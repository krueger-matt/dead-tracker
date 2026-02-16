#!/usr/bin/env python3
"""
Convert gdshowsdb YAML files to Supabase SQL format
"""
import yaml
import sys
from pathlib import Path
import re

def slugify(text):
    """Convert song name to slug ID"""
    # Remove special characters, convert to lowercase
    slug = text.lower()
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug)
    slug = slug.strip('-')
    return slug

def parse_yaml_file(yaml_path):
    """Parse a YAML file and extract shows"""
    with open(yaml_path, 'r') as f:
        data = yaml.safe_load(f)
    
    songs_dict = {}  # {slug: name}
    shows_list = []
    setlists_list = []
    
    for date_str, show_data in data.items():
        # Parse date (format: 1972/01/02)
        date = date_str.replace('/', '-')
        
        # Extract show info
        show_id = f"gd{date}"
        venue = show_data.get(':venue', '')
        city = show_data.get(':city', '')
        state = show_data.get(':state', '')
        
        # Store show
        shows_list.append({
            'id': show_id,
            'date': date,
            'venue': venue,
            'city': city,
            'state': state
        })
        
        # Parse sets
        sets = show_data.get(':sets', [])
        for set_idx, set_data in enumerate(sets, 1):
            # Determine set name
            total_sets = len(sets)
            if set_idx == total_sets and total_sets > 2:
                set_name = 'Encore'
            elif set_idx == total_sets - 1 and total_sets > 3:
                set_name = f'Encore {set_idx - 2}'
            else:
                set_name = f'Set {set_idx}'
            
            # Parse songs in set
            songs = set_data.get(':songs', [])
            for song_idx, song_data in enumerate(songs, 1):
                song_name = song_data.get(':name', '')
                segued = song_data.get(':segued', False)
                
                # Create song slug
                song_slug = slugify(song_name)
                
                # Store unique song
                if song_slug not in songs_dict:
                    songs_dict[song_slug] = song_name
                
                # Store setlist entry
                setlists_list.append({
                    'show_id': show_id,
                    'set_name': set_name,
                    'position': song_idx,
                    'song_id': song_slug,
                    'segue': segued
                })
    
    return songs_dict, shows_list, setlists_list

def generate_sql(songs_dict, shows_list, setlists_list):
    """Generate SQL INSERT statements"""
    sql_parts = []
    
    # Generate songs SQL
    if songs_dict:
        sql_parts.append("-- Insert songs")
        sql_parts.append("INSERT INTO songs (id, name) VALUES")
        song_values = []
        for slug, name in sorted(songs_dict.items()):
            # Escape single quotes
            name_escaped = name.replace("'", "''")
            song_values.append(f"  ('{slug}', '{name_escaped}')")
        sql_parts.append(',\n'.join(song_values))
        sql_parts.append("ON CONFLICT (id) DO NOTHING;\n")
    
    # Generate setlists SQL
    if setlists_list:
        sql_parts.append("-- Insert setlists")
        sql_parts.append("INSERT INTO setlists (show_id, set_name, position, song_id, segue) VALUES")
        setlist_values = []
        for entry in setlists_list:
            setlist_values.append(
                f"  ('{entry['show_id']}', '{entry['set_name']}', {entry['position']}, "
                f"'{entry['song_id']}', {str(entry['segue']).lower()})"
            )
        sql_parts.append(',\n'.join(setlist_values))
        sql_parts.append(";\n")
    
    return '\n'.join(sql_parts)

def main():
    if len(sys.argv) < 2:
        print("Usage: python yaml_to_sql.py <yaml_file> [output_file]")
        print("Example: python yaml_to_sql.py 1972.yaml 1972.sql")
        sys.exit(1)
    
    yaml_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    print(f"Parsing {yaml_file}...")
    songs_dict, shows_list, setlists_list = parse_yaml_file(yaml_file)
    
    print(f"Found {len(songs_dict)} unique songs")
    print(f"Found {len(shows_list)} shows")
    print(f"Found {len(setlists_list)} setlist entries")
    
    print("\nGenerating SQL...")
    sql = generate_sql(songs_dict, shows_list, setlists_list)
    
    if output_file:
        with open(output_file, 'w') as f:
            f.write(sql)
        print(f"SQL written to {output_file}")
    else:
        print("\n" + "="*80)
        print(sql)

if __name__ == '__main__':
    main()
