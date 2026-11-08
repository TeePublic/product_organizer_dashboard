// Browser side. Load right after /api/roadmap-data and before app.js (plain <script> tags).
// Always records what the sheet WOULD change in window.__roadmapDiff (open the console to read it).
// Changes the board, and shows the "pulled from the sheet" note, only when APPLY is true.
(function () {
  const APPLY = false; // flip after reviewing window.__roadmapDiff or the dry run from /api/roadmap-refresh
  const FIELDS = ['eta']; // fields the sheet may change on the board; add 's' and 'imp' later (the note below follows this list)
  const NOTE_ID = 'roadmap-sheet-note'; // an empty <p id="roadmap-sheet-note" hidden></p> placed where the note should appear
  const snap = window.__roadmapSnapshot;
  if (!snap || !snap.rows || typeof COMING === 'undefined') return;
  const jiraOf = (x) => ((x && x.link) || '').match(/[A-Z][A-Z0-9]+-\d+/);
  const byJira = {};
  Object.entries(snap.rows).forEach(([n, r]) => { if (r.jira) (byJira[r.jira] = byJira[r.jira] || []).push(n); });
  const diff = [];
  COMING.teams.forEach((team) => team.items.forEach((item) => {
    const j = jiraOf(item), jn = j && byJira[j[0]] && byJira[j[0]].length === 1 ? byJira[j[0]][0] : null;
    const name = [item.sheet && item.sheet.trim(), jn, item.t].find((n) => n && snap.rows[n]);
    if (!name) return;
    const row = snap.rows[name], p = {};
    if (row.s && row.s !== item.s) p.s = row.s;
    if (row.eta && row.eta !== item.eta) p.eta = row.eta;
    if (item.impSrc === 'Roadmap sheet estimate' && row.imp && row.imp !== item.imp) p.imp = row.imp;
    Object.keys(p).forEach((k) => { if (FIELDS.indexOf(k) < 0) delete p[k]; });
    if (Object.keys(p).length) { diff.push({ item: team.key + '|' + item.t, from: { s: item.s, eta: item.eta, imp: item.imp }, to: p }); if (APPLY) Object.assign(item, p); }
  }));
  window.__roadmapDiff = diff;

  // "Pulled Sun Nov 8, 1:13 PM ET", in the same style as the A/B page note.
  function pulledAt(createdAt) {
    const d = new Date(String(createdAt).replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00'));
    if (isNaN(d)) return null;
    const q = {}; new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      .formatToParts(d).forEach((x) => { q[x.type] = x.value; });
    return `${q.weekday} ${q.month} ${q.day}, ${q.hour}:${q.minute} ${q.dayPeriod} ET`;
  }
  function showNote() {
    const el = document.getElementById(NOTE_ID), when = pulledAt(snap.createdAt);
    if (!el || !when) return;
    const names = { eta: 'launch dates (ETAs)', s: 'status', imp: 'impact estimates' };
    el.textContent = `Refreshed automatically from the Product Org Dashboard sheet: ${FIELDS.map((f) => names[f] || f).join(', ')}. Pulled ${when}. Everything else on this page is curated by hand.`;
    el.hidden = false;
  }
  if (APPLY) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', showNote); else showNote(); }
})();