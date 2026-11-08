// Pure, no-LLM transform: sheet cells -> per-project fields -> patches for the existing board.
// Input rows are arrays of { v, link } where v is string | number | null (numbers in date columns are Sheets serials).

const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

// Header text is matched by prefix on whitespace-collapsed text, because the three "Phase" date
// columns share a first line and the headers carry instructions on later lines.
const HEADERS = {
  name: 'project name', roi: 'estimated roi', phase: 'current phase', status: 'status',
  phaseEnd: 'phase end eta', launch: 'est. launch date', jira: 'jira',
};
// Only these columns are ever read. People, Notes, committed flags etc. are never touched.

// Sheet phase/status -> board label. Confirm the starred rows with Mike.
const PHASE_TO_S = {
  'in dev': 'In dev', 'dev done': 'In dev',            // * Dev Done
  'ready for dev': 'Ready for dev', 'discovery/spec': 'Discovery', 'tdd/scoping': 'Scoping',
  'impact analysis': 'Live',                            // * shipped, being measured
  'not started': 'Not started', 'complete': 'Launched', 'deprioritized': 'Paused',
};
const STATUS_OVERRIDE = { paused: 'Paused', blocked: 'Blocked', delayed: 'Delayed' };
const PLACEHOLDER = /^(\$x\b.*|n\/a|tbd|-|—)?$/i;
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function findColumns(headerRow) {
  const cols = {}; const h = headerRow.map((c) => norm(c?.v));
  for (const [key, prefix] of Object.entries(HEADERS)) cols[key] = h.findIndex((x) => x.startsWith(prefix));
  const missing = Object.entries(cols).filter(([, i]) => i < 0).map(([k]) => HEADERS[k]);
  if (missing.length) throw new Error('Header not found in sheet: ' + missing.join(', '));
  return cols;
}

const serialToDate = (n) => new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 864e5);
export function fmtDate(v) {
  if (typeof v === 'number') { const d = serialToDate(v); return `${MON[d.getUTCMonth()]} ${d.getUTCDate()}`; }
  const t = String(v ?? '').trim();
  return PLACEHOLDER.test(t) ? null : t;           // text such as "Q4 '27" passes through unchanged
}

export function boardLabel(phase, status) {
  const st = norm(status), ph = norm(phase);
  if (STATUS_OVERRIDE[st]) return STATUS_OVERRIDE[st];
  if (PHASE_TO_S[ph]) return PHASE_TO_S[ph];
  if (st === 'shipped' || st === 'done') return 'Launched';
  if (st === 'not started') return 'Not started';
  return null;                                     // blank phase and status: leave the board as is
}

export function buildRows(values) {
  const hi = values.findIndex((r) => r.some((c) => norm(c?.v).startsWith(HEADERS.name)));
  if (hi < 0) throw new Error('Header row not found');
  const c = findColumns(values[hi]); const out = {}; const get = (r, k) => r[c[k]];
  for (const r of values.slice(hi + 1)) {
    const name = String(get(r, 'name')?.v ?? '').trim(); if (!name) continue;
    const jc = get(r, 'jira'); const jira = (jc?.link || String(jc?.v ?? '')).match(/[A-Z][A-Z0-9]+-\d+/)?.[0] ?? null;
    const roi = String(get(r, 'roi')?.v ?? '').trim();
    out[name] = {
      s: boardLabel(get(r, 'phase')?.v, get(r, 'status')?.v),
      eta: fmtDate(get(r, 'launch')?.v) ?? fmtDate(get(r, 'phaseEnd')?.v),
      imp: PLACEHOLDER.test(roi) ? null : roi, jira,
      phase: get(r, 'phase')?.v ?? null, status: get(r, 'status')?.v ?? null,
    };
  }
  return out;
}

// Fields the sheet is allowed to change on the board. Add 's' and 'imp' back here when ready.
export const PATCH_FIELDS = ['eta'];

const jiraOf = (item) => String(item.link || '').match(/[A-Z][A-Z0-9]+-\d+/)?.[0] ?? null;

// Join board items to sheet rows: sheet key -> unique Jira key -> title. Returns patches + a reconcile report.
export function buildPatches(rows, coming) {
  const byJira = {}; for (const [n, r] of Object.entries(rows)) if (r.jira) (byJira[r.jira] ??= []).push(n);
  const patches = {}, changes = [], unmatched = [], claimed = new Set();
  for (const team of coming.teams) for (const item of team.items) {
    const cand = [item.sheet?.trim(), byJira[jiraOf(item)]?.length === 1 ? byJira[jiraOf(item)][0] : null, item.t];
    const name = cand.find((n) => n && rows[n]);
    if (!name) { unmatched.push(`${team.key}|${item.t}`); continue; }
    claimed.add(name); const row = rows[name], p = {};
    if (row.s && row.s !== item.s) p.s = row.s;
    if (row.eta && row.eta !== item.eta) p.eta = row.eta;
    if (item.impSrc === 'Roadmap sheet estimate' && row.imp && row.imp !== item.imp) p.imp = row.imp;
    for (const k of Object.keys(p)) if (!PATCH_FIELDS.includes(k)) delete p[k];
    if (Object.keys(p).length) {
      patches[`${team.key}|${item.t}`] = p;
      changes.push({ item: `${team.key}|${item.t}`, sheetRow: name, from: { s: item.s, eta: item.eta, imp: item.imp }, to: p });
    }
  }
  const notOnBoard = Object.entries(rows).filter(([n]) => !claimed.has(n)).map(([n, r]) => ({ name: n, s: r.s, phase: r.phase }));
  return { patches, changes, unmatched, notOnBoard };
}