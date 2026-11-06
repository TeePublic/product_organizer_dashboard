// Date helpers. All dates are plain 'YYYY-MM-DD' strings.
const DAY = 864e5;
export const parse = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
export const fmt = (ms) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (s, n) => fmt(parse(s) + n * DAY);
export const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / DAY);
export const datesFrom = (start, n) => Array.from({ length: n }, (_, i) => addDays(start, i));

// Each Amplitude project cuts its days in its own time zone: TeePublic in Eastern, Redbubble in Pacific.
export const SITE_TZ = { tp: 'America/New_York', rb: 'America/Los_Angeles' };

export function dateIn(tz, instant) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

// The latest day that is finished AND has had `settleHours` for late events to land (Mike's routine: 8 AM ET adds yesterday for both sites).
export function lastCompleteDay(tz, now = new Date(), settleHours = 5) {
  return addDays(dateIn(tz, new Date(now.getTime() - settleHours * 3600e3)), -1);
}
export const lastCompleteBySite = (now = new Date(), settleHours = 5) => ({ tp: lastCompleteDay(SITE_TZ.tp, now, settleHours), rb: lastCompleteDay(SITE_TZ.rb, now, settleHours) });