// The refresh endpoint. GET = dry run (reads Amplitude, builds in memory, reports; saves nothing).
// POST with REFRESH_STORE_ENABLED=1 = also saves a snapshot. It sits behind the Okta sign-in like the rest of the site.
import { neon } from '@neondatabase/serverless';
import path from 'node:path';
import { runRefresh } from './_refresh/run.js';

export const config = { maxDuration: 300 };
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export default async function handler(req, res, deps) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const send = (code, body) => res.status(code).send(JSON.stringify(body, null, 2));
  if (req.method !== 'GET' && req.method !== 'POST') return send(405, { ok: false, error: 'Use GET for a dry run.' });
  if (process.env.VERCEL_ENV !== 'production' && !deps) return send(200, { ok: false, note: 'Only runs on the production deployment (the Amplitude keys exist only there).' });
  const storeOn = process.env.REFRESH_STORE_ENABLED === '1';
  const wantStore = req.method === 'POST' && storeOn;
  if (wantStore && req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') return send(403, { ok: false, error: 'Saving can only be started from the dashboard itself.' });
  try {
    const report = await runRefresh({ mode: wantStore ? 'store' : 'dry', who: wantStore ? 'button' : 'dry run', sql: deps?.sql ?? (url ? neon(url) : null), dir: deps?.dir ?? path.join(process.cwd(), 'data'), ...(deps?.run ?? {}) });
    console.log('[refresh] report ' + JSON.stringify(report).slice(0, 14000)); // so the finished report can be read in the Vercel logs, not only in the browser tab
    if (req.method === 'POST' && !storeOn) report.note = `${report.note ?? ''} Saving is switched off (REFRESH_STORE_ENABLED is not 1), so this was a dry run.`.trim();
    return send(report.refused ? 409 : 200, report);
  } catch (e) {
    console.error('refresh-cvr failed:', e.message);
    return send(500, { ok: false, error: e.message });
  }
}