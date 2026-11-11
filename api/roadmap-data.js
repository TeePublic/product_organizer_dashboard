// Serves the latest roadmap snapshot (the sheet's Active Work rows) from Neon as a small script.
// index.html loads it after the data files and before app.js. It ONLY sets window.__roadmapSnapshot.
// It does not touch COMING or any other dataset: roadmap-apply.js reads window.__roadmapSnapshot and builds the cards.
// v is the snapshot format: 2 = an array of sheet-row records. An older snapshot (no v, a map by name) is served as is and ignored by roadmap-apply.js.
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let cached = null;
const getSql = () => (cached ??= url ? neon(url) : null);

const empty = (why) => `/* roadmap-data: ${why} */\nwindow.__roadmapSnapshot = null;\n`;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);

function expose(s) {
  const json = JSON.stringify({ id: Number(s.id), createdAt: s.createdAt, v: s.payload?.v ?? 1, rows: s.payload?.rows ?? [] })
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `window.__roadmapSnapshot = ${json};\n`;
}

// The third argument exists only so tests can hand in a fake database; Vercel calls handler(req, res).
export default async function handler(req, res, deps) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  const sql = deps?.sql ?? getSql();
  if (!sql) { res.setHeader('Cache-Control', 'no-store'); return res.status(200).send(empty('no database configured')); }
  try {
    const head = await withTimeout(sql`SELECT id, created_at::text AS created_at FROM roadmap_snapshots ORDER BY created_at DESC LIMIT 1`, 2000);
    if (!head.length) { res.setHeader('Cache-Control', 'no-store'); return res.status(200).send(empty('no snapshot yet')); }
    const etag = `"roadmap-${head[0].id}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'private, no-cache'); // the browser re-checks every load, so a fresh pull shows immediately
    if (String(req.headers?.['if-none-match'] || '').includes(etag)) return res.status(304).end();
    const rows = await withTimeout(sql`SELECT payload FROM roadmap_snapshots WHERE id = ${head[0].id}`, 2000);
    if (!rows.length) { res.removeHeader('ETag'); res.setHeader('Cache-Control', 'no-store'); return res.status(200).send(empty('snapshot vanished')); }
    return res.status(200).send(expose({ id: head[0].id, createdAt: head[0].created_at, payload: rows[0].payload }));
  } catch (e) {
    console.error('roadmap-data:', e.message);
    res.removeHeader('ETag');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(empty('unavailable'));
  }
}