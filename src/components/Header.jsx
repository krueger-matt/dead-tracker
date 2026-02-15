import React from 'react';
import { useNavigate } from 'react-router-dom';

const Header = ({ 
  searchTerm, 
  onSearchChange, 
  selectedYear,
  onYearChange,
  availableYears,
  showArchiveOnly,
  onArchiveFilterChange,
  stats
}) => {
  const navigate = useNavigate();
  const percentage = stats.total > 0 ? Math.round((stats.listened / stats.total) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Title - Clickable to go home */}
        <h1 
          onClick={() => navigate('/')}
          className="text-3xl font-bold mb-2 cursor-pointer hover:text-blue-100 transition-colors"
        >
          Dead Tracker
        </h1>
        
        {/* Stats */}
        <div className="mb-4">
          <div className="text-lg">
            <span className="font-semibold">{stats.listened}</span> of{' '}
            <span className="font-semibold">{stats.total}</span> shows listened
            <span className="ml-2 text-sm">({percentage}%)</span>
          </div>
          <div className="mt-2 h-2 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Search Bar */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by venue, city, or date..."
          className="w-full px-4 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 mb-4"
        />

        {/* Filters */}
        <div className="flex gap-4 flex-wrap items-center">
          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="">Select a year...</option>
            <option value="all">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          {/* Archive Filter */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchiveOnly}
              onChange={(e) => onArchiveFilterChange(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Archive recordings only</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default Header;
