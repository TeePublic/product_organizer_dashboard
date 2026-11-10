// Pulls each roadmap epic's progress from Jira (plain code, no AI) and saves it as a snapshot in Neon.
// Same switches as roadmap-refresh:
//   GET                      = dry run: reads Jira, reports what it found and what would change on the cards; saves nothing
//   POST, saving switched on = saves a snapshot (from the dashboard only)
//   Authorization: Bearer $CRON_SECRET (Vercel cron) = saves too, when saving is switched on. The cron call needs the exemption in middleware.js.
// Saving needs JIRA_PROGRESS_STORE_ENABLED=1. A pull with any failed epic is never saved, so the last good snapshot stays.
// Jira access is the Vercel Connect connector jira/product-organizer-jira, signed in once as JIRA_CONNECT_SUBJECT_ID (default dashboard-jira).
import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { epicsFromBoard, openSession, pullAll } from './_jira/progress.js';

export const config = { maxDuration: 60 };
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const KEEP = 60;

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
  if (env.VERCEL_ENV !== 'production' && !deps.getToken) return send(200, { ok: false, note: 'Only runs on the production deployment.' });
  const secret = env.CRON_SECRET;
  const isCron = !!secret && req.headers.authorization === `Bearer ${secret}`;
  const storeOn = env.JIRA_PROGRESS_STORE_ENABLED === '1';
  const wantStore = storeOn && (isCron || req.method === 'POST');
  if (wantStore && !isCron && req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') return send(403, { ok: false, error: 'Saving can only be started from the dashboard itself.' });
  const sql = deps.sql ?? (url ? neon(url) : null);
  if (wantStore && !sql) return send(500, { ok: false, error: 'Saving needs the database, which is not configured.' });

  const coming = loadComing(deps.dir ?? path.join(process.cwd(), 'data'));
  if (!coming) return send(200, { ok: false, error: 'Could not read data/roadmap-coming-soon.js, so there is no list of epics to pull.' });
  const epics = epicsFromBoard(coming);
  const keys = Object.keys(epics);

  let pulled;
  try {
    const getToken = deps.getToken ?? (await import('@vercel/connect')).getToken;
    const session = await openSession({ getToken, subjectId: env.JIRA_CONNECT_SUBJECT_ID || 'dashboard-jira', fetchImpl: deps.fetchImpl });
    pulled = await pullAll(session, keys);
  } catch (e) {
    console.error('[jira-progress] pull failed:', e.message);
    return send(200, { ok: false, stored: false, error: String(e.message).slice(0, 300), note: 'The last saved snapshot is unchanged.' });
  }

  const changed = [], same = [];
  for (const [k, now] of Object.entries(pulled.results)) {
    const old = epics[k];
    const row = { epic: k, cards: old.titles, onCardNow: `${old.pts[0]} of ${old.pts[1]} ${old.unit}`, fromJira: `${now.done} of ${now.total} ${now.unit}`, children: now.children };
    (old.pts[0] === now.done && old.pts[1] === now.total && old.unit === now.unit ? same : changed).push(row);
  }
  const failed = pulled.errors;
  const report = { ok: !Object.keys(failed).length, mode: wantStore ? 'store' : 'dry', who: isCron ? 'cron' : wantStore ? 'button' : 'dry run',
    epics: keys.length, pulled: Object.keys(pulled.results).length, failed, wouldChange: changed.length, unchanged: same.length, changed };
  if (!storeOn && req.method === 'POST') report.note = 'Saving is switched off (JIRA_PROGRESS_STORE_ENABLED is not 1), so this was a dry run.';
  if (!wantStore) return send(200, report);
  if (Object.keys(failed).length) return send(200, { ...report, stored: false, note: 'Some epics failed, so nothing was saved. The last good snapshot is unchanged.' });

  try {
    const payload = JSON.stringify({ epics: pulled.results });
    await sql`CREATE TABLE IF NOT EXISTS jira_progress_snapshots (id bigserial PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), payload jsonb NOT NULL)`;
    const ins = await sql`INSERT INTO jira_progress_snapshots (payload) VALUES (${payload}::jsonb) RETURNING id`;
    await sql`DELETE FROM jira_progress_snapshots WHERE id NOT IN (SELECT id FROM jira_progress_snapshots ORDER BY created_at DESC LIMIT ${KEEP})`;
    console.log('[jira-progress] saved snapshot ' + ins[0].id + ' by ' + report.who + '; epics ' + report.pulled + '; cards that would change ' + report.wouldChange);
    return send(200, { ...report, stored: true, snapshotId: Number(ins[0].id) });
  } catch (e) {
    console.error('[jira-progress] save failed:', e.message);
    return send(500, { ...report, ok: false, stored: false, error: 'Pulled Jira but could not save: ' + e.message });
  }
}