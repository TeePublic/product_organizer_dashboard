// Serves the latest CVR snapshot from Neon as a small script. index.html loads it AFTER the data files and BEFORE app.js,
// so app.js sees the fresh numbers without being edited. If there is no snapshot, the database is slow or down, or the
// data files are newer, it does nothing and the page uses its data files exactly as before.
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let cached = null;
const getSql = () => (cached ??= url ? neon(url) : null);

const empty = (why) => `/* cvr-data: ${why} */\nwindow.__cvrSnapshot = null;\n`;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);

function overlay(s) {
  const json = JSON.stringify(s.payload).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `(function () {
  var S = ${json};
  var meta = { id: ${Number(s.id)}, asOf: ${JSON.stringify(s.asOf)}, createdAt: ${JSON.stringify(s.createdAt)}, applied: false };
  window.__cvrSnapshot = meta;
  try {
    var names = ['D', 'L', 'MAX', 'R', 'ORD'];
    if (!names.every(function (n) { return S[n] && typeof S[n] === 'object'; })) { meta.skipped = 'incomplete snapshot'; return; }
    if (typeof D === 'undefined' || !D.asOf || String(D.asOf) > meta.asOf) { meta.skipped = 'data files are newer'; return; }
    var targets = { D: D, L: L, MAX: MAX, R: R, ORD: ORD };
    names.forEach(function (n) {
      var t = targets[n];
      Object.keys(t).forEach(function (k) { delete t[k]; });
      Object.assign(t, S[n]);
    });
    meta.applied = true;
  } catch (e) { meta.skipped = 'error: ' + e.message; }
})();
`;
}

// The third argument exists only so tests can hand in a fake database; Vercel calls handler(req, res).
export default async function handler(req, res, deps) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  const sql = deps?.sql ?? getSql();
  if (!sql) { res.setHeader('Cache-Control', 'no-store'); return res.status(200).send(empty('no database configured')); }
  try {
    const head = await withTimeout(sql`SELECT id, to_char(as_of, 'YYYY-MM-DD') AS as_of, created_at::text AS created_at FROM cvr_snapshots ORDER BY created_at DESC LIMIT 1`, 2000);
    if (!head.length) { res.setHeader('Cache-Control', 'no-store'); return res.status(200).send(empty('no snapshot yet')); }
    const etag = `"cvr-${head[0].id}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'private, no-cache'); // the browser re-checks every load, so a fresh refresh shows immediately
    if (String(req.headers['if-none-match'] || '').includes(etag)) return res.status(304).end();
    const rows = await withTimeout(sql`SELECT payload FROM cvr_snapshots WHERE id = ${head[0].id}`, 2000);
    if (!rows.length) { res.removeHeader('ETag'); res.setHeader('Cache-Control', 'no-store'); return res.status(200).send(empty('snapshot vanished')); }
    return res.status(200).send(overlay({ id: head[0].id, asOf: head[0].as_of, createdAt: head[0].created_at, payload: rows[0].payload }));
  } catch (e) {
    console.error('cvr-data:', e.message);
    res.removeHeader('ETag');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(empty('unavailable'));
  }
}