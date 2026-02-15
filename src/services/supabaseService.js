import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fetch all shows from Supabase (with pagination to get all 2269 shows)
export async function fetchShows() {
  const PAGE_SIZE = 1000;
  let allShows = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('shows')
      .select('*')
      .order('date', { ascending: true })
      .order('show_number', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    
    if (error) {
      console.error('Error fetching shows:', error);
      return allShows;
    }
    
    if (data && data.length > 0) {
      allShows = [...allShows, ...data];
      hasMore = data.length === PAGE_SIZE;
      page++;
    } else {
      hasMore = false;
    }
  }

  return allShows.map(show => ({
    id: show.id,
    date: show.date,
    showNumber: show.show_number || 1,
    venue: show.venue,
    city: show.city || '',
    state: show.state || '',
    hasArchiveRecordings: show.has_archive_recordings
  }));
}

// User data (listened status/notes) - using Supabase
export async function getShowData() {
  const { data, error } = await supabase
    .from('user_show_data')
    .select('show_id, listened, notes');
  
  if (error) {
    console.error('Error fetching user show data:', error);
    return {};
  }
  
  // Convert array to object format: { showId: { listened, notes } }
  return data.reduce((acc, item) => {
    acc[item.show_id] = {
      listened: item.listened || false,
      notes: item.notes || ''
    };
    return acc;
  }, {});
}

export async function updateShowData(showId, listened, notes) {
  // If not listened and no notes, delete the record
  if (!listened && !notes) {
    const { error } = await supabase
      .from('user_show_data')
      .delete()
      .eq('show_id', showId);
    
    if (error) {
      console.error('Error deleting user show data:', error);
    }
  } else {
    // Upsert (insert or update)
    const { error } = await supabase
      .from('user_show_data')
      .upsert({
        show_id: showId,
        listened: listened || false,
        notes: notes || '',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'show_id'
      });
    
    if (error) {
      console.error('Error updating user show data:', error);
    }
  }
  
  // Return fresh data
  return await getShowData();
}
