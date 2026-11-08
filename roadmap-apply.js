// Browser side. Load right after /api/roadmap-data and before app.js (plain <script> tags).
// Always records what the sheet WOULD change in window.__roadmapDiff (open the console to read it); changes the board only when APPLY is true.
(function () {
  const APPLY = false; // flip after reviewing window.__roadmapDiff or the dry run from /api/roadmap-refresh
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
    if (Object.keys(p).length) { diff.push({ item: team.key + '|' + item.t, from: { s: item.s, eta: item.eta, imp: item.imp }, to: p }); if (APPLY) Object.assign(item, p); }
  }));
  window.__roadmapDiff = diff;
})();