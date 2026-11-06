// The refresh endpoint. One call = one ROUND of a refresh (the button or the cron keeps calling until it says done).
//   GET                      = dry run (reads Amplitude, builds in memory, reports; saves nothing)
//   POST, saving switched on = saves a snapshot when the last round finishes
//   Authorization: Bearer $CRON_SECRET (Vercel cron) = saves too, when saving is switched on. A cron call never starts a new refresh
//   if one was saved in the last hour, so several cron entries can safely share the job of finishing one.
// Add  ?run=<id>  to continue a refresh that is already in progress. It sits behind the Okta sign-in; the cron call needs the exemption in middleware.js.
import { neon } from '@neondatabase/serverless';
import path from 'node:path';
import { runRound } from './_refresh/run.js';

export const config = { maxDuration: 300 };
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export default async function handler(req, res, deps) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const send = (code, body) => res.status(code).send(JSON.stringify(body, null, 2));
  if (req.method !== 'GET' && req.method !== 'POST') return send(405, { ok: false, error: 'Use GET for a dry run.' });
  if (process.env.VERCEL_ENV !== 'production' && !deps) return send(200, { ok: false, note: 'Only runs on the production deployment (the Amplitude keys exist only there).' });
  const secret = process.env.CRON_SECRET;
  const isCron = !!secret && req.headers.authorization === `Bearer ${secret}`;
  const storeOn = process.env.REFRESH_STORE_ENABLED === '1';
  const wantStore = storeOn && (isCron || req.method === 'POST');
  if (wantStore && !isCron && req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') return send(403, { ok: false, error: 'Saving can only be started from the dashboard itself.' });
  const runId = Number(req.query?.run) || null;
  try {
    const report = await runRound({ mode: wantStore ? 'store' : 'dry', runId, who: isCron ? 'cron' : wantStore ? 'button' : 'dry run', ...(isCron ? { cooldownMin: Number(process.env.CRON_COOLDOWN_MIN || 60) } : {}), sql: deps?.sql ?? (url ? neon(url) : null), dir: deps?.dir ?? path.join(process.cwd(), 'data'), ...(deps?.run ?? {}) });
    console.log('[refresh] report ' + JSON.stringify(report).slice(0, 14000)); // so the finished report can be read in the Vercel logs, not only in the browser tab
    if (!storeOn && req.method === 'POST') report.note = `${report.note ?? ''} Saving is switched off (REFRESH_STORE_ENABLED is not 1), so this was a dry run.`.trim();
    return send(report.refused ? 409 : 200, report);
  } catch (e) {
    console.error('refresh-cvr failed:', e.message);
    return send(500, { ok: false, error: e.message });
  }
}