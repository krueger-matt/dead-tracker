/**
 * Parse human-readable date formats and convert to YYYY-MM-DD
 * Supports formats like:
 * - "April 7, 1972"
 * - "Apr 7, 72"
 * - "4/7/1972"
 * - "4/7/72"
 * - "1972-04-07" (passthrough)
 */
export function parseHumanDate(input) {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();

  // If it's already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Month names mapping
  const monthMap = {
    'january': '01', 'jan': '01',
    'february': '02', 'feb': '02',
    'march': '03', 'mar': '03',
    'april': '04', 'apr': '04',
    'may': '05',
    'june': '06', 'jun': '06',
    'july': '07', 'jul': '07',
    'august': '08', 'aug': '08',
    'september': '09', 'sep': '09', 'sept': '09',
    'october': '10', 'oct': '10',
    'november': '11', 'nov': '11',
    'december': '12', 'dec': '12'
  };

  // Try: "April 7, 1972" or "Apr 7, 72"
  const monthDayYearMatch = trimmed.match(/^([a-z]+)\s+(\d{1,2}),?\s+(\d{2,4})$/i);
  if (monthDayYearMatch) {
    const [, monthName, day, year] = monthDayYearMatch;
    const month = monthMap[monthName.toLowerCase()];
    if (month) {
      const fullYear = year.length === 2 ? `19${year}` : year;
      const paddedDay = day.padStart(2, '0');
      return `${fullYear}-${month}-${paddedDay}`;
    }
  }

  // Try: "4/7/1972" or "4/7/72"
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    const fullYear = year.length === 2 ? `19${year}` : year;
    const paddedMonth = month.padStart(2, '0');
    const paddedDay = day.padStart(2, '0');
    return `${fullYear}-${paddedMonth}-${paddedDay}`;
  }

  // Try: "April 7 1972" (no comma)
  const monthDayYearNoCommaMatch = trimmed.match(/^([a-z]+)\s+(\d{1,2})\s+(\d{2,4})$/i);
  if (monthDayYearNoCommaMatch) {
    const [, monthName, day, year] = monthDayYearNoCommaMatch;
    const month = monthMap[monthName.toLowerCase()];
    if (month) {
      const fullYear = year.length === 2 ? `19${year}` : year;
      const paddedDay = day.padStart(2, '0');
      return `${fullYear}-${month}-${paddedDay}`;
    }
  }

  return null;
}

/**
 * Check if a show date matches a search term (including human-readable formats)
 */
export function dateMatchesSearch(showDate, searchTerm) {
  if (!searchTerm) return true;

  // Direct substring match (handles partial dates like "1972" or "1972-04")
  if (showDate.includes(searchTerm)) {
    return true;
  }

  // Try parsing as human-readable date
  const parsedDate = parseHumanDate(searchTerm);
  if (parsedDate && showDate.includes(parsedDate)) {
    return true;
  }

  return false;
}
