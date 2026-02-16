#!/usr/bin/env python3
"""
Import all years of Grateful Dead setlists to Supabase
"""
import os
import subprocess
import sys

def main():
    if len(sys.argv) < 2:
        print("Usage: python import_all_years.py <yaml_directory> [--clear]")
        print("Example: python import_all_years.py . --clear")
        sys.exit(1)
    
    yaml_dir = sys.argv[1]
    should_clear = '--clear' in sys.argv
    
    # List of years to import
    years = range(1965, 1996)  # 1965-1995
    
    song_refs = os.path.join(yaml_dir, 'song_refs.yaml')
    
    if not os.path.exists(song_refs):
        print(f"Error: {song_refs} not found")
        sys.exit(1)
    
    print("=" * 80)
    print("Importing all Grateful Dead setlists (1965-1995)")
    print("=" * 80)
    
    # First import with --clear flag if specified
    first_year = True
    
    for year in years:
        yaml_file = os.path.join(yaml_dir, f'{year}.yaml')
        
        if not os.path.exists(yaml_file):
            print(f"⚠ Skipping {year}: {yaml_file} not found")
            continue
        
        print(f"\n{'='*80}")
        print(f"Importing {year}...")
        print('='*80)
        
        # Build command
        cmd = ['python3', 'import_to_supabase.py', song_refs, yaml_file]
        
        # Only clear on first import if requested
        if first_year and should_clear:
            cmd.append('--clear')
            first_year = False
        
        # Run import
        result = subprocess.run(cmd, cwd=yaml_dir)
        
        if result.returncode != 0:
            print(f"✗ Failed to import {year}")
            response = input("Continue with remaining years? (y/n): ")
            if response.lower() != 'y':
                sys.exit(1)
        else:
            print(f"✓ {year} imported successfully")
    
    print("\n" + "="*80)
    print("✓ All years imported!")
    print("="*80)

if __name__ == '__main__':
    main()
