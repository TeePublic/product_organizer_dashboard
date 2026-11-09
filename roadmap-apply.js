// Browser side. Load right after /api/roadmap-data and before app.js (plain <script> tags).
// Always records what the sheet WOULD change in window.__roadmapDiff (open the console to read it).
// Changes the board, and sets the "pulled from the sheet" note, only when APPLY is true.
(function () {
  const APPLY = true;  // the sheet drives the fields below; set to false to show the data file as written
  const FIELDS = ['eta', 's']; // fields the sheet changes on the board: launch date and status (the note below follows this list)
  const HIDE_TITLES = ['Feed fixes', 'Analytics data for the pricing test']; // cards to hide by title (Jira-only or tracker-only, not on the sheet); matched ignoring case and punctuation
  const DROP_UNMATCHED = false; // true removes board items that have no row on the sheet (Jira-only or tracker-only cards). Read window.__roadmapUnmatched first.
  const JIRA_BASE = 'https://articore.atlassian.net/browse/';
  const NO_JIRA_NOTE = 'No Jira ticket is linked on the sheet row yet. Reach out to the PM.'; // shown where the card's source is drawn
  const MIN_SHEET_ROWS = 20;    // safety: never drop anything if the snapshot has fewer rows than this (a bad or empty pull)
  const snap = window.__roadmapSnapshot;
  if (!snap || !snap.rows || typeof COMING === 'undefined') return;
  const jiraOf = (x) => ((x && x.link) || '').match(/[A-Z][A-Z0-9]+-\d+/);
  const byJira = {};
  Object.entries(snap.rows).forEach(([n, r]) => { if (r.jira) (byJira[r.jira] = byJira[r.jira] || []).push(n); });
  function isoET(createdAt) {
    const d = new Date(String(createdAt).replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00'));
    return isNaN(d) ? null : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(d);
  }
  const pulledOn = isoET(snap.createdAt);
  // Matching never needs a Jira link: sheet key, then Jira key (when unique), then exact title, then title ignoring case and punctuation (when unique).
  const norm = (x) => String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const byNorm = {};
  Object.keys(snap.rows).forEach((n) => { (byNorm[norm(n)] = byNorm[norm(n)] || []).push(n); });
  const normMatch = (x) => { const k = byNorm[norm(x)]; return k && k.length === 1 ? k[0] : null; };
  const isJiraLink = (u) => /atlassian\.net\/browse\//.test(u || '');
  const diff = [], unmatched = [], unmatchedItems = [], noJira = [];
  COMING.teams.forEach((team) => team.items.forEach((item) => {
    const j = jiraOf(item), jn = j && byJira[j[0]] && byJira[j[0]].length === 1 ? byJira[j[0]][0] : null;
    const name = [item.sheet && item.sheet.trim(), jn, item.t, item.sheet && normMatch(item.sheet), normMatch(item.t)].find((n) => n && snap.rows[n]);
    if (!name) { unmatchedItems.push([team, item]); unmatched.push(team.key + ' | ' + item.t + ' | ' + (item.s || '') + ' | ' + (item.eta || '') + ' | ' + ((item.link || '').replace(/.*browse\//, '') || '-')); return; }
    const row = snap.rows[name], p = {};
    // The Jira link comes from the sheet row only. No link there means the card says to ask the PM, never a link Jira or Slack found.
    if (APPLY) item.sheetSrc = { on: pulledOn, phase: row.phase || null, status: row.status || null, jira: row.jira || null,
      s: FIELDS.indexOf('s') >= 0 && !!row.s, eta: FIELDS.indexOf('eta') >= 0 && row.eta ? String(row.eta) : null, noJira: !row.jira, note: row.jira ? null : NO_JIRA_NOTE };
    if (row.jira) { if (APPLY) { item.link = JIRA_BASE + row.jira; item.noJira = false; delete item.jiraNote; } }
    else { noJira.push(team.key + ' | ' + item.t); if (APPLY) { if (isJiraLink(item.link)) delete item.link; item.noJira = true; item.jiraNote = NO_JIRA_NOTE; } }
    if (row.s && row.s !== item.s) p.s = row.s;
    if (row.eta && row.eta !== item.eta) p.eta = row.eta;
    if (item.impSrc === 'Roadmap sheet estimate' && row.imp && row.imp !== item.imp) p.imp = row.imp;
    Object.keys(p).forEach((k) => { if (FIELDS.indexOf(k) < 0) delete p[k]; });
    if (Object.keys(p).length) { diff.push({ item: team.key + '|' + item.t, from: { s: item.s, eta: item.eta, imp: item.imp }, to: p }); if (APPLY) Object.assign(item, p); }
  }));
  window.__roadmapDiff = diff;
  window.__roadmapHidden = [];
  if (APPLY && HIDE_TITLES.length) {
    const hide = HIDE_TITLES.map(norm);
    COMING.teams.forEach((team) => { team.items = team.items.filter((it) => { const gone = hide.indexOf(norm(it.t)) >= 0; if (gone) window.__roadmapHidden.push(team.key + ' | ' + it.t); return !gone; }); });
  }
  window.__roadmapNoJira = noJira; // cards on the sheet whose row has no Jira link yet: "team | title"
  window.__roadmapUnmatched = unmatched; // board cards with no row on the sheet: "team | title | status | launch | Jira key"
  if (APPLY && DROP_UNMATCHED) {
    if (Object.keys(snap.rows).length < MIN_SHEET_ROWS) window.__roadmapDropSkipped = 'snapshot has only ' + Object.keys(snap.rows).length + ' rows';
    else {
      const gone = new Set(unmatchedItems.map((x) => x[1]));
      COMING.teams.forEach((team) => { team.items = team.items.filter((it) => !gone.has(it)); });
    }
  }

  // "Pulled Sun Nov 8, 1:13 PM ET", in the same style as the A/B page note.
  function pulledAt(createdAt) {
    const d = new Date(String(createdAt).replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00'));
    if (isNaN(d)) return null;
    const q = {}; new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      .formatToParts(d).forEach((x) => { q[x.type] = x.value; });
    return `${q.weekday} ${q.month} ${q.day}, ${q.hour}:${q.minute} ${q.dayPeriod} ET`;
  }
  // The page draws this line itself (comingHtml in app.js reads window.__roadmapNote), so it survives every redraw.
  // It is set only when APPLY is true, because only then is the page actually using the sheet.
  const names = { eta: 'launch dates', s: 'status', imp: 'impact estimates' };
  const when = pulledAt(snap.createdAt);
  window.__roadmapNote = APPLY && when
    ? `Refreshed automatically from the Product Org Dashboard sheet: ${FIELDS.map((f) => names[f] || f).join(', ')}. Pulled ${when}. Everything else on this page is curated by hand.`
    : null;
})();