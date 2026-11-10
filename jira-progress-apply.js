// Fills the progress bar numbers (pts / ptsUnit) on cards from the saved Jira snapshot (window.__jiraProgress).
// Runs after the data files and before app.js. It changes only pts and ptsUnit, and only on cards that already
// have a bar and a Jira link, so the bar's look and app.js stay as they are. With no snapshot it does nothing.
(function applyJiraProgress() {
  var S = window.__jiraProgress;
  if (!S || !S.epics || typeof COMING === 'undefined') return;
  var cards = [].concat.apply(COMING.board || [], (COMING.teams || []).map(function (t) { return t.items || []; }));
  var n = 0;
  cards.forEach(function (it) {
    if (!it || !it.pts || !it.link) return;
    var m = /\b([A-Z][A-Z0-9]+-\d+)\b/.exec(it.link), e = m && S.epics[m[1]];
    if (!e || typeof e.done !== 'number' || typeof e.total !== 'number' || !(e.total > 0)) return;
    it.pts = [e.done, e.total];
    if (e.unit === 'issues') it.ptsUnit = 'issues'; else delete it.ptsUnit;
    n++;
  });
  window.__jiraProgressApplied = { id: S.id, createdAt: S.createdAt, cards: n };
})();