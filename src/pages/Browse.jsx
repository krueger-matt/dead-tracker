import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import Header from '../components/Header';
import ShowList from '../components/ShowList';

function Browse({ shows, showData, onUpdateShow, stats, availableYears }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedYear, setSelectedYear] = useState(
    searchParams.get('year') || 
    (searchParams.get('search') ? 'all' : availableYears[0] || '')
  );
  const [showArchiveOnly, setShowArchiveOnly] = useState(false);
  const [showsWithSongs, setShowsWithSongs] = useState(new Set());
  const [searchingSongs, setSearchingSongs] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
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
    setSearchParams(params, { replace: true });
  }, [searchTerm, selectedYear, setSearchParams]);

  // Filter shows based on search, year, and archive filter
  const filteredShows = useMemo(() => {
    return shows.filter(show => {
      const matchesSearch = searchTerm === '' || 
        show.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        show.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        show.date.includes(searchTerm) ||
        showsWithSongs.has(show.id); // Include shows with matching songs
      
      const matchesYear = selectedYear === 'all' || 
        show.date.startsWith(selectedYear);
      
      const matchesArchive = !showArchiveOnly || show.hasArchiveRecordings;
      
      return matchesSearch && matchesYear && matchesArchive;
    });
  }, [shows, searchTerm, selectedYear, showArchiveOnly, showsWithSongs]);

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
        stats={filteredStats}
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
