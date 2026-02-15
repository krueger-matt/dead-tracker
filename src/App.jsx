import { useState, useEffect, useMemo } from 'react';
import './index.css';
import Header from './components/Header';
import ShowList from './components/ShowList';
import { fetchShows } from './services/supabaseService';
import { getShowData, updateShowData } from './services/supabaseService';

// Helper to get year from date string
const getYear = (dateString) => dateString.substring(0, 4);

function App() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showData, setShowData] = useState({}); // { showId: { rating, notes } }
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(''); // Start with no year selected
  const [showArchiveOnly, setShowArchiveOnly] = useState(false);

  // Load shows from Supabase on mount
  useEffect(() => {
    const loadShows = async () => {
      setLoading(true);
      const data = await fetchShows();
      setShows(data);
      setLoading(false);
    };
    loadShows();
  }, []);

  // Load show data on mount
  useEffect(() => {
    const loadShowData = async () => {
      const data = await getShowData();
      setShowData(data);
    };
    loadShowData();
  }, []);

  // Handle updating show rating/notes
  const handleUpdateShow = async (showId, rating, notes) => {
    const newData = await updateShowData(showId, rating, notes);
    setShowData(newData);
  };

  // Get unique years from shows
  const availableYears = useMemo(() => {
    const years = [...new Set(shows.map(show => getYear(show.date)))];
    return years.sort(); // Ascending order (1965 first)
  }, [shows]);

  // Set initial year to earliest year once shows are loaded
  useEffect(() => {
    if (availableYears.length > 0 && selectedYear === '') {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Filter shows based on search, year, and archive filter
  const filteredShows = useMemo(() => {
    return shows.filter(show => {
      const matchesSearch = searchTerm === '' || 
        show.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
        show.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        show.date.includes(searchTerm);
      
      const matchesYear = selectedYear === 'all' || 
        show.date.startsWith(selectedYear);
      
      const matchesArchive = !showArchiveOnly || show.hasArchiveRecordings;
      
      return matchesSearch && matchesYear && matchesArchive;
    });
  }, [shows, searchTerm, selectedYear, showArchiveOnly]);

  // Calculate progress statistics
  const stats = useMemo(() => {
    const totalShows = shows.length;
    const listenedShows = Object.keys(showData).filter(id => {
      const data = showData[id];
      return data && data.rating > 0;
    }).length;
    
    const archiveShows = shows.filter(s => s.hasArchiveRecordings).length;
    const listenedArchiveShows = Object.keys(showData).filter(id => {
      const show = shows.find(s => s.id === id);
      const data = showData[id];
      return show && show.hasArchiveRecordings && data && data.rating > 0;
    }).length;
    
    return {
      total: totalShows,
      listened: listenedShows,
      archive: archiveShows,
      listenedArchive: listenedArchiveShows
    };
  }, [shows, showData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-700 mb-2">Loading shows...</div>
          <div className="text-gray-500">Fetching from database</div>
        </div>
      </div>
    );
  }

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
        stats={stats}
      />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ShowList 
          shows={filteredShows}
          showData={showData}
          onUpdateShow={handleUpdateShow}
          searchTerm={searchTerm}
          selectedYear={selectedYear}
        />
      </main>
    </div>
  );
}

export default App;
