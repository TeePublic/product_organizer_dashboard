// Serves the latest A/B (Redbubble, Amplitude Experiment) snapshot from Neon as a small script. index.html loads it AFTER
// experiments.js and BEFORE app.js, so app.js sees the fresh numbers without being edited. It only ever writes the numeric
// fields listed in TEST_KEYS / READ_KEYS onto tests that already exist in experiments.js, matched by id. Names, hypotheses,
// calls, owners, dates and links stay exactly as written in the file. If there is no snapshot, the database is slow or down,
// or the file is newer, it does nothing and the page uses experiments.js exactly as before.
import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let cached = null;
const getSql = () => (cached ??= url ? neon(url) : null);

const empty = (why) => `/* ab-data: ${why} */\nwindow.__abSnapshot = null;\n`;
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);

function overlay(s) {
  const json = JSON.stringify(s.payload).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `(function () {
  var S = ${json};
  var meta = { id: ${Number(s.id)}, asOf: ${JSON.stringify(s.asOf)}, createdAt: ${JSON.stringify(s.createdAt)}, applied: false };
  window.__abSnapshot = meta;
  try {
    if (!S || typeof S.tests !== 'object' || S.tests === null) { meta.skipped = 'incomplete snapshot'; return; }
    if (typeof EXPS === 'undefined') { meta.skipped = 'EXPS missing'; return; }
    if (typeof EXPS.asOfISO === 'string' && EXPS.asOfISO > meta.asOf) { meta.skipped = 'data file is newer'; return; }
    var TEST_KEYS = ['n', 'cvr', 'primary', 'sec', 'variants', 'reach', 'p', 'sig'];
    var READ_KEYS = ['dev', 'm'];
    var lists = [EXPS.live || [], EXPS.done || []];
    var ops = [], tests = [], unmatched = [];
    Object.keys(S.tests).forEach(function (id) {
      var found = null;
      lists.forEach(function (l) { l.forEach(function (t) { if (String(t.id) === id) found = t; }); });
      if (!found) { unmatched.push(id); return; }
      TEST_KEYS.forEach(function (k) { if (S.tests[id][k] !== undefined) ops.push([found, k, S.tests[id][k]]); });
      tests.push(id);
    });
    Object.keys(S.reads || {}).forEach(function (id) {
      var r = EXPS.reads && EXPS.reads[id];
      if (!r) { if (unmatched.indexOf(id) < 0) unmatched.push(id); return; }
      READ_KEYS.forEach(function (k) { if (S.reads[id][k] !== undefined) ops.push([r, k, S.reads[id][k]]); });
    });
    ops.forEach(function (o) { o[0][o[1]] = o[2]; });
    meta.applied = true; meta.tests = tests; meta.unmatched = unmatched;
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
    const head = await withTimeout(sql`SELECT id, to_char(as_of, 'YYYY-MM-DD') AS as_of, created_at::text AS created_at FROM ab_snapshots ORDER BY created_at DESC LIMIT 1`, 2000);
    if (!head.length) { res.setHeader('Cache-Control', 'no-store'); return res.status(200).send(empty('no snapshot yet')); }
    const etag = `"ab-${head[0].id}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'private, no-cache'); // the browser re-checks every load, so a fresh refresh shows immediately
    if (String(req.headers['if-none-match'] || '').includes(etag)) return res.status(304).end();
    const rows = await withTimeout(sql`SELECT payload FROM ab_snapshots WHERE id = ${head[0].id}`, 2000);
    if (!rows.length) { res.removeHeader('ETag'); res.setHeader('Cache-Control', 'no-store'); return res.status(200).send(empty('snapshot vanished')); }
    return res.status(200).send(overlay({ id: head[0].id, asOf: head[0].as_of, createdAt: head[0].created_at, payload: rows[0].payload }));
  } catch (e) {
    console.error('ab-data:', e.message);
    res.removeHeader('ETag');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(empty('unavailable'));
  }
}