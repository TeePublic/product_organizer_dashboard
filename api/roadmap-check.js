// Read-only check: can the dashboard read the Active Work tab, and are the columns where we expect them?
// Stores nothing, changes nothing. Sits behind the same sign-in as the rest of the dashboard.
import { parseCreds, getToken, readTab } from './_roadmap/sheet.js';
import { HEADERS } from './_roadmap/transform.js';

export const config = { maxDuration: 30 };

// Matched on whitespace-collapsed header text, by prefix, because the headers carry instructions on later lines.
const WANT = HEADERS; // the same list the pull uses, so this check can never drift from it
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const letter = (i) => String.fromCharCode(65 + i);
const JIRA = /[A-Z][A-Z0-9]+-\d+/;

function explain(e) {
  if (e.status === 403 && /has not been used|disabled/i.test(e.message)) return 'The Google Sheets API is switched off in the Cloud project that owns this service account. Enable it under APIs & Services, then Library.';
  if (e.status === 403) return 'Google says this account has no access. The sheet is probably not shared with the service account yet (Viewer is enough).';
  if (e.status === 404) return 'Google cannot find that spreadsheet. Check ROADMAP_SHEET_ID.';
  if (e.status === 'no-tab') return `${e.message}. Check ROADMAP_SHEET_GID.`;
  return e.message;
}

export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const send = (code, body) => res.status(code).send(JSON.stringify(body, null, 2));
  if (req.method !== 'GET') return send(405, { ok: false, error: 'Use GET.' });
  if (process.env.VERCEL_ENV !== 'production' && !deps.fetchImpl) return send(200, { ok: false, note: 'Only runs on the production deployment (the Google variables exist only there).' });
  const env = deps.env || process.env;
  const missing = ['GOOGLE_SERVICE_ACCOUNT_JSON', 'ROADMAP_SHEET_ID', 'ROADMAP_SHEET_GID'].filter((k) => !env[k]);
  if (missing.length) return send(200, { ok: false, error: 'Missing variables (redeploy after adding them): ' + missing.join(', ') });
  try {
    const creds = parseCreds(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const token = await getToken(creds, deps.fetchImpl);
    const { title, values } = await readTab({ token, sheetId: env.ROADMAP_SHEET_ID, gid: env.ROADMAP_SHEET_GID, fetchImpl: deps.fetchImpl });
    const hi = values.findIndex((r) => r.some((c) => norm(c.v).startsWith(WANT.name)));
    if (hi < 0) return send(200, { ok: false, tab: { gid: env.ROADMAP_SHEET_GID, title }, error: 'Read the tab, but found no header row starting with "Project Name".', firstRows: values.slice(0, 3).map((r) => r.slice(0, 6).map((c) => norm(c.v).slice(0, 30))) });
    const header = values[hi];
    const cols = {}; for (const [k, p] of Object.entries(WANT)) { const i = header.findIndex((c) => norm(c.v).startsWith(p)); cols[k] = i < 0 ? 'NOT FOUND' : `${letter(i)}: ${norm(header[i].v).slice(0, 40)}`; }
    const idx = (k) => header.findIndex((c) => norm(c.v).startsWith(WANT[k]));
    const body = values.slice(hi + 1).filter((r) => String(r[idx('name')]?.v ?? '').trim());
    const jc = idx('jira');
    const withJira = jc < 0 ? 0 : body.filter((r) => JIRA.test(r[jc]?.link || String(r[jc]?.v ?? ''))).length;
    return send(200, {
      ok: !Object.values(cols).includes('NOT FOUND'), serviceAccount: creds.client_email, scope: 'read-only',
      tab: { gid: env.ROADMAP_SHEET_GID, title }, headerRow: hi + 1, columns: cols,
      projectRows: body.length, rowsWithJira: withJira,
      sampleNames: body.slice(0, 3).map((r) => String(r[idx('name')].v).trim()),
      allHeaders: header.map((c, i) => `${letter(i)}: ${norm(c.v).slice(0, 40)}`).filter((s) => !s.endsWith(': ')),
    });
  } catch (e) { return send(200, { ok: false, error: explain(e) }); }
}