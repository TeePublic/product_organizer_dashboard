// Pure, no-LLM transform: sheet cells -> one record per filled sheet row (the page builds a card from each).
// Input rows are arrays of { v, link } where v is string | number | null (numbers in date columns are Sheets serials).
// The sheet decides which cards exist. Nothing here looks at the hand-kept board file.

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

// Header text is matched by prefix on whitespace-collapsed text, because the headers carry instructions on later lines.
// REQUIRED columns must exist or the pull fails (and the last good snapshot stays). OPTIONAL ones are saved when found and reported when missing.
export const HEADERS = {
  name: 'project name', team: 'team', brand: 'brand', pillar: 'pillar', phase: 'current phase', status: 'status',
  phaseEnd: 'phase end eta', launch: 'est. launch date', jira: 'jira',
  roi: 'estimated roi', okr: 'okr', goal: 'goal', pm: 'pm', phaseStart: 'phase start date', phaseUpdated: 'phase updated eta',
};
const OPTIONAL = new Set(['roi', 'okr', 'goal', 'pm', 'phaseStart', 'phaseUpdated']);
// Only these columns are ever read. Committed flags, size, notes, exec stakeholder and the rest are never touched.

// Sheet Team -> the page's team key. Contractors, a blank Team and any value not listed here map to null: those rows are kept
// in the snapshot but the page hides them until someone assigns a team (Jay, Nov 10).
export const TEAM_KEYS = {
  'core': 'core', 'content & search': 'search', 'customer': 'customer', 'customer (tiger)': 'tiger', 'plc': 'plc', 'de': 'de',
  'dashery': 'dashery', 'artist': 'artist', 'app': 'artist', 'infra': 'infra', 'martech': 'martech',
};
// Sheet Brand -> the page's site pill. The page has four pills; the two all-brand values use "Both" for now (Jay, Nov 10: change later).
export const SITE_KEYS = {
  'rbo': 'RB', 'tpo': 'TP', 'rbo + tpo': 'Both', 'dashery': 'Dashery', 'articore (all brands)': 'Both', 'rbo + tpo + dashery': 'Both',
};

// Sheet phase -> board label. Mike confirmed: Dev Done = In QA; Impact Analysis and Complete = Live; Code review and Ready to ship = In dev.
const PHASE_TO_S = {
  'in dev': 'In dev', 'code review': 'In dev', 'ready to ship': 'In dev', 'dev done': 'In QA',
  'ready for dev': 'Ready for dev', 'discovery/spec': 'Discovery', 'tdd/scoping': 'Scoping',
  'impact analysis': 'Live', 'complete': 'Live',
  'not started': 'Not started', 'deprioritized': 'Paused',
};
const STATUS_OVERRIDE = { paused: 'Paused', blocked: 'Blocked', delayed: 'Delayed' };
const STATUS_DONE = new Set(['shipped', 'done']); // Jay, Nov 10: Shipped or Done wins over an earlier phase (Dev Done + Shipped = Live)
const PLACEHOLDER = /^(\$x\b.*|n\/a|tbd|-|—)?$/i;
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function findColumns(headerRow) {
  const cols = {}; const h = headerRow.map((c) => norm(c?.v));
  for (const [key, prefix] of Object.entries(HEADERS)) cols[key] = h.findIndex((x) => x.startsWith(prefix));
  const missing = Object.entries(cols).filter(([k, i]) => i < 0 && !OPTIONAL.has(k)).map(([k]) => HEADERS[k]);
  if (missing.length) throw new Error('Header not found in sheet: ' + missing.join(', '));
  return cols;
}

const serialToDate = (n) => new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 864e5);
export function fmtDate(v, thisYear = new Date().getUTCFullYear()) {
  // Dates in another year keep the year ("Mar 31, 2027"), so they cannot be mistaken for a date this year.
  if (typeof v === 'number') { const d = serialToDate(v); return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}${d.getUTCFullYear() === thisYear ? '' : ', ' + d.getUTCFullYear()}`; }
  const t = String(v ?? '').trim();
  return PLACEHOLDER.test(t) ? null : t;           // text such as "Q4 '27" passes through unchanged
}

// Paused, Blocked and Delayed win; then Shipped or Done (Live); then the phase. A row with no usable phase or status returns null,
// and the page shows it as "Not Set".
export function boardLabel(phase, status) {
  const st = norm(status), ph = norm(phase);
  if (STATUS_OVERRIDE[st]) return STATUS_OVERRIDE[st];
  if (STATUS_DONE.has(st)) return 'Live';
  if (PHASE_TO_S[ph]) return PHASE_TO_S[ph];
  if (st === 'not started') return 'Not started';
  return null;
}

// Rows kept off the board (Jay, Nov 12): Current Phase "Deprioritized" or Status "Paused" (or "Deprioritized"). They stay in the snapshot, so the sheet is still the full record,
// but the page draws no card for them. roadmap-apply.js applies the same rule to the saved rows; keep the two in step.
export function offBoardReason(row) {
  if (norm(row.phase) === 'deprioritized') return 'Deprioritized';
  const st = norm(row.status);
  if (st === 'paused' || st === 'deprioritized') return st === 'paused' ? 'Paused' : 'Deprioritized';
  return null;
}

// "🛒 CVR" -> "CVR": the Pillar is the card's goal, shown without its emoji.
export const stripLead = (s) => String(s ?? '').replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+/g, ' ').trim();

const text = (c) => String(c?.v ?? '').trim();

// One record per sheet row that has a Project Name, in sheet order. Duplicate names are all kept (the row number tells them apart).
export function buildRows(values) {
  const hi = values.findIndex((r) => r.some((c) => norm(c?.v).startsWith(HEADERS.name)));
  if (hi < 0) throw new Error('Header row not found');
  const c = findColumns(values[hi]); const get = (r, k) => (c[k] >= 0 ? r[c[k]] : undefined);
  const out = [];
  values.slice(hi + 1).forEach((r, i) => {
    const name = text(get(r, 'name')); if (!name) return;
    const jc = get(r, 'jira'); const jira = (jc?.link || String(jc?.v ?? '')).match(/[A-Z][A-Z0-9]+-\d+/)?.[0] ?? null;
    const roi = text(get(r, 'roi'));
    const team = text(get(r, 'team')), brand = text(get(r, 'brand'));
    out.push({
      row: hi + 2 + i,                                   // the row number on the sheet tab
      name, team, teamKey: TEAM_KEYS[norm(team)] ?? null,
      brand, site: SITE_KEYS[norm(brand)] ?? null,
      okr: text(get(r, 'okr')) || null, pillar: stripLead(text(get(r, 'pillar'))) || null, goal: text(get(r, 'goal')) || null,
      pm: text(get(r, 'pm')) || null,
      phase: text(get(r, 'phase')) || null, status: text(get(r, 'status')) || null,
      s: boardLabel(get(r, 'phase')?.v, get(r, 'status')?.v),
      phaseStart: fmtDate(get(r, 'phaseStart')?.v), phaseEnd: fmtDate(get(r, 'phaseEnd')?.v), phaseUpdated: fmtDate(get(r, 'phaseUpdated')?.v),
      launch: fmtDate(get(r, 'launch')?.v),
      eta: fmtDate(get(r, 'launch')?.v) ?? fmtDate(get(r, 'phaseEnd')?.v),   // Est. Launch Date, else Phase End ETA
      imp: PLACEHOLDER.test(roi) ? null : roi, jira,
    });
  });
  return out;
}

// What the dry run reports: the numbers that show whether the board will match the sheet.
export function summarize(rows) {
  const byTeam = {}, byStatus = {}, names = {};
  for (const r of rows) { const k = r.team || '(blank)'; byTeam[k] = (byTeam[k] || 0) + 1; (names[r.name] ??= []).push(r.row); const st = r.s || 'Not Set'; byStatus[st] = (byStatus[st] || 0) + 1; }
  const list = (f) => rows.filter(f).map((r) => `row ${r.row}: ${r.name}`);
  return {
    filledRows: rows.length,
    cardsOnPage: rows.filter((r) => r.teamKey && !offBoardReason(r)).length,
    hiddenUntilAssigned: list((r) => !r.teamKey && !offBoardReason(r)),
    offBoard: rows.filter((r) => offBoardReason(r)).map((r) => `row ${r.row}: ${r.name} (${offBoardReason(r)})`),
    noStatus: list((r) => !r.s).length,
    noStatusRows: list((r) => !r.s).slice(0, 60),
    noJira: rows.filter((r) => !r.jira).length,
    noBrandMatch: list((r) => !r.site),
    noPillar: rows.filter((r) => !r.pillar).length,
    duplicateNames: Object.entries(names).filter(([, v]) => v.length > 1).map(([n, v]) => `${n} (rows ${v.join(', ')})`),
    byTeam, byStatus,
    // The Pre-peak list on the page leaves out Live cards and cards dated 2027 or Q1 (see preList and LATE in app.js); these are the counts behind that.
    notInPrePeakList: rows.filter((r) => r.teamKey && !offBoardReason(r) && (r.s === 'Live' || /2027|Q1|Jan /.test(r.eta || ''))).length,
  };
}
