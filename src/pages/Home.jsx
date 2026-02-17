import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Home({ availableYears, stats, selectedBand, onBandChange, availableBands }) {
  const [selectedYear, setSelectedYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleYearSelect = (year) => {
    navigate(`/browse?year=${year}`);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Search could be venue, city, date, or song name
      // Let browse page handle the actual filtering
      navigate(`/browse?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Dead Tracker
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Track Your Listening Journey
          </p>

          {/* Band Selector */}
          {availableBands.length > 1 && (
            <div className="flex justify-center gap-2 flex-wrap">
              {availableBands.map(band => (
                <button
                  key={band}
                  onClick={() => onBandChange(band)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedBand === band
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {band}
                </button>
              ))}
              <button
                onClick={() => onBandChange('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedBand === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Bands
              </button>
            </div>
          )}
          
          <p className="text-gray-500 mt-4">
            {selectedBand === 'all' 
              ? `Explore ${stats.total.toLocaleString()} shows across all bands`
              : `Explore ${stats.total.toLocaleString()} ${selectedBand} shows`
            }
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          <div
            onClick={() => navigate('/browse')}
            className="bg-white rounded-lg shadow p-6 text-center cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.total.toLocaleString()}
            </div>
            <div className="text-gray-600">Total Shows</div>
          </div>
          <div
            onClick={() => stats.archive > 0 && navigate('/browse?archive=true')}
            className={`bg-white rounded-lg shadow p-6 text-center ${
              stats.archive > 0 ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
            }`}
          >
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.archive.toLocaleString()}
            </div>
            <div className="text-gray-600">Available on Archive</div>
          </div>
          <div
            onClick={() => stats.listened > 0 && navigate('/browse?listened=true')}
            className={`bg-white rounded-lg shadow p-6 text-center ${
              stats.listened > 0 ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
            }`}
          >
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.listened.toLocaleString()}
            </div>
            <div className="text-gray-600">You've Listened</div>
          </div>
          <div
            onClick={() => stats.queued > 0 && navigate('/browse?queue=true')}
            className={`bg-white rounded-lg shadow p-6 text-center ${
              stats.queued > 0 ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
            }`}
          >
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {stats.queued.toLocaleString()}
            </div>
            <div className="text-gray-600">In Your Queue</div>
          </div>
          <div
            onClick={() => stats.attended > 0 && navigate('/stats/attended')}
            className={`bg-white rounded-lg shadow p-6 text-center ${
              stats.attended > 0 ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
            }`}
          >
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {stats.attended.toLocaleString()}
            </div>
            <div className="text-gray-600">You've Attended</div>
          </div>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Find a Show
          </h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by venue, city, date, or song
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g., Fillmore, Cornell, Dark Star, May 8, 1977"
                  className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Browse by Year */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Browse by Year
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => handleYearSelect(year)}
                className="px-4 py-3 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-colors font-medium text-gray-700"
              >
                {year}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate('/browse')}
              className="w-full px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium mb-3"
            >
              View All Shows
            </button>
            <button
              onClick={() => navigate('/advanced-search')}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium mb-3"
            >
              🔍 Advanced Setlist Search
            </button>
            <button
              onClick={() => navigate('/stats')}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              📊 Your Listening Stats
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Track Your Progress
            </h3>
            <p className="text-gray-600">
              Mark shows you've listened to and add personal notes about your favorite performances.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Archive Integration
            </h3>
            <p className="text-gray-600">
              Direct links to archive.org recordings for nearly 2,000 shows with available audio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
