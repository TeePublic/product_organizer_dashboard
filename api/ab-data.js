// Serves the latest A/B (Redbubble, Amplitude) snapshot from Neon as a small script. index.html loads it AFTER experiments.js and BEFORE
// app.js, so app.js draws the fresh numbers without being edited. It only ever overwrites NUMBERS on tests that already exist in
// experiments.js (matched by id), and only the ones the page really draws:
//   - tests[id]: cvr and primary (used for whole-site impact and labels), and src (where the numbers came from, shown in the Sources box)
//   - reads[id]: m.<metric>.{v,a,b}, vrows (per-version lifts, matched by version name), dev.<desktop|mobile>.{n, <metric>.{v,a,b}, vers}
// Names, hypotheses, calls, notes, formats, verdict words, significance flags (s, c, p, sig), goals and every other hand-written field stay
// exactly as written in the file. If there is no snapshot, the database is slow or down, or the file is newer, it does nothing and the page
// uses experiments.js exactly as before.
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
    var TEST_KEYS = ['cvr', 'primary', 'src'];
    var METRICS = ['rpv', 'cvr', 'aov', 'atc', 'eng'];
    var lists = [EXPS.live || [], EXPS.done || []];
    var ops = [], tests = [], readsPatched = [], unmatched = [];
    function num(x) { return typeof x === 'number' && isFinite(x); }
    function setNum(o, k, v) { if (o && num(v)) ops.push([o, k, v]); }
    function setVLB(target, src) { if (target && src) ['v', 'a', 'b'].forEach(function (f) { setNum(target, f, src[f]); }); }
    Object.keys(S.tests).forEach(function (id) {
      var found = null;
      lists.forEach(function (l) { l.forEach(function (t) { if (String(t.id) === id) found = t; }); });
      if (!found) { unmatched.push(id); return; }
      TEST_KEYS.forEach(function (k) {
        var v = S.tests[id][k]; if (v === undefined) return;
        if (k === 'src') { ops.push([found, k, v]); return; }
        if (found[k] && typeof found[k] === 'object') ['a', 'b', 'rel'].forEach(function (f) { setNum(found[k], f, v[f]); }); // numbers only, so names and formats stay
      });
      tests.push(id);
    });
    Object.keys(S.reads || {}).forEach(function (id) {
      var R = EXPS.reads && EXPS.reads[id], P = S.reads[id];
      if (!R || !P) { if (unmatched.indexOf(id) < 0) unmatched.push(id); return; }
      readsPatched.push(id);
      METRICS.forEach(function (k) { if (R.m && P.m && R.m[k]) setVLB(R.m[k], P.m[k]); });
      (P.vrows || []).forEach(function (pv) {
        var row = (R.vrows || []).filter(function (r) { return r[0] === pv[0]; })[0];
        if (row && row[1] && pv[1]) METRICS.forEach(function (k) { if (row[1][k] !== undefined) setNum(row[1], k, pv[1][k]); });
      });
      ['desktop', 'mobile'].forEach(function (d) {
        var RD = R.dev && R.dev[d], PD = P.dev && P.dev[d]; if (!RD || !PD) return;
        if (Array.isArray(PD.n) && Array.isArray(RD.n)) PD.n.forEach(function (x, i) { if (i < RD.n.length) setNum(RD.n, i, x); });
        METRICS.forEach(function (k) { if (RD[k] && PD[k]) setVLB(RD[k], PD[k]); });
        Object.keys(PD.vers || {}).forEach(function (name) {
          var rv = RD.vers && RD.vers[name]; if (!rv) return;
          METRICS.forEach(function (k) { if (rv[k] !== undefined) setNum(rv, k, PD.vers[name][k]); });
        });
      });
    });
    ops.forEach(function (o) { o[0][o[1]] = o[2]; });
    meta.applied = true; meta.tests = tests; meta.readsPatched = readsPatched; meta.unmatched = unmatched;
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