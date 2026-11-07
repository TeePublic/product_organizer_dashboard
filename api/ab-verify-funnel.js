// STEP 4d: read-only check at scale. For one experiment it counts, per variant, the users exposed and the users who then did each
// metric's event (deduplicated over the whole window, using Amplitude funnels that start at the experiment's own exposure event),
// and lines the results up against what the Experiment analysis screen reported. It stores nothing, never prints the keys, and only
// runs in Production (behind the Okta sign-in). It also reports how long each Amplitude call took, because this test has millions of users.
const BASE = 'https://amplitude.com/api/2';

// One entry per experiment. `reference` is what the Experiment analysis screen reported (read through the Amplitude connector),
// cumulative through the last full day of the window: exposed users, and users who did each metric's event.
const MANIFEST = {
  'rb-nav-topics-internal': {
    name: 'Topics-first navigation',
    start: '20261007', end: '20261105', // the test was decided and rolled out Nov 6 at 21:01 UTC, so the window stops on Nov 5
    variants: ['control', 'treatment', 'default-tshirts', 'dynamic-query'],
    metrics: {
      cvr: { label: 'Sitewide CVR (h1f2lfvq)', event: { event_type: 'order_completed' } },
      atc: { label: 'Sitewide ATC rate (dbgsu0lw)', event: { event_type: 'product_added' } },
      nav: { label: 'Nav engagement rate (ufwuzrnp)', event: { event_type: 'link_clicked', filters: [{ subprop_type: 'event', subprop_key: 'location', subprop_op: 'is', subprop_value: ['nav-sub'] }] } },
    },
    reference: {
      control: { exposed: 3049548, cvr: 32837, atc: 82523, nav: 38157 },
      treatment: { exposed: 3052762, cvr: 32527, atc: 81724, nav: 40755 },
      'default-tshirts': { exposed: 2960567, cvr: 31851, atc: 79478, nav: 39830 },
      'dynamic-query': { exposed: 2961005, cvr: 31575, atc: 79411, nav: 40085 },
    },
  },
};

const send = (res, code, body) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json; charset=utf-8'); return res.status(code).send(JSON.stringify(body, null, 2)); };
const rel = (v, c) => (typeof v === 'number' && typeof c === 'number' && c !== 0 ? v / c - 1 : null);
const pct = (v, r) => (typeof v === 'number' && typeof r === 'number' && r !== 0 ? +((v / r - 1) * 100).toFixed(2) : null);
const days = (a, b) => Math.round((Date.UTC(+b.slice(0, 4), +b.slice(4, 6) - 1, +b.slice(6, 8)) - Date.UTC(+a.slice(0, 4), +a.slice(4, 6) - 1, +a.slice(6, 8))) / 86400000) + 1;

async function call(fetchFn, auth, path, pairs, ms) {
  const qs = pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const t = Date.now(); const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetchFn(`${BASE}${path}?${qs}`, { headers: { Authorization: auth, Accept: 'application/json' }, signal: ctl.signal });
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: r.status, ms: Date.now() - t, json, message: json ? (json.error || json.message) : text.slice(0, 200) };
  } catch (e) { return { status: 0, ms: Date.now() - t, message: e.name === 'AbortError' ? `timeout after ${ms} ms` : e.message }; }
  finally { clearTimeout(timer); }
}

// At most `limit` calls at a time (Amplitude allows about five at once); no new call starts after the deadline.
async function pool(jobs, limit, deadline) {
  let next = 0; const out = new Array(jobs.length);
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (next < jobs.length) {
      const i = next++;
      out[i] = Date.now() > deadline ? { status: 0, ms: 0, message: 'skipped: out of time' } : await jobs[i]();
    }
  }));
  return out;
}

// Any crash is returned as readable JSON (keys scrubbed) instead of a bare 500.
export default async function handler(req, res, deps) {
  try { return await run(req, res, deps); } catch (e) {
    const env = deps?.env ?? process.env; let msg = String((e && e.stack) || e);
    for (const k of [env.AMPLITUDE_RB_API_KEY, env.AMPLITUDE_RB_SECRET_KEY]) if (k) msg = msg.split(k).join('***');
    return send(res, 500, { error: 'ab-verify-funnel crashed', detail: msg.slice(0, 1500) });
  }
}

async function run(req, res, deps) {
  if (req.method !== 'GET') return send(res, 405, { error: 'GET only' });
  const env = deps?.env ?? process.env;
  if (env.VERCEL_ENV !== 'production') return send(res, 403, { error: 'Production only' });
  const key = env.AMPLITUDE_RB_API_KEY, secret = env.AMPLITUDE_RB_SECRET_KEY;
  if (!key || !secret) return send(res, 200, { keysPresent: { AMPLITUDE_RB_API_KEY: !!key, AMPLITUDE_RB_SECRET_KEY: !!secret }, error: 'a key is missing for this environment' });

  const exp = String((req.query || {}).exp || 'rb-nav-topics-internal');
  const cfg = MANIFEST[exp];
  if (!cfg) return send(res, 400, { error: 'unknown experiment', known: Object.keys(MANIFEST) });

  const started = Date.now(); const fetchFn = deps?.fetch ?? fetch; const auth = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
  const callMs = deps?.callMs ?? 25000, budgetMs = deps?.budgetMs ?? 50000;
  const cs = days(cfg.start, cfg.end) * 86400; // conversion window = the whole experiment window
  const exposure = (variant) => JSON.stringify({ event_type: '[Experiment] Exposure', filters: [{ subprop_type: 'event', subprop_key: '[Experiment] Flag Key', subprop_op: 'is', subprop_value: [exp] }, { subprop_type: 'event', subprop_key: '[Experiment] Variant', subprop_op: 'is', subprop_value: [variant] }] });
  const labels = []; const jobs = [];
  for (const v of cfg.variants) for (const m of Object.keys(cfg.metrics)) {
    labels.push(`${m}:${v}`);
    jobs.push(() => call(fetchFn, auth, '/funnels', [['e', exposure(v)], ['e', JSON.stringify(cfg.metrics[m].event)], ['mode', 'ordered'], ['cs', String(cs)], ['start', cfg.start], ['end', cfg.end]], callMs));
  }
  const results = await pool(jobs, 4, started + budgetMs);
  const by = Object.fromEntries(labels.map((l, i) => [l, results[i]]));

  const num = (x) => (typeof x === 'number' ? x : null);
  const got = {};
  for (const v of cfg.variants) {
    got[v] = { exposed: null };
    for (const m of Object.keys(cfg.metrics)) {
      const raw = by[`${m}:${v}`].json?.data?.[0]?.cumulativeRaw;
      const arr = Array.isArray(raw) ? raw : [];
      got[v][m] = num(arr[arr.length - 1]);
      if (got[v].exposed == null) got[v].exposed = num(arr[0]);
    }
  }
  const rates = {}; const lifts = {}; const refRates = {}; const refLifts = {}; const diffVsReferencePct = {};
  for (const v of cfg.variants) {
    rates[v] = {}; refRates[v] = {}; diffVsReferencePct[v] = { exposedPct: pct(got[v].exposed, cfg.reference[v]?.exposed) };
    for (const m of Object.keys(cfg.metrics)) {
      rates[v][m] = got[v].exposed && got[v][m] != null ? got[v][m] / got[v].exposed : null;
      refRates[v][m] = cfg.reference[v] ? cfg.reference[v][m] / cfg.reference[v].exposed : null;
      diffVsReferencePct[v][`${m}Pct`] = pct(got[v][m], cfg.reference[v]?.[m]);
    }
  }
  for (const v of cfg.variants.filter((x) => x !== 'control')) {
    lifts[v] = {}; refLifts[v] = {};
    for (const m of Object.keys(cfg.metrics)) { lifts[v][m] = rel(rates[v][m], rates.control?.[m]); refLifts[v][m] = rel(refRates[v][m], refRates.control?.[m]); }
  }
  const timings = results.map((r) => r.ms);
  return send(res, 200, {
    experiment: exp, name: cfg.name, range: `${cfg.start} to ${cfg.end}`, conversionWindowDays: cs / 86400,
    timing: { totalMs: Date.now() - started, slowestCallMs: Math.max(0, ...timings), calls: labels.length },
    calls: labels.map((l, i) => ({ call: l, status: results[i].status, ms: results[i].ms, ...(results[i].status !== 200 ? { message: results[i].message } : {}) })),
    counts: got, ratesPerExposedUser: rates, lifts, referenceLifts: refLifts, diffVsReferencePct,
    reference: { source: 'Experiment analysis, Oct 7 to Nov 5 (cumulative)', ...cfg.reference },
  });
}