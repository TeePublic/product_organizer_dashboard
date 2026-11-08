// Pulls the Active Work tab from the sheet (plain code, no AI) and saves it as a roadmap snapshot in Neon.
// /api/roadmap-data serves the newest snapshot to the page. Same switches as refresh-cvr:
//   GET                      = dry run: reads the sheet, reports what the pull found and what it WOULD change on the board; saves nothing
//   POST, saving switched on = saves a snapshot (from the dashboard only)
//   Authorization: Bearer $CRON_SECRET (Vercel cron) = saves too, when saving is switched on. The cron call needs the exemption in middleware.js.
// Saving needs ROADMAP_STORE_ENABLED=1. An unchanged sheet saves nothing, and a failed pull never replaces the last good snapshot.
import { neon } from '@neondatabase/serverless';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { parseCreds, getToken, readTab } from './_roadmap/sheet.js';
import { buildRows, buildPatches } from './_roadmap/transform.js';

export const config = { maxDuration: 60 };
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const KEEP = 60; // snapshots kept (about a month at two pulls a day)

function explain(e) {
  if (e.status === 403 && /has not been used|disabled/i.test(e.message)) return 'The Google Sheets API is switched off in the Cloud project that owns this service account.';
  if (e.status === 403) return 'Google says this account has no access. The sheet is probably not shared with the service account (Viewer is enough).';
  if (e.status === 404) return 'Google cannot find that spreadsheet. Check ROADMAP_SHEET_ID.';
  if (e.status === 'no-tab') return `${e.message}. Check ROADMAP_SHEET_GID.`;
  return e.message;
}

// The curated board file, read only to report what the sheet would change. If it cannot be read, the pull still works.
function loadComing(dir) {
  try { return vm.runInNewContext(fs.readFileSync(path.join(dir, 'roadmap-coming-soon.js'), 'utf8') + '\n;COMING', {}, { timeout: 2000 }); }
  catch { return null; }
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

  let rows;
  try {
    const token = await getToken(parseCreds(env.GOOGLE_SERVICE_ACCOUNT_JSON), deps.fetchImpl);
    const { title, values } = await readTab({ token, sheetId: env.ROADMAP_SHEET_ID, gid: env.ROADMAP_SHEET_GID, fetchImpl: deps.fetchImpl });
    rows = { title, map: buildRows(values) };
  } catch (e) {
    console.error('[roadmap-refresh] pull failed:', e.message);
    return send(200, { ok: false, stored: false, error: explain(e), note: 'The last saved snapshot is unchanged.' });
  }

  const coming = loadComing(deps.dir ?? path.join(process.cwd(), 'data'));
  const diff = coming ? buildPatches(rows.map, coming) : null;
  const report = {
    ok: true, mode: wantStore ? 'store' : 'dry', who: isCron ? 'cron' : wantStore ? 'button' : 'dry run',
    tab: { gid: env.ROADMAP_SHEET_GID, title: rows.title }, sheetRows: Object.keys(rows.map).length,
    board: diff ? { itemsThatWouldChange: diff.changes.length, itemsWithNoSheetRow: diff.unmatched.length, sheetRowsNotOnBoard: diff.notOnBoard.length,
      changes: diff.changes.slice(0, 40), unmatched: diff.unmatched.slice(0, 100) } : 'board file not readable here; skipped',
  };
  if (!storeOn && req.method === 'POST') report.note = 'Saving is switched off (ROADMAP_STORE_ENABLED is not 1), so this was a dry run.';
  if (!wantStore) return send(200, report);

  try {
    const payload = JSON.stringify({ rows: rows.map });
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    await sql`CREATE TABLE IF NOT EXISTS roadmap_snapshots (id bigserial PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), hash text NOT NULL, payload jsonb NOT NULL)`;
    const last = await sql`SELECT hash FROM roadmap_snapshots ORDER BY created_at DESC LIMIT 1`;
    if (last[0]?.hash === hash) return send(200, { ...report, stored: false, unchanged: true });
    const ins = await sql`INSERT INTO roadmap_snapshots (hash, payload) VALUES (${hash}, ${payload}::jsonb) RETURNING id`;
    await sql`DELETE FROM roadmap_snapshots WHERE id NOT IN (SELECT id FROM roadmap_snapshots ORDER BY created_at DESC LIMIT ${KEEP})`;
    return send(200, { ...report, stored: true, snapshotId: Number(ins[0].id) });
  } catch (e) {
    console.error('[roadmap-refresh] save failed:', e.message);
    return send(500, { ...report, ok: false, stored: false, error: 'Pulled the sheet but could not save: ' + e.message });
  }
}