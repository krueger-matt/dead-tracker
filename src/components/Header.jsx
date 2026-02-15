import React from 'react';

const Header = ({ 
  totalShows, 
  listenedCount, 
  searchTerm, 
  onSearchChange, 
  selectedYear,
  onYearChange,
  availableYears,
  showArchiveOnly,
  onToggleArchiveOnly
}) => {
  const percentage = totalShows > 0 ? Math.round((listenedCount / totalShows) * 100) : 0;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg shadow-lg mb-6">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-2">
        Grateful Dead Show Tracker
      </h1>
      
      {/* Stats */}
      <div className="mb-4">
        <div className="text-lg">
          <span className="font-semibold">{listenedCount}</span> of{' '}
          <span className="font-semibold">{totalShows}</span> shows listened
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
        placeholder="Search by venue, city, or date..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 mb-4"
      />

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        {/* Year Filter */}
        <select
          value={selectedYear}
          onChange={(e) => onYearChange(e.target.value)}
          className="px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
        >
          <option value="">Select a year...</option>
          <option value="all">All Years</option>
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        {/* Archive Only Toggle */}
        <label className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg cursor-pointer hover:bg-white/30 transition-colors">
          <input
            type="checkbox"
            checked={showArchiveOnly}
            onChange={(e) => onToggleArchiveOnly(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer"
          />
          <span className="text-sm">Archive recordings only</span>
        </label>
      </div>
    </div>
  );
};

export default Header;
