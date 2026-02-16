import { useNavigate } from 'react-router-dom';

// Format date for display
const formatDate = (dateString) => {
  const [year, month, day] = dateString.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}, ${year}`;
};

// Get show label (Early Show, Late Show, etc.)
const getShowLabel = (showNumber) => {
  if (showNumber === 1) return 'Early Show';
  if (showNumber === 2) return 'Late Show';
  return `Show ${showNumber}`;
};

// Simple checkbox for listened status
const ListenedCheckbox = ({ listened, onChange }) => {
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={listened}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
        aria-label="Mark as listened"
      />
    </div>
  );
};

// Bookmark button for want-to-listen
const WantToListenButton = ({ wantToListen, onChange }) => {
  return (
    <button
      onClick={() => onChange(!wantToListen)}
      className={`text-lg transition-colors ${
        wantToListen 
          ? 'text-yellow-500' 
          : 'text-gray-300 hover:text-yellow-400'
      }`}
      aria-label={wantToListen ? 'Remove from queue' : 'Add to queue'}
      title={wantToListen ? 'In your queue' : 'Add to queue'}
    >
      {wantToListen ? '★' : '☆'}
    </button>
  );
};

function ShowList({ shows, showData, onUpdateShow, searchTerm, selectedYear }) {
  const navigate = useNavigate();

  if (shows.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          {searchTerm 
            ? `No shows found matching "${searchTerm}"`
            : selectedYear 
              ? `No shows found for ${selectedYear}`
              : 'No shows found'
          }
        </p>
      </div>
    );
  }

  // Sort by date (oldest first) - no filtering needed, Browse already filtered
  const sortedShows = [...shows].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return (a.showNumber || 1) - (b.showNumber || 1);
  });

  // Find dates with multiple shows
  const showCountsByDate = sortedShows.reduce((acc, show) => {
    acc[show.date] = (acc[show.date] || 0) + 1;
    return acc;
  }, {});

  const handleListenedChange = (showId, listened) => {
    const currentData = showData[showId] || { notes: '', wantToListen: false };
    onUpdateShow(showId, listened, currentData.notes, currentData.wantToListen);
  };

  const handleWantToListenChange = (showId, wantToListen) => {
    const currentData = showData[showId] || { listened: false, notes: '' };
    onUpdateShow(showId, currentData.listened, currentData.notes, wantToListen);
  };

  return (
    <div className="space-y-2">
      {sortedShows.map(show => {
        const data = showData[show.id] || { listened: false, notes: '', wantToListen: false };
        const showNumber = show.showNumber || 1;
        const hasMultipleShowsThisDate = showCountsByDate[show.date] > 1;
        
        return (
          <div
            key={show.id}
            onClick={() => navigate(`/show/${show.id}`)}
            className={`rounded-lg border p-4 cursor-pointer flex items-center gap-4 ${
              show.hasArchiveRecordings 
                ? 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md' 
                : 'bg-gray-50 border-gray-100 hover:border-gray-300'
            } transition-all`}
          >
            {/* Listened checkbox - stop propagation */}
            <div onClick={(e) => e.stopPropagation()}>
              <ListenedCheckbox 
                listened={data.listened}
                onChange={(listened) => handleListenedChange(show.id, listened)}
              />
            </div>

            {/* Want to listen bookmark - stop propagation */}
            <div onClick={(e) => e.stopPropagation()}>
              <WantToListenButton
                wantToListen={data.wantToListen}
                onChange={(wantToListen) => handleWantToListenChange(show.id, wantToListen)}
              />
            </div>
            
            {/* Show Info */}
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900">
                  {formatDate(show.date)}
                </span>
                {hasMultipleShowsThisDate && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {getShowLabel(showNumber)}
                  </span>
                )}
                {show.band && show.band !== 'Grateful Dead' && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                    {show.band}
                  </span>
                )}
                {show.hasArchiveRecordings && (
                  <span className="text-xl" title="Available on archive.org">
                    🎵
                  </span>
                )}
                {data.notes && (
                  <span className="text-sm text-gray-500" title="Has notes">
                    📝
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {show.venue}
              </div>
              {(show.city || show.state) && (
                <div className="text-xs text-gray-500">
                  {show.city}{show.city && show.state && ', '}{show.state}
                </div>
              )}
            </div>
            
            {/* Arrow indicator */}
            <div className="text-gray-400 flex-shrink-0">
              →
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ShowList;
