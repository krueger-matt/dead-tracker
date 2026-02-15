// Sample Grateful Dead show data
// In production, this will be replaced with real data from Supabase

export const sampleShows = [
  {
    id: "gd1965-12-04",
    date: "1965-12-04",
    venue: "The Matrix",
    city: "San Francisco",
    state: "CA",
    hasArchiveRecordings: false,
  },
  {
    id: "gd1967-06-18",
    date: "1967-06-18",
    venue: "Monterey Pop Festival",
    city: "Monterey",
    state: "CA",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1969-08-16",
    date: "1969-08-16",
    venue: "Woodstock",
    city: "Bethel",
    state: "NY",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1970-05-02",
    date: "1970-05-02",
    venue: "Harpur College",
    city: "Binghamton",
    state: "NY",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1972-05-11",
    date: "1972-05-11",
    venue: "Civic Center",
    city: "Rotterdam",
    state: "Netherlands",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1973-05-20",
    date: "1973-05-20",
    venue: "Campus Stadium",
    city: "Santa Barbara",
    state: "CA",
    hasArchiveRecordings: false,
  },
  {
    id: "gd1974-05-14",
    date: "1974-05-14",
    venue: "Adams Field House",
    city: "Missoula",
    state: "MT",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1977-05-08",
    date: "1977-05-08",
    venue: "Barton Hall, Cornell University",
    city: "Ithaca",
    state: "NY",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1977-05-09",
    date: "1977-05-09",
    venue: "Buffalo Memorial Auditorium",
    city: "Buffalo",
    state: "NY",
    hasArchiveRecordings: false,
  },
  {
    id: "gd1977-05-11",
    date: "1977-05-11",
    venue: "St. Paul Civic Center",
    city: "St. Paul",
    state: "MN",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1980-09-03",
    date: "1980-09-03",
    venue: "Springfield Civic Center",
    city: "Springfield",
    state: "MA",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1985-03-28",
    date: "1985-03-28",
    venue: "Nassau Coliseum",
    city: "Uniondale",
    state: "NY",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1987-09-18",
    date: "1987-09-18",
    venue: "Madison Square Garden",
    city: "New York",
    state: "NY",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1989-07-17",
    date: "1989-07-17",
    venue: "Alpine Valley Music Theatre",
    city: "East Troy",
    state: "WI",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1990-03-29",
    date: "1990-03-29",
    venue: "Nassau Coliseum",
    city: "Uniondale",
    state: "NY",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1991-09-10",
    date: "1991-09-10",
    venue: "Madison Square Garden",
    city: "New York",
    state: "NY",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1994-10-01",
    date: "1994-10-01",
    venue: "Boston Garden",
    city: "Boston",
    state: "MA",
    hasArchiveRecordings: true,
  },
  {
    id: "gd1995-07-09",
    date: "1995-07-09",
    venue: "Soldier Field",
    city: "Chicago",
    state: "IL",
    hasArchiveRecordings: true,
  },
];

// Helper function to generate archive.org URL
export const getArchiveUrl = (date) => {
  // Simple search format that works reliably
  return `https://archive.org/search.php?query=collection%3AGratefulDead%20AND%20date%3A${date}`;
};

// Helper function to format date for display
export const formatDate = (dateString) => {
  // Parse YYYY-MM-DD and format manually to avoid timezone issues
  const [year, month, day] = dateString.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[parseInt(month) - 1];
  return `${monthName} ${parseInt(day)}, ${year}`;
};

// Helper function to extract year from date
export const getYear = (dateString) => {
  return dateString.substring(0, 4);
};
