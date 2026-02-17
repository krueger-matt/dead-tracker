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

  // Get all show IDs that have setlists (with high limit to get all rows)
  const { data: setlistData } = await supabase
    .from('setlists')
    .select('show_id')
    .limit(10000);

  const showIdsWithSetlists = new Set(
    setlistData ? setlistData.map(item => item.show_id) : []
  );

  console.log('Fetched setlist rows:', setlistData?.length || 0);
  console.log('Unique show IDs with setlists:', showIdsWithSetlists.size);
  const dcSetlists = Array.from(showIdsWithSetlists).filter(id => id && id.startsWith('dc2024'));
  console.log('Dead & Company shows with setlists:', dcSetlists.length, dcSetlists.slice(0, 5));

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

  const mappedShows = allShows.map(show => ({
    id: show.id,
    date: show.date,
    showNumber: show.show_number || 1,
    venue: show.venue,
    city: show.city || '',
    state: show.state || '',
    hasArchiveRecordings: show.has_archive_recordings,
    band: show.band || 'Grateful Dead',
    hasSetlist: showIdsWithSetlists.has(show.id)
  }));

  // Log a Dead & Company show to verify hasSetlist is set
  const dcShow = mappedShows.find(s => s.id === 'dc2024-05-17');
  if (dcShow) {
    console.log('Sample DC show (dc2024-05-17):', {
      id: dcShow.id,
      hasSetlist: dcShow.hasSetlist,
      inSet: showIdsWithSetlists.has('dc2024-05-17')
    });
  }

  return mappedShows;
}

// User data (listened status/notes/want_to_listen/attended) - using Supabase
export async function getShowData() {
  const { data, error } = await supabase
    .from('user_show_data')
    .select('show_id, listened, notes, want_to_listen, attended');

  if (error) {
    console.error('Error fetching user show data:', error);
    return {};
  }

  // Convert array to object format: { showId: { listened, notes, wantToListen, attended } }
  return data.reduce((acc, item) => {
    acc[item.show_id] = {
      listened: item.listened || false,
      notes: item.notes || '',
      wantToListen: item.want_to_listen || false,
      attended: item.attended || false
    };
    return acc;
  }, {});
}

export async function updateShowData(showId, listened, notes, wantToListen, attended) {
  // If no data at all, delete the record
  if (!listened && !notes && !wantToListen && !attended) {
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
        want_to_listen: wantToListen || false,
        attended: attended || false,
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
