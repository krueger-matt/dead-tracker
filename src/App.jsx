import { useState, useEffect, useMemo } from 'react';
import './index.css';
import Header from './components/Header';
import ShowList from './components/ShowList';
import { allShows as sampleShows, getYear } from './data/allShows';
import { getShowData, updateShowData, isUsingMock } from './services/supabaseService';

function App() {
  const [shows] = useState(sampleShows); // In production, this will be fetched from Supabase
  const [showData, setShowData] = useState({}); // { showId: { rating, notes } }
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(''); // Start with no year selected
  const [showArchiveOnly, setShowArchiveOnly] = useState(false);

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

  // Filter shows
  const displayedShows = useMemo(() => {
    let filtered = shows;
    
    if (showArchiveOnly) {
      filtered = filtered.filter(show => show.hasArchiveRecordings);
    }
    
    return filtered;
  }, [shows, showArchiveOnly]);

  // Count shows with archive recordings
  const showsWithArchive = useMemo(() => {
    return shows.filter(show => show.hasArchiveRecordings).length;
  }, [shows]);

  // Count listened shows (shows with rating > 0)
  const listenedCount = useMemo(() => {
    return Object.values(showData).filter(data => data.rating > 0).length;
  }, [showData]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Mock Mode Warning */}
        {isUsingMock && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <div className="text-sm text-yellow-800">
                <strong>Development Mode:</strong> Using browser storage. 
                Your progress is saved locally but won't sync across devices. 
                Connect to Supabase for permanent cloud storage.
              </div>
            </div>
          </div>
        )}

        {/* Header with search and stats */}
        <Header
          totalShows={showsWithArchive}
          listenedCount={listenedCount}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          availableYears={availableYears}
          showArchiveOnly={showArchiveOnly}
          onToggleArchiveOnly={setShowArchiveOnly}
        />

        {/* Show List */}
        <ShowList
          shows={displayedShows}
          showData={showData}
          onUpdateShow={handleUpdateShow}
          searchTerm={searchTerm}
          selectedYear={selectedYear}
        />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            This is sample data. In production, this will display all ~2,300 Grateful Dead shows.
          </p>
          <p className="mt-2">
            Recordings hosted on{' '}
            <a 
              href="https://archive.org/details/GratefulDead" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Internet Archive
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
