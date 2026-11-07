// The A/B tab's refresh. Builds the snapshot from the Amplitude Analytics API (Redbubble key pair), the same way refresh-cvr.js is used:
//   GET                                   = dry run: pulls, builds in memory, reports, saves nothing
//   POST (from the dashboard itself) and AB_STORE_ENABLED=1 = saves the snapshot to Neon (table ab_snapshots), with a lock and a cooldown
// Production only (behind the Okta sign-in), keys never printed. POST with AB_STORE_ENABLED unset behaves as a dry run and says so.
//
// How a test's numbers are produced (the method verified in steps 4b/4c on the cart test): users are tagged with their variant through the
// user property "[Experiment] <flag key>". Exposed = unique exposure events per variant, buyers = unique order_completed users, revenue and
// orders = sums over the window. These run a few percent high against the Experiment screen (the same on every variant), so lifts are
// reliable to about half a point and levels are approximate. Significance is NOT computed: verdicts stay with Amplitude (hand-updated).
//
// Add a test by adding one entry below. `showLevels: false` is for tests whose counts are known not to match (see step 4f).
import { neon } from '@neondatabase/serverless';

const BASE = 'https://amplitude.com/api/2';
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const MANIFEST = {
  '1580138': {
    flag: 'rb-cart-upsell', name: 'Sticker cross-sell in the cart', start: '20261029', showLevels: true,
    // First entry is control. `label` is what the page shows (as in experiments.js). The first non-control variant fills the a/b columns.
    variants: [{ key: 'control' }, { key: 'cross-sell', label: 'Cross-sell, all badges' }, { key: 'cross-sell-trimmed-badges', label: 'Cross-sell, fewer badges' }],
    primary: { name: 'Revenue per user', metric: 'rpu' },
    // Existing secondary rows on the page are patched by name (a, b and rel only), so Mike's notes and formats stay.
    secPatch: { 'Sitewide CVR (people in test)': 'cvr', 'Order value': 'aov' },
  },
};

// What the Experiment screen reported for 1580138 through Nov 6, used only as a regression check against the verified method.
const CHECK = { '1580138': { end: '20261106', rpuLift: { 'cross-sell': 0.0060250, 'cross-sell-trimmed-badges': 0.0118916 }, aovLift: { 'cross-sell': 0.0052866, 'cross-sell-trimmed-badges': 0.0163855 } } };

const send = (res, code, body) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json; charset=utf-8'); return res.status(code).send(JSON.stringify(body, null, 2)); };
const sum = (a) => (Array.isArray(a) ? a : []).reduce((x, y) => x + (Number(y) || 0), 0);
const rel = (v, c) => (typeof v === 'number' && typeof c === 'number' && c !== 0 ? v / c - 1 : null);
const r4 = (x) => (typeof x === 'number' ? +x.toFixed(6) : null);
const ymd = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
const iso = (s) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One call. A 429 (Amplitude's concurrent-query limit) is retried after a short wait.
async function call(fetchFn, auth, path, pairs, ms, retryWait) {
  const qs = pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  let last;
  for (let attempt = 0; attempt < 3; attempt++) {
    const t = Date.now(); const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetchFn(`${BASE}${path}?${qs}`, { headers: { Authorization: auth, Accept: 'application/json' }, signal: ctl.signal });
      const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
      last = { status: r.status, ms: Date.now() - t, json, retries: attempt, message: json ? (json.error || json.message) : text.slice(0, 200) };
    } catch (e) { last = { status: 0, ms: Date.now() - t, retries: attempt, message: e.name === 'AbortError' ? `timeout after ${ms} ms` : e.message }; }
    finally { clearTimeout(timer); }
    if (last.status !== 429) return last;
    await sleep(retryWait * (attempt + 1));
  }
  return last;
}
async function pool(jobs, limit, deadline) {
  let next = 0; const out = new Array(jobs.length);
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (next < jobs.length) { const i = next++; out[i] = Date.now() > deadline ? { status: 0, ms: 0, retries: 0, message: 'skipped: out of time' } : await jobs[i](); }
  }));
  return out;
}

export default async function handler(req, res, deps) {
  try { return await run(req, res, deps); } catch (e) {
    const env = deps?.env ?? process.env; let msg = String((e && e.stack) || e);
    for (const k of [env.AMPLITUDE_RB_API_KEY, env.AMPLITUDE_RB_SECRET_KEY]) if (k) msg = msg.split(k).join('***');
    return send(res, 500, { error: 'ab-refresh crashed', detail: msg.slice(0, 1500) });
  }
}

async function run(req, res, deps) {
  if (req.method !== 'GET' && req.method !== 'POST') return send(res, 405, { ok: false, error: 'Use GET for a dry run.' });
  const env = deps?.env ?? process.env;
  if (env.VERCEL_ENV !== 'production') return send(res, 403, { error: 'Production only' });
  const key = env.AMPLITUDE_RB_API_KEY, secret = env.AMPLITUDE_RB_SECRET_KEY;
  if (!key || !secret) return send(res, 200, { keysPresent: { AMPLITUDE_RB_API_KEY: !!key, AMPLITUDE_RB_SECRET_KEY: !!secret }, error: 'a key is missing for this environment' });

  const q = req.query || {};
  const storeOn = env.AB_STORE_ENABLED === '1';
  const wantStore = storeOn && req.method === 'POST';
  if (wantStore && req.headers?.['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') return send(res, 403, { ok: false, error: 'Saving can only be started from the dashboard itself.' });
  if (wantStore && q.end) return send(res, 400, { ok: false, error: 'end can only be set on a dry run; a saved refresh always ends on the last full day.' });
  const now = deps?.now ? deps.now() : new Date();
  const yesterday = ymd(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1)));
  const end = String(q.end || yesterday);
  if (!/^\d{8}$/.test(end)) return send(res, 400, { error: 'end must be YYYYMMDD' });
  const only = q.test ? String(q.test) : null;
  if (only && !MANIFEST[only]) return send(res, 400, { error: 'unknown test', known: Object.keys(MANIFEST) });

  // Saving: take the lock and respect the cooldown BEFORE spending any Amplitude queries.
  const sql = deps?.sql ?? (dbUrl ? neon(dbUrl) : null);
  const cooldownMin = Number(env.AB_COOLDOWN_MIN || 5); let locked = false;
  const release = async () => { if (locked && sql) { try { await sql`UPDATE ab_refresh_lock SET started_at = NULL WHERE id = 1`; } catch { /* the lock expires on its own after 3 minutes */ } locked = false; } };
  if (wantStore) {
    if (!sql) return send(res, 500, { ok: false, error: 'no database configured' });
    const recent = await sql`SELECT id, created_at::text AS created_at FROM ab_snapshots WHERE created_at > now() - make_interval(mins => ${cooldownMin}::int) ORDER BY created_at DESC LIMIT 1`;
    if (recent.length) return send(res, 409, { ok: false, refused: true, error: `A snapshot was saved less than ${cooldownMin} minutes ago (id ${recent[0].id}). Try again later.` });
    const got = await sql`UPDATE ab_refresh_lock SET started_at = now(), started_by = ${'button'} WHERE id = 1 AND (started_at IS NULL OR started_at < now() - interval '3 minutes') RETURNING id`;
    if (!got.length) return send(res, 409, { ok: false, refused: true, error: 'A refresh is already running.' });
    locked = true;
  }
  try {
  const started = Date.now(); const fetchFn = deps?.fetch ?? fetch; const auth = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
  const callMs = deps?.callMs ?? 20000, retryWait = deps?.retryWait ?? 1500, budgetMs = deps?.budgetMs ?? 50000;

  const ids = only ? [only] : Object.keys(MANIFEST);
  const plan = []; // { id, label, path, pairs }
  const skipped = {};
  for (const id of ids) {
    const t = MANIFEST[id];
    if (end < t.start) { skipped[id] = `window not started (starts ${iso(t.start)})`; continue; }
    const seg = (v) => JSON.stringify([{ prop: `gp:[Experiment] ${t.flag}`, op: 'is', values: [v] }]);
    const ev = (event_type, extra = {}) => JSON.stringify({ event_type, ...extra });
    plan.push({ id, label: 'exposed', path: '/events/segmentation', pairs: [['e', JSON.stringify({ event_type: '[Experiment] Exposure', filters: [{ subprop_type: 'event', subprop_key: '[Experiment] Flag Key', subprop_op: 'is', subprop_value: [t.flag] }], group_by: [{ type: 'event', value: '[Experiment] Variant' }] })], ['m', 'uniques'], ['i', '30'], ['start', t.start], ['end', end], ['limit', '20']] });
    for (const v of t.variants) {
      plan.push({ id, label: `revenue:${v.key}`, path: '/events/segmentation', pairs: [['e', ev('order_completed', { group_by: [{ type: 'event', value: 'transaction_amount_usd' }] })], ['m', 'sums'], ['i', '1'], ['start', t.start], ['end', end], ['s', seg(v.key)]] });
      plan.push({ id, label: `orders:${v.key}`, path: '/events/segmentation', pairs: [['e', ev('order_completed')], ['m', 'totals'], ['i', '1'], ['start', t.start], ['end', end], ['s', seg(v.key)]] });
      plan.push({ id, label: `buyers:${v.key}`, path: '/events/segmentation', pairs: [['e', ev('order_completed')], ['m', 'uniques'], ['i', '30'], ['start', t.start], ['end', end], ['s', seg(v.key)]] });
    }
  }
  // Two at a time: Amplitude rejects some queries (429) when more run at once.
  const results = await pool(plan.map((p) => () => call(fetchFn, auth, p.path, p.pairs, callMs, retryWait)), 2, started + budgetMs);

  const tests = {}; const perTest = {}; const errors = {}; const pulledAt = (deps?.now ? deps.now() : new Date()).toISOString();
  for (const id of ids) {
    if (skipped[id]) continue;
    const t = MANIFEST[id]; const mine = plan.map((p, i) => ({ p, r: results[i] })).filter((x) => x.p.id === id);
    const get = (label) => mine.find((x) => x.p.label === label)?.r;
    const failed = mine.filter((x) => x.r.status !== 200);
    perTest[id] = { calls: mine.length, retries: mine.reduce((s, x) => s + (x.r.retries || 0), 0), slowestMs: Math.max(0, ...mine.map((x) => x.r.ms)) };
    if (failed.length) { errors[id] = failed.map((x) => ({ call: x.p.label, status: x.r.status, message: x.r.message })); continue; }

    const ex = get('exposed'); const exposed = {};
    const names = (Array.isArray(ex.json?.data?.seriesLabels) ? ex.json.data.seriesLabels : []).map((l) => (Array.isArray(l) ? l[l.length - 1] : String(l)));
    (Array.isArray(ex.json?.data?.series) ? ex.json.data.series : []).forEach((arr, i) => { exposed[names[i]] = (exposed[names[i]] || 0) + sum(arr); });
    const raw = {};
    for (const v of t.variants) {
      const rev = sum(get(`revenue:${v.key}`).json?.data?.series?.[0]), ord = sum(get(`orders:${v.key}`).json?.data?.series?.[0]), buy = sum(get(`buyers:${v.key}`).json?.data?.series?.[0]), exp = exposed[v.key] ?? null;
      raw[v.key] = { exposed: exp, buyers: buy, orders: ord, revenue: +rev.toFixed(2), cvr: exp ? buy / exp : null, rpu: exp ? rev / exp : null, aov: ord ? rev / ord : null };
    }
    const control = raw[t.variants[0].key]; const others = t.variants.slice(1); const first = others[0];
    if (control.exposed == null || others.some((v) => raw[v.key].exposed == null)) { errors[id] = [{ call: 'exposed', message: 'a variant has no exposed users in the response' }]; continue; }
    const lift = (m, v) => rel(raw[v.key][m], control[m]);
    const col = (m) => ({ a: r4(control[m]), b: r4(raw[first.key][m]), rel: r4(lift(m, first)) });
    const levels = (m) => (t.showLevels ? col(m) : { rel: r4(lift(m, first)) });
    const secPatch = {}; for (const [rowName, m] of Object.entries(t.secPatch || {})) secPatch[rowName] = levels(m);
    tests[id] = {
      n: others.reduce((s, v) => s + raw[v.key].exposed, control.exposed),
      cvr: levels('cvr'),
      primary: { name: t.primary.name, ...levels(t.primary.metric) },
      variants: others.map((v) => [v.label, r4(lift(t.primary.metric, v))]),
      secPatch,
      src: {
        source: 'Amplitude Analytics API (Redbubble project 774278)', method: 'users tagged with their experiment variant', pulledAt,
        window: `${iso(t.start)} to ${iso(end)}`, approximate: true, levelsShown: !!t.showLevels,
        note: 'Counts run a few percent above the Experiment screen, equally on every variant. Verdicts and significance come from Amplitude Experiment and are updated by hand.',
      },
    };
    const chk = CHECK[id];
    perTest[id].rawByVariant = raw;
    if (chk && chk.end === end) perTest[id].regressionVsExperimentScreen = Object.fromEntries(others.map((v) => [v.key, { rpuLift: r4(lift('rpu', v)), experimentRpuLift: chk.rpuLift[v.key], aovLift: r4(lift('aov', v)), experimentAovLift: chk.aovLift[v.key] }]));
  }

  const report = { ok: true, mode: wantStore ? 'store' : 'dry', asOf: iso(end), timing: { totalMs: Date.now() - started, calls: plan.length, concurrency: 2 }, wouldSave: { asOf: iso(end), tests }, skipped, errors, perTest };
  if (req.method === 'POST' && !storeOn) report.note = 'Saving is switched off (AB_STORE_ENABLED is not 1), so this was a dry run.';
  if (wantStore) {
    if (!Object.keys(tests).length) { report.ok = false; report.saved = null; report.error = 'Nothing to save: no test pulled successfully.'; console.log('[ab-refresh] ' + JSON.stringify(report).slice(0, 14000)); return send(res, 502, report); }
    const note = `button · tests: ${Object.keys(tests).join(',')} · errors: ${Object.keys(errors).length ? Object.keys(errors).join(',') : 'none'}`;
    const row = await sql`INSERT INTO ab_snapshots (as_of, payload, note) VALUES (${iso(end)}::date, ${JSON.stringify({ asOf: iso(end), tests })}::jsonb, ${note}) RETURNING id, created_at::text AS created_at`;
    report.saved = { id: row[0].id, createdAt: row[0].created_at };
  }
  console.log('[ab-refresh] ' + JSON.stringify(report).slice(0, 14000));
  return send(res, 200, report);
  } finally { await release(); }
}