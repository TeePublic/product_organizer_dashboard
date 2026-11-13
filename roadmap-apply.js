// Browser side. Load right after /api/roadmap-data and before app.js (plain <script> tags).
// The sheet decides which cards exist: every filled Active Work row becomes one card, in sheet order, under the team the row names.
// There is no matching by title or Jira key any more. A row added to the sheet appears at the next pull; a row removed from the sheet disappears.
// data/roadmap-coming-soon.js still supplies the team headings and, where a card's sheet name is exactly the old card's `sheet:` (or title), its text.
// What the page did before is recorded in window.__roadmapDiff (open the console to read it): cards added, cards removed, and status or date changes.
(function () {
  const APPLY = true;       // false shows the data file exactly as written (the old board)
  const KEEP_TEXT = true;   // carry the hand-written description (d), why, tags and Jira progress (pts) from the old card with the same sheet name
  const JIRA_BASE = 'https://articore.atlassian.net/browse/';
  const NO_JIRA_NOTE = 'No Jira ticket is linked on the sheet row yet. Reach out to the PM.'; // shown where the card's source is drawn
  const NO_STATUS = 'Not Set'; // rows with a blank phase and status
  const MIN_SHEET_ROWS = 20;         // safety: never rebuild the board from a snapshot with fewer rows than this (a bad or empty pull)
  const snap = window.__roadmapSnapshot;
  if (!snap || typeof COMING === 'undefined') return;
  // Only the v2 snapshot (an array of row records) can build the board. An older snapshot leaves the data file's board as it is.
  if (!Array.isArray(snap.rows)) { window.__roadmapSkipped = 'snapshot is the old format; the data file board is shown'; return; }
  if (snap.rows.length < MIN_SHEET_ROWS) { window.__roadmapSkipped = 'snapshot has only ' + snap.rows.length + ' rows'; return; }

  const jiraOf = (x) => ((x && x.link) || '').match(/[A-Z][A-Z0-9]+-\d+/);
  function isoET(createdAt) {
    const d = new Date(String(createdAt).replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00'));
    return isNaN(d) ? null : new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(d);
  }
  const pulledOn = isoET(snap.createdAt);

  // The old board, read once: text and a before-picture for the diff. Keyed by the exact sheet name (or the exact title when a card has no sheet name).
  const oldKey = (it) => String(it.sheet || it.t || '').trim();
  const old = {};
  COMING.teams.forEach((team) => team.items.forEach((it) => { old[oldKey(it)] = { team: team.key, it }; }));

  const teams = {}; COMING.teams.forEach((t) => { teams[t.key] = t; });
  // Infrastructure has rows on the sheet but no heading in the data file; this is the heading app.js used when it created one.
  if (!teams.infra && snap.rows.some((r) => r.teamKey === 'infra')) {
    teams.infra = { key: 'infra', name: 'Infrastructure', icon: '🏗️', tagline: 'Platform and tooling consolidation across the sites.', items: [] };
    COMING.teams.push(teams.infra);
  }
  const fresh = {}; Object.keys(teams).forEach((k) => { fresh[k] = []; });
  const added = [], changed = [], hidden = [], offBoard = [], noJira = [], seen = new Set();
  // Jay, Nov 12: a row whose Current Phase is Deprioritized, or whose Status is Paused, gets no card. (Same rule as offBoardReason in api/_roadmap/transform.js.)
  const lc = (x) => String(x || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const offReason = (r) => (lc(r.phase) === 'deprioritized' ? 'Deprioritized' : (lc(r.status) === 'paused' ? 'Paused' : (lc(r.status) === 'deprioritized' ? 'Deprioritized' : null)));
  let withText = 0, noStatus = 0;

  snap.rows.forEach((r) => {
    const off = offReason(r); if (off) { offBoard.push('row ' + r.row + ' | ' + (r.team || '(no team)') + ' | ' + r.name + ' | ' + off); return; }
    if (!r.teamKey || !teams[r.teamKey]) { hidden.push('row ' + r.row + ' | ' + (r.team || '(no team)') + ' | ' + r.name); return; } // hidden until a team is set on the sheet
    const prev = old[String(r.name).trim()];
    seen.add(String(r.name).trim());
    const it = {
      t: r.name, sheet: r.name, e: '', obj: r.pillar || '', site: r.site || '', s: r.s || NO_STATUS, eta: r.eta || '',
      sheetRow: r.row,
    };
    if (!r.s) noStatus++;
    if (r.imp) { it.imp = r.imp; it.impSrc = 'Roadmap sheet estimate'; }
    // The Jira link comes from the sheet row only. No link there means the card says to ask the PM.
    if (r.jira) it.link = JIRA_BASE + r.jira;
    else { it.noJira = true; it.jiraNote = NO_JIRA_NOTE; noJira.push(teams[r.teamKey].key + ' | ' + r.name); }
    if (KEEP_TEXT && prev) {
      const o = prev.it; let any = false;
      ['d', 'why', 'tags'].forEach((k) => { if (o[k] != null && o[k] !== '') { it[k] = o[k]; any = true; } });
      // Progress points belong to the Jira epic they were read from: keep them only while the sheet row still points at that epic.
      const oj = jiraOf(o);
      if (o.pts && oj && r.jira && oj[0] === r.jira) { it.pts = o.pts; if (o.ptsUnit) it.ptsUnit = o.ptsUnit; }
      if (any) withText++;
    }
    it.sheetSrc = { on: pulledOn, phase: r.phase, status: r.status, jira: r.jira || null, s: !!r.s, eta: r.eta || null, noJira: !r.jira, note: r.jira ? null : NO_JIRA_NOTE,
      row: r.row, team: r.team, brand: r.brand, okr: r.okr, goal: r.goal, pm: r.pm, phaseStart: r.phaseStart, phaseEnd: r.phaseEnd, phaseUpdated: r.phaseUpdated };
    fresh[r.teamKey].push(it);
    // The sheet's PM column is the card's Product Manager (the PM filter and the pop-up read it from PEOPLE, keyed by title).
    if (APPLY && r.pm && typeof PEOPLE !== 'undefined') PEOPLE[r.name] = Object.assign({}, PEOPLE[r.name], { pm: r.pm });
    if (!prev) added.push(r.teamKey + ' | ' + r.name);
    else if (prev.it.s !== it.s || (prev.it.eta || '') !== it.eta || prev.team !== r.teamKey) changed.push({ item: r.teamKey + ' | ' + r.name, from: { team: prev.team, s: prev.it.s, eta: prev.it.eta }, to: { team: r.teamKey, s: it.s, eta: it.eta } });
  });
  const removed = Object.keys(old).filter((k) => !seen.has(k)).map((k) => old[k].team + ' | ' + old[k].it.t);

  window.__roadmapDiff = { added, removed, changed };   // what the sheet changed against the data file's board
  window.__roadmapOffBoard = offBoard;                  // paused or deprioritized rows kept off the page: "row | team | name | reason"
  window.__roadmapHidden = hidden;                      // sheet rows kept off the page until a team is set: "row | team | name"
  window.__roadmapNoJira = noJira;                      // cards whose sheet row has no Jira link yet: "team | title"
  window.__roadmapBuilt = { sheetRows: snap.rows.length, cards: snap.rows.length - hidden.length - offBoard.length, hiddenUntilTeamSet: hidden.length, offBoard: offBoard.length, noStatus, noJira: noJira.length, withHandWrittenText: withText };
  if (APPLY) Object.keys(teams).forEach((k) => { teams[k].items = fresh[k]; });

  // Jay, Nov 12: the Post-peak list in the data file (COMING.post, which feeds Next Half) is hand-kept and is not on the sheet, so it showed projects the sheet no longer has.
  // The sheet decides what exists: those cards are dropped. A post-peak entry that matches a sheet row by name only lends its hand-written description to that row's card.
  const postDropped = [];
  if (APPLY && Array.isArray(COMING.post)) {
    const byName = {}; Object.keys(fresh).forEach((k) => fresh[k].forEach((it) => { byName[lc(it.sheet || it.t)] = it; }));
    COMING.post.forEach((p) => { const m = byName[lc(p.sheet || p.t)]; if (m) { if (!m.d && p.d) m.d = p.d; } else postDropped.push((p.team || '') + ' | ' + p.t); });
    COMING.post = [];
  }
  window.__roadmapPostDropped = postDropped;            // hand-kept Post-peak entries with no row on the sheet: "team | title"

  // "Pulled Sun Nov 8, 1:13 PM ET", in the same style as the A/B page note.
  function pulledAt(createdAt) {
    const d = new Date(String(createdAt).replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00'));
    if (isNaN(d)) return null;
    const q = {}; new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      .formatToParts(d).forEach((x) => { q[x.type] = x.value; });
    return `${q.weekday} ${q.month} ${q.day}, ${q.hour}:${q.minute} ${q.dayPeriod} ET`;
  }
  // The page draws this line itself (comingHtml in app.js reads window.__roadmapNote), so it survives every redraw.
  const when = pulledAt(snap.createdAt);
  window.__roadmapNote = APPLY && when
    ? `Built from the Product Org Dashboard sheet: every project row, with its team, brand, goal, status and launch date. Pulled ${when}. Project descriptions are written by hand and may lag the sheet.`
    : null;
})();
