import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseService';
import { getShowData, updateShowData } from '../services/supabaseService';

// Format date for display
const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
};

// Get show label (Early Show, Late Show, etc.)
const getShowLabel = (showNumber) => {
  if (showNumber === 1) return 'Early Show';
  if (showNumber === 2) return 'Late Show';
  return `Show ${showNumber}`;
};

function ShowDetail() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [setlist, setSetlist] = useState({});
  const [showData, setShowData] = useState({ listened: false, notes: '', wantToListen: false });
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShowData();
  }, [showId]);

  const loadShowData = async () => {
    setLoading(true);

    // Load show info
    const { data: showData, error: showError } = await supabase
      .from('shows')
      .select('*')
      .eq('id', showId)
      .single();

    if (showError) {
      console.error('Error loading show:', showError);
      setLoading(false);
      return;
    }

    setShow(showData);

    // Load setlist
    const { data: setlistData, error: setlistError } = await supabase
      .from('setlists')
      .select(`
        set_name,
        position,
        segue,
        songs (name)
      `)
      .eq('show_id', showId)
      .order('position');

    if (!setlistError && setlistData) {
      // Group by set name
      const grouped = setlistData.reduce((acc, item) => {
        if (!acc[item.set_name]) {
          acc[item.set_name] = [];
        }
        acc[item.set_name].push({
          name: item.songs.name,
          segue: item.segue
        });
        return acc;
      }, {});
      
      // Sort set names properly (Set 1, Set 2, Encore, Encore 2, etc.)
      const sortedSetlist = {};
      const setOrder = ['Set 1', 'Set 2', 'Set 3', 'Encore', 'Encore 2', 'Encore 3'];
      
      // Add sets in proper order
      setOrder.forEach(setName => {
        if (grouped[setName]) {
          sortedSetlist[setName] = grouped[setName];
        }
      });
      
      // Add any other sets not in the standard order
      Object.keys(grouped).forEach(setName => {
        if (!sortedSetlist[setName]) {
          sortedSetlist[setName] = grouped[setName];
        }
      });
      
      setSetlist(sortedSetlist);
    }

    // Load user data
    const userData = await getShowData();
    if (userData[showId]) {
      setShowData(userData[showId]);
      setNotesText(userData[showId].notes || '');
    }

    setLoading(false);
  };

  const handleListenedChange = async (listened) => {
    await updateShowData(showId, listened, showData.notes, showData.wantToListen);
    setShowData({ ...showData, listened });
  };

  const handleWantToListenChange = async (wantToListen) => {
    await updateShowData(showId, showData.listened, showData.notes, wantToListen);
    setShowData({ ...showData, wantToListen });
  };

  const handleNotesSave = async () => {
    await updateShowData(showId, showData.listened, notesText, showData.wantToListen);
    setShowData({ ...showData, notes: notesText });
    setEditingNotes(false);
  };

  const handleNotesCancel = () => {
    setNotesText(showData.notes || '');
    setEditingNotes(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading show...</div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Show not found</div>
      </div>
    );
  }

  const archiveUrl = `https://archive.org/search.php?query=collection%3AGratefulDead%20AND%20date%3A${show.date}`;
  const hasMultipleSets = Object.keys(setlist).length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:text-blue-100 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold mb-2">
            {formatDate(show.date)}
          </h1>
          {show.band && show.band !== 'Grateful Dead' && (
            <span className="inline-block bg-white/20 text-white px-3 py-1 rounded text-sm mb-2 mr-2">
              {show.band}
            </span>
          )}
          {show.show_number > 1 && (
            <span className="inline-block bg-white/20 text-white px-3 py-1 rounded text-sm mb-2">
              {getShowLabel(show.show_number)}
            </span>
          )}
          <div className="text-xl">{show.venue}</div>
          {(show.city || show.state) && (
            <div className="text-lg text-blue-100">
              {show.city}{show.city && show.state && ', '}{show.state}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Listened & Queue & Archive */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showData.listened}
                  onChange={(e) => handleListenedChange(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-lg font-medium text-gray-900">
                  Listened
                </span>
              </label>

              <button
                onClick={() => handleWantToListenChange(!showData.wantToListen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  showData.wantToListen
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-yellow-50 hover:text-yellow-600'
                }`}
              >
                <span className="text-lg">{showData.wantToListen ? '★' : '☆'}</span>
                <span className="text-sm font-medium">
                  {showData.wantToListen ? 'In queue' : 'Add to queue'}
                </span>
              </button>
            </div>

            {show.has_archive_recordings && (
              <a
                href={archiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🎵 Listen on Archive
              </a>
            )}
          </div>
        </div>

        {/* Setlist */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Setlist</h2>
          
          {hasMultipleSets ? (
            <div className="space-y-6">
              {Object.entries(setlist).map(([setName, songs]) => (
                <div key={setName}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{setName}</h3>
                  <div className="space-y-1">
                    {songs.map((song, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-gray-700">{song.name}</span>
                        {song.segue && (
                          <span className="text-blue-600 font-bold">›</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">No setlist available yet</div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Notes</h2>
          
          {editingNotes ? (
            <div className="space-y-3">
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="6"
                placeholder="Add your notes about this show..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleNotesSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={handleNotesCancel}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {showData.notes ? (
                <div className="text-gray-700 whitespace-pre-wrap mb-3">{showData.notes}</div>
              ) : (
                <div className="text-gray-400 italic mb-3">No notes yet...</div>
              )}
              <button
                onClick={() => setEditingNotes(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {showData.notes ? 'Edit notes' : 'Add notes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShowDetail;
