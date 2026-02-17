import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import Header from '../components/Header';
import ShowList from '../components/ShowList';
import { dateMatchesSearch } from '../utils/dateParser';

function Browse({ shows, showData, onUpdateShow, stats, availableYears, selectedBand, onBandChange, availableBands }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [showQueueOnly, setShowQueueOnly] = useState(searchParams.get('queue') === 'true');
  const [showListenedOnly, setShowListenedOnly] = useState(searchParams.get('listened') === 'true');
  const [selectedYear, setSelectedYear] = useState(
    searchParams.get('queue') === 'true' || searchParams.get('listened') === 'true' || searchParams.get('archive') === 'true' ? 'all' :
    searchParams.get('year') ||
    (searchParams.get('search') ? 'all' : availableYears[0] || '')
  );
  const [showArchiveOnly, setShowArchiveOnly] = useState(searchParams.get('archive') === 'true');
  const [showsWithSongs, setShowsWithSongs] = useState(new Set());
  const [searchingSongs, setSearchingSongs] = useState(false);

  // Handle queue filter toggle - switch to all years when enabling
  const handleQueueFilterChange = (enabled) => {
    setShowQueueOnly(enabled);
    if (enabled) {
      setSelectedYear('all');
      setShowListenedOnly(false); // Can't show both filters at once
    }
  };

  // Handle listened filter toggle - switch to all years when enabling
  const handleListenedFilterChange = (enabled) => {
    setShowListenedOnly(enabled);
    if (enabled) {
      setSelectedYear('all');
      setShowQueueOnly(false); // Can't show both filters at once
    }
  };

  // Save scroll position when leaving the page
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('browseScrollPosition', window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Restore scroll position when returning to the page
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('browseScrollPosition');
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition, 10));
    }
  }, []);

  // Search for shows with matching songs
  useEffect(() => {
    const searchSongs = async () => {
      if (!searchTerm || searchTerm.length < 3) {
        setShowsWithSongs(new Set());
        return;
      }

      setSearchingSongs(true);
      
      // Search for songs matching the search term
      const { data: songData } = await supabase
        .from('songs')
        .select('id')
        .ilike('name', `%${searchTerm}%`);

      if (songData && songData.length > 0) {
        const songIds = songData.map(s => s.id);
        
        // Find shows that have these songs in their setlist
        const { data: setlistData } = await supabase
          .from('setlists')
          .select('show_id')
          .in('song_id', songIds);

        if (setlistData) {
          const showIds = new Set(setlistData.map(s => s.show_id));
          setShowsWithSongs(showIds);
        }
      } else {
        setShowsWithSongs(new Set());
      }

      setSearchingSongs(false);
    };

    // Debounce the search
    const timeoutId = setTimeout(searchSongs, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Update URL when search/year changes
  useEffect(() => {
    const params = {};
    if (searchTerm) params.search = searchTerm;
    if (selectedYear && selectedYear !== 'all') params.year = selectedYear;

    // Only update URL if params actually changed
    const currentSearch = searchParams.get('search') || '';
    const currentYear = searchParams.get('year') || '';
    const newSearch = params.search || '';
    const newYear = params.year || '';

    if (currentSearch !== newSearch || currentYear !== newYear) {
      setSearchParams(params, { replace: true });
    }
  }, [searchTerm, selectedYear, searchParams, setSearchParams]);

  // Filter shows based on search, year, and archive filter
  const filteredShows = useMemo(() => {
    return shows.filter(show => {
      // Check if search term is a 2-letter all-caps state abbreviation
      const isStateAbbreviation = searchTerm.length === 2 && searchTerm === searchTerm.toUpperCase();

      const matchesSearch = searchTerm === '' ||
        (isStateAbbreviation
          ? show.state === searchTerm  // Only match state for all-caps 2-letter codes
          : show.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
            show.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            show.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dateMatchesSearch(show.date, searchTerm) ||
            showsWithSongs.has(show.id) // Include shows with matching songs
        );
      
      const matchesYear = selectedYear === 'all' || 
        show.date.startsWith(selectedYear);
      
      const matchesArchive = !showArchiveOnly || show.hasArchiveRecordings;

      const matchesQueue = !showQueueOnly || (showData[show.id] && showData[show.id].wantToListen);

      const matchesListened = !showListenedOnly || (showData[show.id] && showData[show.id].listened);

      return matchesSearch && matchesYear && matchesArchive && matchesQueue && matchesListened;
    });
  }, [shows, searchTerm, selectedYear, showArchiveOnly, showQueueOnly, showsWithSongs, showData]);

  // Calculate stats for FILTERED shows
  const filteredStats = useMemo(() => {
    const totalShows = filteredShows.length;
    const listenedShows = filteredShows.filter(show => {
      const data = showData[show.id];
      return data && data.listened;
    }).length;
    
    const archiveShows = filteredShows.filter(s => s.hasArchiveRecordings).length;
    const listenedArchiveShows = filteredShows.filter(show => {
      const data = showData[show.id];
      return show.hasArchiveRecordings && data && data.listened;
    }).length;
    
    return {
      total: totalShows,
      listened: listenedShows,
      archive: archiveShows,
      listenedArchive: listenedArchiveShows
    };
  }, [filteredShows, showData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        availableYears={availableYears}
        showArchiveOnly={showArchiveOnly}
        onArchiveFilterChange={setShowArchiveOnly}
        showQueueOnly={showQueueOnly}
        onQueueFilterChange={handleQueueFilterChange}
        showListenedOnly={showListenedOnly}
        onListenedFilterChange={handleListenedFilterChange}
        stats={filteredStats}
        selectedBand={selectedBand}
        onBandChange={onBandChange}
        availableBands={availableBands}
      />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ShowList
          shows={filteredShows}
          showData={showData}
          onUpdateShow={onUpdateShow}
          searchTerm={searchTerm}
          selectedYear={selectedYear}
        />
      </main>
    </div>
  );
}

export default Browse;
