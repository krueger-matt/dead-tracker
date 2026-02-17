import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseService';

// Format date for display (avoiding timezone issues)
const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
};

function Stats({ shows, showData, selectedBand, onBandChange, availableBands }) {
  const navigate = useNavigate();
  const [songStats, setSongStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState(null);
  const [songShows, setSongShows] = useState([]);

  // Get all listened show IDs (filtered by selected band)
  const listenedShowIds = useMemo(() => {
    const bandShowIds = new Set(shows.map(show => show.id));
    return Object.keys(showData).filter(showId =>
      bandShowIds.has(showId) && showData[showId]?.listened
    );
  }, [showData, shows]);

  const listenedShowCount = listenedShowIds.length;

  useEffect(() => {
    const fetchSongStats = async () => {
      if (listenedShowIds.length === 0) {
        setSongStats([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Fetch all setlists for listened shows
      const { data: setlistData, error: setlistError } = await supabase
        .from('setlists')
        .select('song_id, show_id')
        .in('show_id', listenedShowIds);

      if (setlistError) {
        console.error('Error fetching setlists:', setlistError);
        setLoading(false);
        return;
      }

      // Get unique song IDs
      const songIds = [...new Set(setlistData.map(s => s.song_id))];

      // Fetch song details
      const { data: songsData, error: songsError } = await supabase
        .from('songs')
        .select('id, name')
        .in('id', songIds);

      if (songsError) {
        console.error('Error fetching songs:', songsError);
        setLoading(false);
        return;
      }

      // Create a map of song_id to song name
      const songMap = {};
      songsData.forEach(song => {
        songMap[song.id] = song.name;
      });

      // Count song occurrences and track show IDs
      const songCounts = {};
      setlistData.forEach(entry => {
        const songName = songMap[entry.song_id];
        if (songName) {
          if (!songCounts[songName]) {
            songCounts[songName] = {
              name: songName,
              count: 0,
              songId: entry.song_id,
              showIds: []
            };
          }
          if (!songCounts[songName].showIds.includes(entry.show_id)) {
            songCounts[songName].showIds.push(entry.show_id);
            songCounts[songName].count++;
          }
        }
      });

      // Convert to array and sort by count (descending)
      const sortedStats = Object.values(songCounts)
        .sort((a, b) => b.count - a.count);

      setSongStats(sortedStats);
      setLoading(false);
    };

    fetchSongStats();
  }, [listenedShowIds]);

  const handleSongClick = (song) => {
    // Get the shows for this song
    const showsForSong = shows.filter(show => song.showIds.includes(show.id));
    setSongShows(showsForSong);
    setSelectedSong(song);
  };

  const closeModal = () => {
    setSelectedSong(null);
    setSongShows([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-2">Loading stats...</div>
          <div className="text-gray-500">Analyzing your listening history</div>
        </div>
      </div>
    );
  }

  if (listenedShowIds.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/')}
            className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Back to Home
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Listening Stats</h1>

          {/* Band Selector */}
          {availableBands && availableBands.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-6">
              {availableBands.map(band => (
                <button
                  key={band}
                  onClick={() => onBandChange(band)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedBand === band
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {band}
                </button>
              ))}
              <button
                onClick={() => onBandChange('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedBand === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Bands
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">
              You haven't listened to any {selectedBand === 'all' ? '' : selectedBand + ' '}shows yet! Start marking shows as listened to see your stats.
            </p>
            <button
              onClick={() => navigate('/browse')}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Shows
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Listening Stats</h1>
          <p className="text-gray-600">
            Based on {listenedShowCount} show{listenedShowCount !== 1 ? 's' : ''} you've listened to
          </p>

          {/* Band Selector */}
          {availableBands && availableBands.length > 1 && (
            <div className="flex gap-2 flex-wrap mt-4">
              {availableBands.map(band => (
                <button
                  key={band}
                  onClick={() => onBandChange(band)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedBand === band
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {band}
                </button>
              ))}
              <button
                onClick={() => onBandChange('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedBand === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Bands
              </button>
            </div>
          )}
        </div>

        {/* Song Stats */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Songs You've Heard
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {songStats.length} unique songs across all listened shows
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {songStats.map((song, index) => {
              const percentage = Math.round((song.count / listenedShowCount) * 100);

              return (
                <div
                  key={song.songId}
                  onClick={() => handleSongClick(song)}
                  className="p-4 hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-grow min-w-0">
                    <div className="text-sm font-medium text-gray-400 w-8 text-right flex-shrink-0">
                      #{index + 1}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {song.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Heard in {percentage}% of your listened shows
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {song.count}
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {song.count === 1 ? 'time' : 'times'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Link to attended stats */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/stats/attended')}
            className="text-purple-600 hover:text-purple-800 text-sm"
          >
            View stats for shows you've attended →
          </button>
        </div>
      </div>

      {/* Modal for showing shows with selected song */}
      {selectedSong && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">{selectedSong.name}</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Heard in {selectedSong.count} show{selectedSong.count !== 1 ? 's' : ''} you've listened to
              </p>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[60vh]">
              {songShows.map(show => (
                <div
                  key={show.id}
                  onClick={() => {
                    closeModal();
                    navigate(`/show/${show.id}`);
                  }}
                  className="p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
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
          </div>
        </div>
      )}
    </div>
  );
}

export default Stats;
