// Supabase Service
// This module handles all database interactions
// Currently in MOCK MODE - uses localStorage
// Will be replaced with real Supabase client when you set up your account

const STORAGE_KEY = 'gd-show-data';
const USE_MOCK = true; // Set to false when Supabase is configured

// Supabase configuration (fill these in when you set up Supabase)
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';

// Mock functions using localStorage
const mockGetShowData = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
};

const mockUpdateShowData = (showId, rating, notes) => {
  const allData = mockGetShowData();
  
  if (rating === 0 && !notes) {
    // Remove if unrated and no notes
    delete allData[showId];
  } else {
    allData[showId] = { rating, notes };
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
  return allData;
};

// Real Supabase functions (to be used later)
const supabaseGetShowData = async () => {
  // TODO: Implement when Supabase is configured
  // const { data, error } = await supabase
  //   .from('listened_shows')
  //   .select('show_id, rating, notes');
  // return data.reduce((acc, item) => {
  //   acc[item.show_id] = { rating: item.rating, notes: item.notes };
  //   return acc;
  // }, {});
  throw new Error('Supabase not configured');
};

const supabaseUpdateShowData = async (showId, rating, notes) => {
  // TODO: Implement when Supabase is configured
  // if (rating === 0 && !notes) {
  //   await supabase.from('listened_shows').delete().eq('show_id', showId);
  // } else {
  //   await supabase.from('listened_shows').upsert({ 
  //     show_id: showId, 
  //     rating, 
  //     notes 
  //   });
  // }
  throw new Error('Supabase not configured');
};

// Export the appropriate functions based on mode
export const getShowData = USE_MOCK 
  ? mockGetShowData 
  : supabaseGetShowData;

export const updateShowData = USE_MOCK 
  ? mockUpdateShowData 
  : supabaseUpdateShowData;

export const isUsingMock = USE_MOCK;
