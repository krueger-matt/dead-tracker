import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseService';

function AdvancedSearch() {
  const navigate = useNavigate();
  const [queryType, setQueryType] = useState('segue');
  const [song1, setSong1] = useState('');
  const [song2, setSong2] = useState('');
  const [setName, setSetName] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [allSongs, setAllSongs] = useState([]);
  const [song1Suggestions, setSong1Suggestions] = useState([]);
  const [song2Suggestions, setSong2Suggestions] = useState([]);
  const [showSong1Suggestions, setShowSong1Suggestions] = useState(false);
  const [showSong2Suggestions, setShowSong2Suggestions] = useState(false);

  // Load all songs on mount
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
    loadSongs();
  }, []);

  const handleSearch = async () => {
    setSearching(true);
    setSearched(true);
    let matchingShows = [];

    try {
      if (queryType === 'segue') {
        // Find "Song1 > Song2" (segue pairs)
        matchingShows = await findSeguePairs(song1, song2);
      } else if (queryType === 'without-segue') {
        // Find "Song2 NOT after Song1"
        matchingShows = await findWithoutSegue(song1, song2);
      } else if (queryType === 'in-set') {
        // Find "Song1 in Set 2"
        matchingShows = await findSongInSet(song1, setName);
      } else if (queryType === 'opener') {
        // Find "Song1 as opener"
        matchingShows = await findOpener(song1, setName);
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
    if (value.length >= 2) {
      const suggestions = filterSongs(value);
      setSong2Suggestions(suggestions);
      setShowSong2Suggestions(true);
    } else {
      setSong2Suggestions([]);
      setShowSong2Suggestions(false);
    }
  };

  // Select song from suggestions
  const selectSong1 = (songName) => {
    setSong1(songName);
    setShowSong1Suggestions(false);
  };

  const selectSong2 = (songName) => {
    setSong2(songName);
    setShowSong2Suggestions(false);
  };

  // Find shows where song1 is followed by song2 (consecutive in same set)
  const findSeguePairs = async (song1Name, song2Name) => {
    // First, find the song IDs
    const { data: songs } = await supabase
      .from('songs')
      .select('id, name')
      .ilike('name', song1Name);

    if (!songs || songs.length === 0) return [];
    const song1Id = songs[0].id;

    const { data: songs2 } = await supabase
      .from('songs')
      .select('id, name')
      .ilike('name', song2Name);

    if (!songs2 || songs2.length === 0) return [];
    const song2Id = songs2[0].id;

    // Find all instances of song1
    const { data: setlist1 } = await supabase
      .from('setlists')
      .select('show_id, set_name, position')
      .eq('song_id', song1Id);

    if (!setlist1 || setlist1.length === 0) return [];

    // For each instance, check if the next song is song2
    const matchingShowIds = [];
    
    for (const entry of setlist1) {
      const { data: nextSong } = await supabase
        .from('setlists')
        .select('song_id')
        .eq('show_id', entry.show_id)
        .eq('set_name', entry.set_name)
        .eq('position', entry.position + 1)
        .single();

      if (nextSong && nextSong.song_id === song2Id) {
        matchingShowIds.push(entry.show_id);
      }
    }

    if (matchingShowIds.length === 0) return [];

    // Get show details
    const { data: shows } = await supabase
      .from('shows')
      .select('*')
      .in('id', matchingShowIds)
      .order('date');

    return shows || [];
  };

  // Find shows where song1 appears but is NOT followed by song2
  const findWithoutSegue = async (song1Name, song2Name) => {
    // Find all shows with song1
    const { data: songs1 } = await supabase
      .from('songs')
      .select('id')
      .ilike('name', song1Name);

    if (!songs1 || songs1.length === 0) return [];
    const song1Id = songs1[0].id;

    const { data: showsWithSong1 } = await supabase
      .from('setlists')
      .select('show_id')
      .eq('song_id', song1Id);

    if (!showsWithSong1) return [];
    const allShowsWithSong1 = [...new Set(showsWithSong1.map(s => s.show_id))];

    // Find shows where song1 > song2
    const showsWithSegue = await findSeguePairs(song1Name, song2Name);
    const segueShowIds = new Set(showsWithSegue.map(s => s.id));

    // Filter out shows with the segue - these are orphan song1s
    const orphanShowIds = allShowsWithSong1.filter(id => !segueShowIds.has(id));

    if (orphanShowIds.length === 0) return [];

    // Get show details
    const { data: shows } = await supabase
      .from('shows')
      .select('*')
      .in('id', orphanShowIds)
      .order('date');

    return shows || [];
  };

  // Find shows where song appears in specific set
  const findSongInSet = async (songName, setName) => {
    const { data: songs } = await supabase
      .from('songs')
      .select('id')
      .ilike('name', songName);

    if (!songs || songs.length === 0) return [];
    const songId = songs[0].id;

    const { data: setlistEntries } = await supabase
      .from('setlists')
      .select('show_id')
      .eq('song_id', songId)
      .eq('set_name', setName);

    if (!setlistEntries || setlistEntries.length === 0) return [];
    
    const showIds = [...new Set(setlistEntries.map(s => s.show_id))];

    const { data: shows } = await supabase
      .from('shows')
      .select('*')
      .in('id', showIds)
      .order('date');

    return shows || [];
  };

  // Find shows where song is the opener of a set
  const findOpener = async (songName, setName) => {
    const { data: songs } = await supabase
      .from('songs')
      .select('id')
      .ilike('name', songName);

    if (!songs || songs.length === 0) return [];
    const songId = songs[0].id;

    const { data: setlistEntries } = await supabase
      .from('setlists')
      .select('show_id')
      .eq('song_id', songId)
      .eq('set_name', setName)
      .eq('position', 1);

    if (!setlistEntries || setlistEntries.length === 0) return [];
    
    const showIds = [...new Set(setlistEntries.map(s => s.show_id))];

    const { data: shows } = await supabase
      .from('shows')
      .select('*')
      .in('id', showIds)
      .order('date');

    return shows || [];
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
              <option value="segue">Song followed by another song (consecutive)</option>
              <option value="without-segue">Song NOT followed by another song</option>
              <option value="in-set">Song played in a specific set</option>
              <option value="opener">Song as set opener</option>
            </select>
          </div>

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
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
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
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Without Segue Query */}
          {queryType === 'without-segue' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Song
                </label>
                <input
                  type="text"
                  value={song1}
                  onChange={(e) => setSong1(e.target.value)}
                  placeholder="e.g., China Cat Sunflower"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-center text-gray-500 mb-4">NOT followed by</div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Second Song
                </label>
                <input
                  type="text"
                  value={song2}
                  onChange={(e) => setSong2(e.target.value)}
                  placeholder="e.g., I Know You Rider"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {/* In Set Query */}
          {queryType === 'in-set' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Song
                </label>
                <input
                  type="text"
                  value={song1}
                  onChange={(e) => setSong1(e.target.value)}
                  placeholder="e.g., Dark Star"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Song
                </label>
                <input
                  type="text"
                  value={song1}
                  onChange={(e) => setSong1(e.target.value)}
                  placeholder="e.g., Promised Land"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
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
                    <div className="font-semibold text-gray-900">
                      {formatDate(show.date)}
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
