import React, { useState } from 'react';
import { getArchiveUrl, formatDate } from '../data/sampleData';

const StarRating = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => onRatingChange(star === rating ? 0 : star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="text-2xl focus:outline-none transition-transform hover:scale-110"
        >
          {star <= (hoverRating || rating) ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
};

const ShowList = ({ shows, showData, onUpdateShow, searchTerm, selectedYear }) => {
  const [expandedShowId, setExpandedShowId] = useState(null);
  const [editingNotes, setEditingNotes] = useState({});

  // If no year selected, show prompt
  if (!selectedYear) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🎸</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Select a Year to Get Started
        </h2>
        <p className="text-gray-500">
          Choose a year from the dropdown above to see all shows from that year
        </p>
      </div>
    );
  }

  // Filter shows based on search and year
  const filteredShows = shows.filter(show => {
    const data = showData[show.id] || {};
    const matchesSearch = searchTerm === '' || 
      show.venue.toLowerCase().includes(searchTerm.toLowerCase()) ||
      show.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      show.date.includes(searchTerm) ||
      (data.notes && data.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesYear = selectedYear === 'all' || 
      show.date.startsWith(selectedYear);
    
    return matchesSearch && matchesYear;
  });

  // Sort by date (oldest first)
  const sortedShows = [...filteredShows].sort((a, b) => 
    a.date.localeCompare(b.date)
  );

  const toggleShowExpanded = (showId) => {
    setExpandedShowId(expandedShowId === showId ? null : showId);
  };

  const handleRatingChange = (showId, rating) => {
    const currentData = showData[showId] || { rating: 0, notes: '' };
    onUpdateShow(showId, rating, currentData.notes);
  };

  const handleNotesChange = (showId, notes) => {
    setEditingNotes({ ...editingNotes, [showId]: notes });
  };

  const handleNotesSave = (showId) => {
    const currentData = showData[showId] || { rating: 0, notes: '' };
    const newNotes = editingNotes[showId] || '';
    onUpdateShow(showId, currentData.rating, newNotes);
    setEditingNotes({ ...editingNotes, [showId]: undefined });
  };

  const handleNotesCancel = (showId) => {
    setEditingNotes({ ...editingNotes, [showId]: undefined });
  };

  return (
    <div className="space-y-2">
      {sortedShows.map(show => {
        const data = showData[show.id] || { rating: 0, notes: '' };
        const archiveUrl = getArchiveUrl(show.date);
        const isExpanded = expandedShowId === show.id;
        const isEditingNotes = editingNotes[show.id] !== undefined;
        const currentNotes = isEditingNotes ? editingNotes[show.id] : data.notes;
        
        return (
          <div
            key={show.id}
            className={`rounded-lg border ${
              show.hasArchiveRecordings 
                ? 'bg-white border-gray-200 hover:border-blue-300' 
                : 'bg-gray-50 border-gray-100'
            } transition-colors`}
          >
            {/* Main show row */}
            <div 
              className="flex items-center p-4 cursor-pointer"
              onClick={() => toggleShowExpanded(show.id)}
            >
              {/* Star rating - stop propagation */}
              <div onClick={(e) => e.stopPropagation()}>
                <StarRating 
                  rating={data.rating}
                  onRatingChange={(rating) => handleRatingChange(show.id, rating)}
                />
              </div>
              
              {/* Show Info */}
              <div className="ml-4 flex-grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">
                    {formatDate(show.date)}
                  </span>
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
                <div className="text-xs text-gray-500">
                  {show.city}, {show.state}
                </div>
              </div>
              
              {/* Expand indicator */}
              <div className="ml-4 text-gray-400 flex-shrink-0">
                {isExpanded ? '▼' : '▶'}
              </div>
            </div>

            {/* Expanded details section */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-200 pt-4 mt-2" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-4">
                  {/* Notes section */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    {!isEditingNotes ? (
                      <div>
                        {data.notes ? (
                          <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{data.notes}</p>
                        ) : (
                          <p className="text-sm text-gray-500 italic mb-2">No notes yet...</p>
                        )}
                        <button
                          onClick={() => setEditingNotes({ ...editingNotes, [show.id]: data.notes })}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {data.notes ? 'Edit notes' : 'Add notes'}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <textarea
                          value={currentNotes}
                          onChange={(e) => handleNotesChange(show.id, e.target.value)}
                          placeholder="Add your notes about this show..."
                          className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleNotesSave(show.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => handleNotesCancel(show.id)}
                            className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Setlist section (coming soon) */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Setlist</h3>
                    <p className="text-sm text-gray-500 italic">
                      Setlist information coming soon...
                    </p>
                  </div>

                  {/* Archive link */}
                  {show.hasArchiveRecordings && (
                    <div>
                      <a
                        href={archiveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Listen on Archive.org →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      
      {sortedShows.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No shows found matching your filters.
        </div>
      )}
    </div>
  );
};

export default ShowList;
