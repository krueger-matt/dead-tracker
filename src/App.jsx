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

  // Handle updating show listened/notes
  const handleUpdateShow = async (showId, listened, notes) => {
    const newData = await updateShowData(showId, listened, notes);
    setShowData(newData);
  };

  // Get unique years from shows
  const availableYears = useMemo(() => {
    const years = [...new Set(shows.map(show => getYear(show.date)))];
    return years.sort(); // Ascending order (1965 first)
  }, [shows]);

  // Calculate progress statistics
  const stats = useMemo(() => {
    const totalShows = shows.length;
    const listenedShows = Object.keys(showData).filter(id => {
      const data = showData[id];
      return data && data.listened;
    }).length;
    
    const archiveShows = shows.filter(s => s.hasArchiveRecordings).length;
    const listenedArchiveShows = Object.keys(showData).filter(id => {
      const show = shows.find(s => s.id === id);
      const data = showData[id];
      return show && show.hasArchiveRecordings && data && data.listened;
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
    <BrowserRouter basename="/dead-tracker">
      <Routes>
        <Route 
          path="/" 
          element={
            <Home 
              availableYears={availableYears}
              stats={stats}
            />
          } 
        />
        <Route 
          path="/browse" 
          element={
            <Browse 
              shows={shows}
              showData={showData}
              onUpdateShow={handleUpdateShow}
              stats={stats}
              availableYears={availableYears}
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
