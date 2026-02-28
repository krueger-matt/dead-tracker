import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseService';

function AdvancedSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [queryType, setQueryType] = useState(searchParams.get('type') || 'segue');
  const [song1, setSong1] = useState(searchParams.get('song1') || '');
  const [song2, setSong2] = useState(searchParams.get('song2') || '');
  const [setName, setSetName] = useState(searchParams.get('set') || '');
  const [band, setBand] = useState(searchParams.get('band') || '');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [allSongs, setAllSongs] = useState([]);
  const [song1Suggestions, setSong1Suggestions] = useState([]);
  const [song2Suggestions, setSong2Suggestions] = useState([]);
  const [showSong1Suggestions, setShowSong1Suggestions] = useState(false);
  const [showSong2Suggestions, setShowSong2Suggestions] = useState(false);
  const [availableBands, setAvailableBands] = useState([]);
  const [selectedSong1Index, setSelectedSong1Index] = useState(-1);
  const [selectedSong2Index, setSelectedSong2Index] = useState(-1);

  // Load all songs and bands on mount
  useEffect(() => {
    const loadSongs = async () => {
      const { data } = await supabase
        .from('songs')
        .select('name')
        .order('name');

      if (data) {
        setAllSongs(data.map(s => s.name));
      }
    };

    const loadBands = async () => {
      // Fetch all shows with pagination to get all bands
      let allShows = [];
      let page = 0;
      let hasMore = true;
      const PAGE_SIZE = 1000;

      while (hasMore) {
        const { data, error } = await supabase
          .from('shows')
          .select('band')
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) {
          console.error('Error loading bands:', error);
          break;
        }

        if (data && data.length > 0) {
          allShows = [...allShows, ...data];
          hasMore = data.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }

      console.log('Loading bands - total shows:', allShows.length);
      const uniqueBands = [...new Set(allShows.map(show => show.band))].sort();
      console.log('Unique bands found:', uniqueBands);
      setAvailableBands(uniqueBands);
    };

    loadSongs();
    loadBands();
  }, []);

  // Auto-search if returning to page with URL params
  useEffect(() => {
    if (allSongs.length > 0 && !initialLoadDone) {
      setInitialLoadDone(true);
      if (searchParams.has('song1')) {
        handleSearch();
      }
    }
  }, [allSongs, initialLoadDone, searchParams]);

  const handleSearch = async () => {
    setSearching(true);
    setSearched(true);

    // Update URL with search params
    const params = { type: queryType };
    if (song1) params.song1 = song1;
    if (song2) params.song2 = song2;
    if (setName) params.set = setName;
    if (band) params.band = band;
    setSearchParams(params, { replace: true });

    let matchingShows = [];

    try {
      if (queryType === 'played') {
        // Find shows where Song1 was played
        matchingShows = await findSongPlayed(song1);
      } else if (queryType === 'segue') {
        // Find "Song1 > Song2" (segue pairs)
        matchingShows = await findSeguePairs(song1, song2);
      } else if (queryType === 'not-preceded-by') {
        // Find "Song2 played but NOT after Song1"
        matchingShows = await findNotPrecededBy(song1, song2);
      } else if (queryType === 'without-segue') {
        // Find "Song2 NOT after Song1"
        matchingShows = await findWithoutSegue(song1, song2);
      } else if (queryType === 'in-set') {
        // Find "Song1 in Set 2"
        matchingShows = await findSongInSet(song1, setName);
      } else if (queryType === 'opener') {
        // Find "Song1 as opener"
        matchingShows = await findOpener(song1, setName);
      } else if (queryType === 'not-played') {
        // Find shows where Song1 was NOT played
        matchingShows = await findSongNotPlayed(song1);
      }

      setResults(matchingShows);
    } catch (error) {
      console.error('Search error:', error);
    }

    setSearching(false);
  };

  // Filter songs locally
  const filterSongs = (query) => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();
    return allSongs
      .filter(song => song.toLowerCase().includes(lowerQuery))
      .slice(0, 10);
  };

  // Handle song1 input change
  const handleSong1Change = (value) => {
    setSong1(value);
    setSelectedSong1Index(-1);
    if (value.length >= 2) {
      const suggestions = filterSongs(value);
      setSong1Suggestions(suggestions);
      setShowSong1Suggestions(true);
    } else {
      setSong1Suggestions([]);
      setShowSong1Suggestions(false);
    }
  };

  // Handle song2 input change
  const handleSong2Change = (value) => {
    setSong2(value);
    setSelectedSong2Index(-1);
    if (value.length >= 2) {
      const suggestions = filterSongs(value);
      setSong2Suggestions(suggestions);
      setShowSong2Suggestions(true);
    } else {
      setSong2Suggestions([]);
      setShowSong2Suggestions(false);
    }
  };

  // Handle keyboard navigation for song1
  const handleSong1KeyDown = (e) => {
    if (!showSong1Suggestions || song1Suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSong1Index(prev =>
        prev < song1Suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSong1Index(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (selectedSong1Index >= 0) {
        e.preventDefault();
        selectSong1(song1Suggestions[selectedSong1Index]);
      }
    } else if (e.key === 'Escape') {
      setShowSong1Suggestions(false);
      setSelectedSong1Index(-1);
    }
  };

  // Handle keyboard navigation for song2
  const handleSong2KeyDown = (e) => {
    if (!showSong2Suggestions || song2Suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSong2Index(prev =>
        prev < song2Suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSong2Index(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (selectedSong2Index >= 0) {
        e.preventDefault();
        selectSong2(song2Suggestions[selectedSong2Index]);
      }
    } else if (e.key === 'Escape') {
      setShowSong2Suggestions(false);
      setSelectedSong2Index(-1);
    }
  };

  // Select song from suggestions
  const selectSong1 = (songName) => {
    setSong1(songName);
    setShowSong1Suggestions(false);
    setSelectedSong1Index(-1);
  };

  const selectSong2 = (songName) => {
    setSong2(songName);
    setShowSong2Suggestions(false);
    setSelectedSong2Index(-1);
  };

  // Get color class for band
  const getBandColor = (bandName) => {
    const colors = {
      'Grateful Dead': 'bg-blue-100 text-blue-700',
      'Dead & Company': 'bg-purple-100 text-purple-700',
      'Furthur': 'bg-green-100 text-green-700',
      'The Other Ones': 'bg-orange-100 text-orange-700',
      'Phil Lesh and Friends': 'bg-pink-100 text-pink-700',
      'Phil Lesh And Friends': 'bg-pink-100 text-pink-700',
      'Bob Weir and Wolf Bros': 'bg-indigo-100 text-indigo-700',
    };
    return colors[bandName] || 'bg-gray-100 text-gray-700';
  };

  // Helper: look up a song ID by name
  const findSongId = async (songName) => {
    const { data } = await supabase
      .from('songs')
      .select('id')
      .ilike('name', songName);
    return data && data.length > 0 ? data[0].id : null;
  };

  // Helper: fetch show details for a list of IDs
  const fetchShowsByIds = async (showIds) => {
    if (showIds.length === 0) return [];
    let query = supabase
      .from('shows')
      .select('*')
      .in('id', showIds);

    // Filter by band if specified
    if (band) {
      query = query.eq('band', band);
    }

    const { data } = await query.order('date');
    return data || [];
  };

  // Find shows where song was played (in any set)
  const findSongPlayed = async (songName) => {
    const songId = await findSongId(songName);
    if (!songId) return [];

    // Get all show IDs where this song was played
    const { data: setlistEntries } = await supabase
      .from('setlists')
      .select('show_id')
      .eq('song_id', songId);

    if (!setlistEntries || setlistEntries.length === 0) return [];

    const showIds = [...new Set(setlistEntries.map(entry => entry.show_id))];
    return await fetchShowsByIds(showIds);
  };

  // Find shows where song1 is followed by song2 (consecutive in same set)
  const findSeguePairs = async (song1Name, song2Name) => {
    const song1Id = await findSongId(song1Name);
    if (!song1Id) return [];
    const song2Id = await findSongId(song2Name);
    if (!song2Id) return [];

    // Fetch all setlist entries for both songs in parallel
    const [{ data: entries1 }, { data: entries2 }] = await Promise.all([
      supabase.from('setlists').select('show_id, set_name, position').eq('song_id', song1Id),
      supabase.from('setlists').select('show_id, set_name, position').eq('song_id', song2Id)
    ]);

    if (!entries1 || !entries2) return [];

    // Build a lookup of song2 appearances: "showId|setName|position" -> true
    const song2Lookup = new Set(
      entries2.map(e => `${e.show_id}|${e.set_name}|${e.position}`)
    );

    // Find shows where song1 at position N has song2 at position N+1 in the same set
    const matchingShowIds = entries1
      .filter(e => song2Lookup.has(`${e.show_id}|${e.set_name}|${e.position + 1}`))
      .map(e => e.show_id);

    return fetchShowsByIds([...new Set(matchingShowIds)]);
  };

  // Find shows where song2 was played but NOT preceded by song1
  const findNotPrecededBy = async (song1Name, song2Name) => {
    const song1Id = await findSongId(song1Name);
    if (!song1Id) return [];
    const song2Id = await findSongId(song2Name);
    if (!song2Id) return [];

    // Fetch all setlist entries for both songs in parallel
    const [{ data: entries1 }, { data: entries2 }] = await Promise.all([
      supabase.from('setlists').select('show_id, set_name, position').eq('song_id', song1Id),
      supabase.from('setlists').select('show_id, set_name, position').eq('song_id', song2Id)
    ]);

    if (!entries2) return [];

    // Build a lookup of song1 appearances
    const song1Lookup = new Set(
      (entries1 || []).map(e => `${e.show_id}|${e.set_name}|${e.position}`)
    );

    // Find shows where song2 appears but is NOT immediately after song1
    const showsWithPair = new Set(
      entries2
        .filter(e => song1Lookup.has(`${e.show_id}|${e.set_name}|${e.position - 1}`))
        .map(e => e.show_id)
    );

    const orphanShowIds = [...new Set(entries2.map(e => e.show_id))]
      .filter(id => !showsWithPair.has(id));

    return fetchShowsByIds(orphanShowIds);
  };

  // Find shows where song1 appears but is NOT followed by song2
  const findWithoutSegue = async (song1Name, song2Name) => {
    const song1Id = await findSongId(song1Name);
    if (!song1Id) return [];
    const song2Id = await findSongId(song2Name);
    if (!song2Id) return [];

    // Fetch all setlist entries for both songs in parallel
    const [{ data: entries1 }, { data: entries2 }] = await Promise.all([
      supabase.from('setlists').select('show_id, set_name, position').eq('song_id', song1Id),
      supabase.from('setlists').select('show_id, set_name, position').eq('song_id', song2Id)
    ]);

    if (!entries1) return [];

    // Build a lookup of song2 appearances
    const song2Lookup = new Set(
      (entries2 || []).map(e => `${e.show_id}|${e.set_name}|${e.position}`)
    );

    // Find shows where song1 is NOT followed by song2
    const showsWithPair = new Set(
      entries1
        .filter(e => song2Lookup.has(`${e.show_id}|${e.set_name}|${e.position + 1}`))
        .map(e => e.show_id)
    );

    const orphanShowIds = [...new Set(entries1.map(e => e.show_id))]
      .filter(id => !showsWithPair.has(id));

    return fetchShowsByIds(orphanShowIds);
  };

  // Find shows where song appears in specific set
  const findSongInSet = async (songName, setName) => {
    const songId = await findSongId(songName);
    if (!songId) return [];

    const { data: entries } = await supabase
      .from('setlists')
      .select('show_id')
      .eq('song_id', songId)
      .eq('set_name', setName);

    if (!entries || entries.length === 0) return [];
    return fetchShowsByIds([...new Set(entries.map(e => e.show_id))]);
  };

  // Find shows where song is the opener of a set
  const findOpener = async (songName, setName) => {
    const songId = await findSongId(songName);
    if (!songId) return [];

    const { data: entries } = await supabase
      .from('setlists')
      .select('show_id')
      .eq('song_id', songId)
      .eq('set_name', setName)
      .eq('position', 1);

    if (!entries || entries.length === 0) return [];
    return fetchShowsByIds([...new Set(entries.map(e => e.show_id))]);
  };

  // Find shows where song was NOT played
  const findSongNotPlayed = async (songName) => {
    const songId = await findSongId(songName);

    // Build query for all shows with optional band filter
    let allShowsQuery = supabase
      .from('shows')
      .select('*');

    if (band) {
      allShowsQuery = allShowsQuery.eq('band', band);
    }

    if (!songId) {
      // If song doesn't exist, return all shows (filtered by band)
      const { data: allShows } = await allShowsQuery.order('date');
      return allShows || [];
    }

    // Get all shows (filtered by band)
    const { data: allShows } = await allShowsQuery.order('date');

    if (!allShows || allShows.length === 0) return [];

    // Get show IDs for the filtered band
    const allShowIds = allShows.map(s => s.id);

    // Get shows from this band that have this song
    const { data: showsWithSong } = await supabase
      .from('setlists')
      .select('show_id')
      .eq('song_id', songId)
      .in('show_id', allShowIds);

    const showIdsWithSong = new Set(
      (showsWithSong || []).map(e => e.show_id)
    );

    // Filter to shows that DON'T have the song
    return allShows.filter(show => !showIdsWithSong.has(show.id));
  };

  const formatDate = (dateString) => {
    const [year, month, day] = dateString.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-blue-100 mb-4"
          >
            ← Home
          </button>
          <h1 className="text-4xl font-bold">Advanced Setlist Search</h1>
          <p className="text-blue-100 mt-2">Find shows with complex song patterns</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Build Your Query</h2>

          {/* Query Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you looking for?
            </label>
            <select
              value={queryType}
              onChange={(e) => setQueryType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="played">Shows where song was played</option>
              <option value="segue">Song followed by another song (consecutive)</option>
              <option value="not-preceded-by">Song played but NOT preceded by another song</option>
              <option value="without-segue">Song NOT followed by another song</option>
              <option value="in-set">Song played in a specific set</option>
              <option value="opener">Song as set opener</option>
              <option value="not-played">Shows where song was NOT played</option>
            </select>
          </div>

          {/* Band Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Band
            </label>
            <select
              value={band}
              onChange={(e) => setBand(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Bands</option>
              {availableBands.map((bandName) => (
                <option key={bandName} value={bandName}>
                  {bandName}
                </option>
              ))}
            </select>
          </div>

          {/* Played Query */}
          {queryType === 'played' && (
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Song Name
              </label>
              <input
                type="text"
                value={song1}
                onChange={(e) => handleSong1Change(e.target.value)}
                onKeyDown={handleSong1KeyDown}
                onBlur={() => setTimeout(() => setShowSong1Suggestions(false), 200)}
                onFocus={() => song1.length >= 2 && setShowSong1Suggestions(true)}
                placeholder="e.g., China Cat Sunflower"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {showSong1Suggestions && song1Suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {song1Suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => selectSong1(suggestion)}
                      className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                        index === selectedSong1Index ? 'bg-blue-100' : 'hover:bg-blue-50'
                      }`}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Find all shows where this song was performed
              </p>
            </div>
          )}

          {/* Segue Query */}
          {queryType === 'segue' && (
            <>
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Song
                </label>
                <input
                  type="text"
                  value={song1}
                  onChange={(e) => handleSong1Change(e.target.value)}
                  onKeyDown={handleSong1KeyDown}
                  onBlur={() => setTimeout(() => setShowSong1Suggestions(false), 200)}
                  onFocus={() => song1.length >= 2 && setShowSong1Suggestions(true)}
                  placeholder="e.g., China Cat Sunflower"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {showSong1Suggestions && song1Suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {song1Suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectSong1(suggestion)}
                        className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          index === selectedSong1Index ? 'bg-blue-100' : 'hover:bg-blue-50'
                        }`}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-center text-gray-500 mb-4">›</div>
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Second Song
                </label>
                <input
                  type="text"
                  value={song2}
                  onChange={(e) => handleSong2Change(e.target.value)}
                  onKeyDown={handleSong2KeyDown}
                  onBlur={() => setTimeout(() => setShowSong2Suggestions(false), 200)}
                  onFocus={() => song2.length >= 2 && setShowSong2Suggestions(true)}
                  placeholder="e.g., I Know You Rider"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {showSong2Suggestions && song2Suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {song2Suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectSong2(suggestion)}
                        className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          index === selectedSong2Index ? 'bg-blue-100' : 'hover:bg-blue-50'
                        }`}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Not Preceded By Query */}
          {queryType === 'not-preceded-by' && (
            <>
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Song That Should NOT Come Before
                </label>
                <input
                  type="text"
                  value={song1}
                  onChange={(e) => handleSong1Change(e.target.value)}
                  onKeyDown={handleSong1KeyDown}
                  onBlur={() => setTimeout(() => setShowSong1Suggestions(false), 200)}
                  onFocus={() => song1.length >= 2 && setShowSong1Suggestions(true)}
                  placeholder="e.g., China Cat Sunflower"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {showSong1Suggestions && song1Suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {song1Suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectSong1(suggestion)}
                        className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          index === selectedSong1Index ? 'bg-blue-100' : 'hover:bg-blue-50'
                        }`}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-center text-gray-500 mb-4">✗›</div>
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Song to Find
                </label>
                <input
                  type="text"
                  value={song2}
                  onChange={(e) => handleSong2Change(e.target.value)}
                  onKeyDown={handleSong2KeyDown}
                  onBlur={() => setTimeout(() => setShowSong2Suggestions(false), 200)}
                  onFocus={() => song2.length >= 2 && setShowSong2Suggestions(true)}
                  placeholder="e.g., I Know You Rider"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {showSong2Suggestions && song2Suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {song2Suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectSong2(suggestion)}
                        className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          index === selectedSong2Index ? 'bg-blue-100' : 'hover:bg-blue-50'
                        }`}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Find shows where the second song was played but NOT immediately after the first song
              </p>
            </>
          )}

          {/* Without Segue Query */}
          {queryType === 'without-segue' && (
            <>
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Song
                </label>
                <input
                  type="text"
                  value={song1}
                  onChange={(e) => handleSong1Change(e.target.value)}
                  onKeyDown={handleSong1KeyDown}
                  onBlur={() => setTimeout(() => setShowSong1Suggestions(false), 200)}
                  onFocus={() => song1.length >= 2 && setShowSong1Suggestions(true)}
                  placeholder="e.g., China Cat Sunflower"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {showSong1Suggestions && song1Suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {song1Suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectSong1(suggestion)}
                        className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          index === selectedSong1Index ? 'bg-blue-100' : 'hover:bg-blue-50'
                        }`}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-center text-gray-500 mb-4">NOT followed by</div>
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Second Song
                </label>
                <input
                  type="text"
                  value={song2}
                  onChange={(e) => handleSong2Change(e.target.value)}
                  onKeyDown={handleSong2KeyDown}
                  onBlur={() => setTimeout(() => setShowSong2Suggestions(false), 200)}
                  onFocus={() => song2.length >= 2 && setShowSong2Suggestions(true)}
                  placeholder="e.g., I Know You Rider"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {showSong2Suggestions && song2Suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {song2Suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectSong2(suggestion)}
                        className={`px-4 py-2 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          index === selectedSong2Index ? 'bg-blue-100' : 'hover:bg-blue-50'
                        }`}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* In Set Query */}
          {queryType === 'in-set' && (
            <>
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Song
                </label>
                <input
                  type="text"
                  value={song1}
                  onChange={(e) => handleSong1Change(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSong1Suggestions(false), 200)}
                  onFocus={() => song1.length >= 2 && setShowSong1Suggestions(true)}
                  placeholder="e.g., Dark Star"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {showSong1Suggestions && song1Suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {song1Suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectSong1(suggestion)}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set
                </label>
                <select
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a set...</option>
                  <option value="Set 1">Set 1</option>
                  <option value="Set 2">Set 2</option>
                  <option value="Set 3">Set 3</option>
                  <option value="Encore">Encore</option>
                </select>
              </div>
            </>
          )}

          {/* Opener Query */}
          {queryType === 'opener' && (
            <>
              <div className="mb-4 relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Song
                </label>
                <input
                  type="text"
                  value={song1}
                  onChange={(e) => handleSong1Change(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSong1Suggestions(false), 200)}
                  onFocus={() => song1.length >= 2 && setShowSong1Suggestions(true)}
                  placeholder="e.g., Promised Land"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {showSong1Suggestions && song1Suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {song1Suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => selectSong1(suggestion)}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Set
                </label>
                <select
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a set...</option>
                  <option value="Set 1">Set 1</option>
                  <option value="Set 2">Set 2</option>
                  <option value="Set 3">Set 3</option>
                  <option value="Encore">Encore</option>
                </select>
              </div>
            </>
          )}

          {/* Not Played Query */}
          {queryType === 'not-played' && (
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Song NOT Played
              </label>
              <input
                type="text"
                value={song1}
                onChange={(e) => handleSong1Change(e.target.value)}
                onBlur={() => setTimeout(() => setShowSong1Suggestions(false), 200)}
                onFocus={() => song1.length >= 2 && setShowSong1Suggestions(true)}
                placeholder="e.g., Dark Star"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {showSong1Suggestions && song1Suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {song1Suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => selectSong1(suggestion)}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Find all shows where this song was not performed
              </p>
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={searching}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {searched && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Results ({results.length} shows)
            </h2>
            
            {results.length === 0 ? (
              <p className="text-gray-500 italic">No shows found matching your query</p>
            ) : (
              <div className="space-y-2">
                {results.map(show => (
                  <div
                    key={show.id}
                    onClick={() => navigate(`/show/${show.id}`)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {formatDate(show.date)}
                      </span>
                      {show.band && show.band !== 'Grateful Dead' && (
                        <span className={`text-xs px-2 py-0.5 rounded ${getBandColor(show.band)}`}>
                          {show.band}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{show.venue}</div>
                    {(show.city || show.state) && (
                      <div className="text-xs text-gray-500">
                        {show.city}{show.city && show.state && ', '}{show.state}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvancedSearch;
