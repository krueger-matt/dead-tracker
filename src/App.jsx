import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ShowDetail from './pages/ShowDetail';
import AdvancedSearch from './pages/AdvancedSearch';
import { fetchShows, getShowData, updateShowData } from './services/supabaseService';

// Helper to get year from date string
const getYear = (dateString) => dateString.substring(0, 4);

function App() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showData, setShowData] = useState({}); // { showId: { listened, notes } }
  const [selectedBand, setSelectedBand] = useState('Grateful Dead');

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

  // Handle updating show listened/notes/wantToListen
  const handleUpdateShow = async (showId, listened, notes, wantToListen) => {
    const newData = await updateShowData(showId, listened, notes, wantToListen);
    setShowData(newData);
  };

  // Get unique bands from shows
  const availableBands = useMemo(() => {
    const bands = [...new Set(shows.map(show => show.band))];
    return bands.sort();
  }, [shows]);

  // Filter shows by selected band
  const bandShows = useMemo(() => {
    if (selectedBand === 'all') return shows;
    return shows.filter(show => show.band === selectedBand);
  }, [shows, selectedBand]);

  // Get unique years from band-filtered shows
  const availableYears = useMemo(() => {
    const years = [...new Set(bandShows.map(show => getYear(show.date)))];
    return years.sort(); // Ascending order
  }, [bandShows]);

  // Calculate progress statistics for selected band
  const stats = useMemo(() => {
    const totalShows = bandShows.length;
    const listenedShows = bandShows.filter(show => {
      const data = showData[show.id];
      return data && data.listened;
    }).length;
    
    const archiveShows = bandShows.filter(s => s.hasArchiveRecordings).length;
    const listenedArchiveShows = bandShows.filter(show => {
      const data = showData[show.id];
      return show.hasArchiveRecordings && data && data.listened;
    }).length;
    
    return {
      total: totalShows,
      listened: listenedShows,
      archive: archiveShows,
      listenedArchive: listenedArchiveShows,
      queued: bandShows.filter(show => {
        const data = showData[show.id];
        return data && data.wantToListen;
      }).length
    };
  }, [bandShows, showData]);

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
    <BrowserRouter basename="/dead-tracker">
      <Routes>
        <Route 
          path="/" 
          element={
            <Home 
              availableYears={availableYears}
              stats={stats}
              selectedBand={selectedBand}
              onBandChange={setSelectedBand}
              availableBands={availableBands}
            />
          } 
        />
        <Route 
          path="/browse" 
          element={
            <Browse 
              shows={bandShows}
              showData={showData}
              onUpdateShow={handleUpdateShow}
              stats={stats}
              availableYears={availableYears}
              selectedBand={selectedBand}
              onBandChange={setSelectedBand}
              availableBands={availableBands}
            />
          } 
        />
        <Route 
          path="/show/:showId" 
          element={<ShowDetail />} 
        />
        <Route 
          path="/advanced-search" 
          element={<AdvancedSearch />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
