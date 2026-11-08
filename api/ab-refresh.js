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
    // First entry is control. `label` is the version name the page already uses (it must match experiments.js exactly).
    // The first non-control variant fills the main a/b columns, as it does on the page today.
    variants: [{ key: 'control' }, { key: 'cross-sell', label: 'Cross-sell, all badges' }, { key: 'cross-sell-trimmed-badges', label: 'Cross-sell, fewer badges' }],
    primary: { name: 'Revenue per user', metric: 'rpu' },
    metrics: ['rpv', 'cvr', 'aov'], // the page's names: revenue per user, CVR, add-to-cart rate (atc), AOV. Only the ones the page shows for this test.
    // The page's rows draw desktop and mobile from the user property below (checked in the dry run; see deviceCoverage).
    devices: { prop: 'gp:cloudflare_device_type', values: { desktop: 'desktop', mobile: 'mobile' } },
  },
  '1569370': {
    flag: 'rb-pdp-style-picker', name: 'T-shirt style pills on product pages', start: '20261027', showLevels: true,
    variants: [{ key: 'control' }, { key: 'treatment', label: 'Style pills' }], // one treatment: the page keeps no per-version table for it
    primary: { name: 'Revenue per user', metric: 'rpu' },
    metrics: ['rpv', 'cvr', 'atc', 'aov'],
    devices: { prop: 'gp:cloudflare_device_type', values: { desktop: 'desktop', mobile: 'mobile' } },
  },
};

// What the Experiment screen reported for 1580138 through Nov 6, used only as a regression check against the verified method.
const CHECK = { '1580138': { end: '20261106', rpuLift: { 'cross-sell': 0.0060250, 'cross-sell-trimmed-badges': 0.0118916 }, aovLift: { 'cross-sell': 0.0052866, 'cross-sell-trimmed-badges': 0.0163855 } } };

// The same kind of check for the pills test: what the Experiment analysis reported through Nov 7 (cumulative, read through the Amplitude connector).
// Its CVR here is the PDP CVR metric (product-page view, then an order within a day); the page itself shows Sitewide CVR, so those two can differ a little.
const CHECK2 = {
  '1569370': {
    end: '20261107', source: 'Experiment analysis, Oct 27 to Nov 7 (cumulative). CVR reference = PDP CVR (page view of a product page, then an order within a day); the page shows Sitewide CVR.',
    counts: { control: { exposed: 561642, revenue: 608339.77, orders: 12800, atcUsers: 27421, pdpConverters: 11998 }, treatment: { exposed: 577920, revenue: 630392.32, orders: 12737, atcUsers: 20413, pdpConverters: 12025 } },
    lifts: { treatment: { rpv: 0.007063, atc: -0.276539, cvr: -0.02598, aov: 0.041376 } },
  },
};

// What the page showed for the desktop / mobile split (Experiment screen, read by Mike through Nov 5): control's device share, and the first
// variant's lift per device. The dry run lines the API's device numbers up against these as a sanity check only.
const CHECK_DEV = {
  '1580138': { desktop: { share: 0.3104, rpv: -0.0201, cvr: 0.0091, aov: -0.0311 }, mobile: { share: 0.6896, rpv: 0.0197, cvr: -0.0014, aov: 0.0206 } },
  '1569370': { desktop: { share: 0.7558, rpv: -0.0342, atc: -0.2405, cvr: -0.0336, aov: 0.0287 }, mobile: { share: 0.2442, rpv: 0.0461, atc: -0.2289, cvr: 0.0102, aov: 0.0386 } },
};

const send = (res, code, body) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json; charset=utf-8'); return res.status(code).send(JSON.stringify(body, null, 2)); };
const sum = (a) => (Array.isArray(a) ? a : []).reduce((x, y) => x + (Number(y) || 0), 0);
const pct = (v, r) => (typeof v === 'number' && typeof r === 'number' && r !== 0 ? +((v / r - 1) * 100).toFixed(2) : null);
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
  const release = async () => { if (locked && sql) { try { await sql`UPDATE ab_refresh_lock SET started_at = NULL WHERE id = 1`; } catch { /* the lock expires on its own after 5 minutes */ } locked = false; } };
  if (wantStore) {
    if (!sql) return send(res, 500, { ok: false, error: 'no database configured' });
    const recent = await sql`SELECT id, created_at::text AS created_at FROM ab_snapshots WHERE created_at > now() - make_interval(mins => ${cooldownMin}::int) ORDER BY created_at DESC LIMIT 1`;
    if (recent.length) return send(res, 409, { ok: false, refused: true, error: `A snapshot was saved less than ${cooldownMin} minutes ago (id ${recent[0].id}). Try again later.` });
    const got = await sql`UPDATE ab_refresh_lock SET started_at = now(), started_by = ${'button'} WHERE id = 1 AND (started_at IS NULL OR started_at < now() - interval '5 minutes') RETURNING id`;
    if (!got.length) return send(res, 409, { ok: false, refused: true, error: 'A refresh is already running.' });
    locked = true;
  }
  try {
  const started = Date.now(); const fetchFn = deps?.fetch ?? fetch; const auth = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
  const callMs = deps?.callMs ?? 20000, retryWait = deps?.retryWait ?? 1500, budgetMs = deps?.budgetMs ?? 150000;

  const ids = only ? [only] : Object.keys(MANIFEST);
  const plan = []; // { id, scope, kind, vkey, path, pairs }
  const skipped = {};
  for (const id of ids) {
    const t = MANIFEST[id];
    if (end < t.start) { skipped[id] = `window not started (starts ${iso(t.start)})`; continue; }
    const scopes = [{ key: 'all', cond: null }].concat(Object.entries(t.devices?.values || {}).map(([k, val]) => ({ key: k, cond: { prop: t.devices.prop, op: 'is', values: [val] } })));
    const ev = (event_type, extra = {}) => JSON.stringify({ event_type, ...extra });
    for (const sc of scopes) {
      const seg = (v) => JSON.stringify([{ prop: `gp:[Experiment] ${t.flag}`, op: 'is', values: [v] }].concat(sc.cond ? [sc.cond] : []));
      plan.push({ id, scope: sc.key, kind: 'exposed', path: '/events/segmentation', pairs: [['e', JSON.stringify({ event_type: '[Experiment] Exposure', filters: [{ subprop_type: 'event', subprop_key: '[Experiment] Flag Key', subprop_op: 'is', subprop_value: [t.flag] }], group_by: [{ type: 'event', value: '[Experiment] Variant' }] })], ['m', 'uniques'], ['i', '30'], ['start', t.start], ['end', end], ['limit', '20'], ...(sc.cond ? [['s', JSON.stringify([sc.cond])]] : [])] });
      for (const v of t.variants) {
        plan.push({ id, scope: sc.key, kind: 'revenue', vkey: v.key, path: '/events/segmentation', pairs: [['e', ev('order_completed', { group_by: [{ type: 'event', value: 'transaction_amount_usd' }] })], ['m', 'sums'], ['i', '1'], ['start', t.start], ['end', end], ['s', seg(v.key)]] });
        plan.push({ id, scope: sc.key, kind: 'orders', vkey: v.key, path: '/events/segmentation', pairs: [['e', ev('order_completed')], ['m', 'totals'], ['i', '1'], ['start', t.start], ['end', end], ['s', seg(v.key)]] });
        plan.push({ id, scope: sc.key, kind: 'buyers', vkey: v.key, path: '/events/segmentation', pairs: [['e', ev('order_completed')], ['m', 'uniques'], ['i', '30'], ['start', t.start], ['end', end], ['s', seg(v.key)]] });
        if ((t.metrics || []).includes('atc')) plan.push({ id, scope: sc.key, kind: 'atc', vkey: v.key, path: '/events/segmentation', pairs: [['e', ev('product_added')], ['m', 'uniques'], ['i', '30'], ['start', t.start], ['end', end], ['s', seg(v.key)]] });
      }
    }
  }
  // Two at a time: Amplitude rejects some queries (429) when more run at once.
  const results = await pool(plan.map((p) => () => call(fetchFn, auth, p.path, p.pairs, callMs, retryWait)), 2, started + budgetMs);

  const tests = {}; const readsOut = {}; const perTest = {}; const errors = {}; const pulledAt = (deps?.now ? deps.now() : new Date()).toISOString();
  for (const id of ids) {
    if (skipped[id]) continue;
    const t = MANIFEST[id]; const mine = plan.map((p, i) => ({ p, r: results[i] })).filter((x) => x.p.id === id);
    const failed = mine.filter((x) => x.r.status !== 200);
    perTest[id] = { calls: mine.length, retries: mine.reduce((s, x) => s + (x.r.retries || 0), 0), slowestMs: Math.max(0, ...mine.map((x) => x.r.ms)) };
    if (failed.length) { errors[id] = failed.map((x) => ({ call: `${x.p.scope}:${x.p.kind}${x.p.vkey ? ':' + x.p.vkey : ''}`, status: x.r.status, message: x.r.message })); continue; }
    const get = (scope, kind, vkey) => mine.find((x) => x.p.scope === scope && x.p.kind === kind && x.p.vkey === vkey)?.r;

    const scopeKeys = [...new Set(mine.map((x) => x.p.scope))]; const rawByScope = {}; let bad = null;
    for (const sc of scopeKeys) {
      const ex = get(sc, 'exposed'); const exposed = {};
      const names = (Array.isArray(ex.json?.data?.seriesLabels) ? ex.json.data.seriesLabels : []).map((l) => (Array.isArray(l) ? l[l.length - 1] : String(l)));
      (Array.isArray(ex.json?.data?.series) ? ex.json.data.series : []).forEach((arr, i) => { exposed[names[i]] = (exposed[names[i]] || 0) + sum(arr); });
      const raw = {};
      for (const v of t.variants) {
        const rev = sum(get(sc, 'revenue', v.key).json?.data?.series?.[0]), ord = sum(get(sc, 'orders', v.key).json?.data?.series?.[0]), buy = sum(get(sc, 'buyers', v.key).json?.data?.series?.[0]), exp = exposed[v.key] ?? null;
        const atcU = (t.metrics || []).includes('atc') ? sum(get(sc, 'atc', v.key).json?.data?.series?.[0]) : null;
        raw[v.key] = { exposed: exp, buyers: buy, orders: ord, revenue: +rev.toFixed(2), atcUsers: atcU, cvr: exp ? buy / exp : null, rpu: exp ? rev / exp : null, aov: ord ? rev / ord : null, atc: exp && atcU != null ? atcU / exp : null };
      }
      if (t.variants.some((v) => !raw[v.key].exposed)) { bad = `${sc}: a variant has no exposed users in the response`; break; }
      rawByScope[sc] = raw;
    }
    if (bad) { errors[id] = [{ call: 'exposed', message: bad }]; continue; }

    const others = t.variants.slice(1); const first = others[0]; const ctrl = t.variants[0].key;
    // The page's names for the metrics: rpv = revenue per user, cvr, aov.
    const MAPALL = { rpv: 'rpu', cvr: 'cvr', atc: 'atc', aov: 'aov' }; const MAP = Object.fromEntries((t.metrics || ['rpv', 'cvr', 'aov']).map((k) => [k, MAPALL[k]]));
    const lifts = (raw, v) => Object.fromEntries(Object.entries(MAP).map(([pk, rk]) => [pk, r4(rel(raw[v.key][rk], raw[ctrl][rk]))]));
    const metricCols = (raw) => Object.fromEntries(Object.entries(MAP).map(([pk, rk]) => [pk, t.showLevels ? { v: r4(rel(raw[first.key][rk], raw[ctrl][rk])), a: r4(raw[ctrl][rk]), b: r4(raw[first.key][rk]) } : { v: r4(rel(raw[first.key][rk], raw[ctrl][rk])) }]));
    const all = rawByScope.all; const cvrCol = metricCols(all).cvr; const prim = metricCols(all)[t.primary.metric === 'rpu' ? 'rpv' : t.primary.metric];
    tests[id] = {
      cvr: { ...(t.showLevels ? { a: cvrCol.a, b: cvrCol.b } : {}), rel: cvrCol.v },
      primary: { name: t.primary.name, ...(t.showLevels ? { a: prim.a, b: prim.b } : {}), rel: prim.v },
      src: {
        source: 'Amplitude Analytics API (Redbubble project 774278)', method: 'users tagged with their experiment variant', pulledAt,
        window: `${iso(t.start)} to ${iso(end)}`, approximate: true, levelsShown: !!t.showLevels,
        note: 'Counts run a few percent above the Experiment screen, equally on every variant. Verdicts and significance come from Amplitude Experiment and are updated by hand.',
      },
    };
    const reads = { m: metricCols(all) }; const several = others.length > 1; // a per-version table exists on the page only for tests with several versions
    if (several) reads.vrows = others.map((v) => [v.label, lifts(all, v)]);
    const dev = {};
    for (const d of Object.keys(t.devices?.values || {})) {
      const raw = rawByScope[d]; if (!raw) continue;
      dev[d] = { n: [raw[ctrl].exposed, raw[first.key].exposed], ...metricCols(raw), ...(several ? { vers: Object.fromEntries(others.map((v) => [v.label, lifts(raw, v)])) } : {}) };
    }
    if (Object.keys(dev).length) reads.dev = dev;
    readsOut[id] = reads;

    perTest[id].rawByScope = rawByScope;
    if (t.devices) {
      perTest[id].deviceCoverage = Object.fromEntries(t.variants.map((v) => [v.key, r4((Object.keys(t.devices.values).reduce((s, d) => s + (rawByScope[d]?.[v.key]?.exposed || 0), 0)) / all[v.key].exposed)]));
      const cd = CHECK_DEV[id];
      if (cd) perTest[id].deviceSanityVsFile = Object.fromEntries(Object.keys(t.devices.values).map((d) => {
        const dl = lifts(rawByScope[d], first); const row = { controlShare: r4(rawByScope[d][ctrl].exposed / all[ctrl].exposed), fileShare: cd[d]?.share };
        for (const m of Object.keys(MAP)) if (cd[d]?.[m] !== undefined) { row[`${m}Lift`] = dl[m]; row[`file_${m}Lift`] = cd[d][m]; }
        return [d, row];
      }));
    }
    const c2 = CHECK2[id];
    if (c2 && c2.end === end) {
      const countsDiffPct = {}, liftCompare = {};
      for (const v of t.variants) { const r = all[v.key], ref = c2.counts[v.key]; if (ref) countsDiffPct[v.key] = { exposedPct: pct(r.exposed, ref.exposed), revenuePct: pct(r.revenue, ref.revenue), ordersPct: pct(r.orders, ref.orders), atcUsersPct: pct(r.atcUsers, ref.atcUsers), buyersVsPdpConvertersPct: pct(r.buyers, ref.pdpConverters) }; }
      for (const v of others) { const l = lifts(all, v); liftCompare[v.key] = Object.fromEntries(Object.keys(MAP).map((m) => [m, { ours: l[m], experiment: c2.lifts[v.key]?.[m] }])); }
      perTest[id].referenceCheck = { source: c2.source, countsDiffPct, liftCompare };
    }
    const chk = CHECK[id];
    if (chk && chk.end === end) perTest[id].regressionVsExperimentScreen = Object.fromEntries(others.map((v) => [v.key, { rpuLift: lifts(all, v).rpv, experimentRpuLift: chk.rpuLift[v.key], aovLift: lifts(all, v).aov, experimentAovLift: chk.aovLift[v.key] }]));
  }

  const report = { ok: true, mode: wantStore ? 'store' : 'dry', asOf: iso(end), timing: { totalMs: Date.now() - started, calls: plan.length, concurrency: 2 }, wouldSave: { asOf: iso(end), tests, reads: readsOut }, skipped, errors, perTest };
  if (req.method === 'POST' && !storeOn) report.note = 'Saving is switched off (AB_STORE_ENABLED is not 1), so this was a dry run.';
  if (wantStore) {
    if (!Object.keys(tests).length) { report.ok = false; report.saved = null; report.error = 'Nothing to save: no test pulled successfully.'; console.log('[ab-refresh] ' + JSON.stringify(report).slice(0, 14000)); return send(res, 502, report); }
    const note = `button · tests: ${Object.keys(tests).join(',')} · errors: ${Object.keys(errors).length ? Object.keys(errors).join(',') : 'none'}`;
    const row = await sql`INSERT INTO ab_snapshots (as_of, payload, note) VALUES (${iso(end)}::date, ${JSON.stringify({ asOf: iso(end), tests, reads: readsOut })}::jsonb, ${note}) RETURNING id, created_at::text AS created_at`;
    report.saved = { id: row[0].id, createdAt: row[0].created_at };
  }
  console.log('[ab-refresh] ' + JSON.stringify(report).slice(0, 14000));
  return send(res, 200, report);
  } finally { await release(); }
}