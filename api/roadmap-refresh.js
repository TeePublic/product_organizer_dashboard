// Pulls the Active Work tab from the sheet (plain code, no AI) and saves it as a roadmap snapshot in Neon.
// The snapshot holds one record per filled sheet row (name, team, brand, goal, PM, phase dates, status, launch date, Jira). The page builds its cards from it.
// /api/roadmap-data serves the newest snapshot to the page. Same switches as refresh-cvr:
//   GET                      = dry run: reads the sheet and reports what the pull found (row counts, rows with no status, rows hidden until a team is set); saves nothing
//   POST, saving switched on = saves a snapshot (from the dashboard only)
//   Authorization: Bearer $CRON_SECRET (Vercel cron) = saves too, when saving is switched on. The cron call needs the exemption in middleware.js.
// Saving needs ROADMAP_STORE_ENABLED=1. Every successful pull is saved, so a snapshot's time is when the sheet was last read (the page shows it). A failed pull never replaces the last good snapshot.
import { neon } from '@neondatabase/serverless';
import { parseCreds, getToken, readTab } from './_roadmap/sheet.js';
import { buildRows, summarize } from './_roadmap/transform.js';

export const config = { maxDuration: 60 };
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const KEEP = 60; // snapshots kept (about a month at two pulls a day)
const MIN_GAP_MIN = 60; // the button saves at most one pull an hour (same as the Amplitude button) for everyone (each save is a snapshot, and only the last KEEP are kept)

function explain(e) {
  if (e.status === 403 && /has not been used|disabled/i.test(e.message)) return 'The Google Sheets API is switched off in the Cloud project that owns this service account.';
  if (e.status === 403) return 'Google says this account has no access. The sheet is probably not shared with the service account (Viewer is enough).';
  if (e.status === 404) return 'Google cannot find that spreadsheet. Check ROADMAP_SHEET_ID.';
  if (e.status === 'no-tab') return `${e.message}. Check ROADMAP_SHEET_GID.`;
  return e.message;
}

export default async function handler(req, res, deps = {}) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const send = (code, body) => res.status(code).send(JSON.stringify(body, null, 2));
  if (req.method !== 'GET' && req.method !== 'POST') return send(405, { ok: false, error: 'Use GET for a dry run.' });
  const env = deps.env || process.env;
  if (env.VERCEL_ENV !== 'production' && !deps.fetchImpl) return send(200, { ok: false, note: 'Only runs on the production deployment (the Google variables exist only there).' });
  const secret = env.CRON_SECRET;
  const isCron = !!secret && req.headers.authorization === `Bearer ${secret}`;
  const storeOn = env.ROADMAP_STORE_ENABLED === '1';
  const wantStore = storeOn && (isCron || req.method === 'POST');
  if (wantStore && !isCron && req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') return send(403, { ok: false, error: 'Saving can only be started from the dashboard itself.' });
  const missing = ['GOOGLE_SERVICE_ACCOUNT_JSON', 'ROADMAP_SHEET_ID', 'ROADMAP_SHEET_GID'].filter((k) => !env[k]);
  if (missing.length) return send(200, { ok: false, error: 'Missing variables (redeploy after adding them): ' + missing.join(', ') });
  const sql = deps.sql ?? (url ? neon(url) : null);
  if (wantStore && !sql) return send(500, { ok: false, error: 'Saving needs the database, which is not configured.' });

  if (wantStore && !isCron) {
    try { // a pull saved in the last few minutes already holds the sheet as it is now: say so without reading the sheet again
      const last = await sql`SELECT created_at FROM roadmap_snapshots ORDER BY created_at DESC LIMIT 1`;
      const at = last[0] && (last[0].created_at instanceof Date ? last[0].created_at : new Date(String(last[0].created_at).replace(' ', 'T').replace(/([+-]\d\d)$/, '$1:00')));
      if (at && !isNaN(at) && Date.now() - at.getTime() < MIN_GAP_MIN * 60000) return send(200, { ok: true, mode: 'store', who: 'button', stored: false, refused: 'recent', lastPulled: last[0].created_at, note: `The sheet was already pulled in the last hour.` });
    } catch (e) { /* no table yet: the first save creates it */ }
  }
  let rows;
  try {
    const token = await getToken(parseCreds(env.GOOGLE_SERVICE_ACCOUNT_JSON), deps.fetchImpl);
    const { title, values } = await readTab({ token, sheetId: env.ROADMAP_SHEET_ID, gid: env.ROADMAP_SHEET_GID, fetchImpl: deps.fetchImpl });
    rows = { title, list: buildRows(values) };
  } catch (e) {
    console.error('[roadmap-refresh] pull failed:', e.message);
    return send(200, { ok: false, stored: false, error: explain(e), note: 'The last saved snapshot is unchanged.' });
  }

  const sheet = summarize(rows.list);
  const report = {
    ok: true, mode: wantStore ? 'store' : 'dry', who: isCron ? 'cron' : wantStore ? 'button' : 'dry run',
    tab: { gid: env.ROADMAP_SHEET_GID, title: rows.title }, sheetRows: rows.list.length, sheet,
  };
  if (!storeOn && req.method === 'POST') report.note = 'Saving is switched off (ROADMAP_STORE_ENABLED is not 1), so this was a dry run.';
  if (!wantStore) return send(200, report);

  try {
    const payload = JSON.stringify({ v: 2, rows: rows.list }); // v2: an array of row records (v1 was a map by project name)
    await sql`CREATE TABLE IF NOT EXISTS roadmap_snapshots (id bigserial PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), payload jsonb NOT NULL)`;
    const ins = await sql`INSERT INTO roadmap_snapshots (payload) VALUES (${payload}::jsonb) RETURNING id`;
    await sql`DELETE FROM roadmap_snapshots WHERE id NOT IN (SELECT id FROM roadmap_snapshots ORDER BY created_at DESC LIMIT ${KEEP})`;
    console.log('[roadmap-refresh] saved snapshot ' + ins[0].id + ' by ' + report.who + '; sheet rows ' + report.sheetRows + '; cards on page ' + sheet.cardsOnPage + '; hidden until a team is set ' + sheet.hiddenUntilAssigned.length + '; no status ' + sheet.noStatus); // readable in the Vercel logs after a cron run
    return send(200, { ...report, stored: true, snapshotId: Number(ins[0].id) });
  } catch (e) {
    console.error('[roadmap-refresh] save failed:', e.message);
    return send(500, { ...report, ok: false, stored: false, error: 'Pulled the sheet but could not save: ' + e.message });
  }
}