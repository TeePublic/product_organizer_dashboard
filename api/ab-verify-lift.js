// STEP 4b: read-only check. Recomputes Sitewide CVR, revenue per user and AOV by variant for one experiment from the Amplitude
// Analytics API (your Redbubble key pair) and lines the results up against what the Experiment analysis screen reported.
// It stores nothing, never prints the keys, and only runs in Production (behind the Okta sign-in).
const BASE = 'https://amplitude.com/api/2';
const VARIANTS = ['control', 'cross-sell', 'cross-sell-trimmed-badges'];

// What the Experiment analysis screen reported for rb-cart-upsell, Oct 29 to Nov 6 (read Nov 7 through the Amplitude connector).
// Metrics: Sitewide CVR h1f2lfvq (page to order_completed within a day), Revenue per User al7e250f, AOV ii32x2p3 (revenue / orders).
const REFERENCE = {
  'rb-cart-upsell': {
    control: { exposed: 30742, converters: 15020, orders: 15572, revenue: 611096.66 },
    'cross-sell': { exposed: 30968, converters: 15124, orders: 15698, revenue: 619298.08 },
    'cross-sell-trimmed-badges': { exposed: 30940, converters: 15032, orders: 15603, revenue: 622346.27 },
  },
};

const send = (res, code, body) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json; charset=utf-8'); return res.status(code).send(JSON.stringify(body, null, 2)); };
const sum = (a) => (a || []).reduce((x, y) => x + (Number(y) || 0), 0);
const rel = (v, c) => (typeof v === 'number' && typeof c === 'number' && c !== 0 ? v / c - 1 : null);
const pct = (v, r) => (typeof v === 'number' && typeof r === 'number' && r !== 0 ? +((v / r - 1) * 100).toFixed(2) : null);

async function call(fetchFn, auth, path, pairs, ms = 8000) {
  const qs = pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const t = Date.now(); const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetchFn(`${BASE}${path}?${qs}`, { headers: { Authorization: auth, Accept: 'application/json' }, signal: ctl.signal });
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: r.status, ms: Date.now() - t, json, message: json ? (json.error || json.message) : text.slice(0, 200) };
  } catch (e) { return { status: 0, ms: Date.now() - t, message: e.name === 'AbortError' ? 'timeout' : e.message }; }
  finally { clearTimeout(timer); }
}

// Runs the jobs at most `limit` at a time (Amplitude allows about five at once) and stops starting new ones after the deadline.
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

export default async function handler(req, res, deps) {
  if (req.method !== 'GET') return send(res, 405, { error: 'GET only' });
  const env = deps?.env ?? process.env;
  if (env.VERCEL_ENV !== 'production') return send(res, 403, { error: 'Production only' });
  const key = env.AMPLITUDE_RB_API_KEY, secret = env.AMPLITUDE_RB_SECRET_KEY;
  if (!key || !secret) return send(res, 200, { keysPresent: { AMPLITUDE_RB_API_KEY: !!key, AMPLITUDE_RB_SECRET_KEY: !!secret }, error: 'a key is missing for this environment' });

  const q = req.query || {};
  const exp = String(q.exp || 'rb-cart-upsell'), start = String(q.start || '20261029'), end = String(q.end || '20261106');
  const variants = q.variants ? String(q.variants).split(',') : VARIANTS;
  if (!/^[a-z0-9_-]{1,80}$/i.test(exp) || !/^\d{8}$/.test(start) || !/^\d{8}$/.test(end) || variants.length > 6 || !variants.every((v) => /^[a-z0-9_-]{1,80}$/i.test(v))) return send(res, 400, { error: 'exp and variants must be flag/variant keys, start and end must be YYYYMMDD' });

  const fetchFn = deps?.fetch ?? fetch; const auth = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
  const seg = (v) => JSON.stringify([{ prop: `gp:[Experiment] ${exp}`, op: 'is', values: [v] }]);
  const ev = (event_type, extra = {}) => JSON.stringify({ event_type, ...extra });
  const labels = []; const jobs = [];
  const add = (label, path, pairs) => { labels.push(label); jobs.push(() => call(fetchFn, auth, path, pairs)); };

  add('exposed', '/events/segmentation', [['e', JSON.stringify({ event_type: '[Experiment] Exposure', filters: [{ subprop_type: 'event', subprop_key: '[Experiment] Flag Key', subprop_op: 'is', subprop_value: [exp] }], group_by: [{ type: 'event', value: '[Experiment] Variant' }] })], ['m', 'uniques'], ['i', '30'], ['start', start], ['end', end], ['limit', '20']]);
  for (const v of variants) {
    add(`revenue:${v}`, '/events/segmentation', [['e', ev('order_completed', { group_by: [{ type: 'event', value: 'transaction_amount_usd' }] })], ['m', 'sums'], ['i', '1'], ['start', start], ['end', end], ['s', seg(v)]]);
    add(`orders:${v}`, '/events/segmentation', [['e', ev('order_completed')], ['m', 'totals'], ['i', '1'], ['start', start], ['end', end], ['s', seg(v)]]);
    add(`buyers:${v}`, '/events/segmentation', [['e', ev('order_completed')], ['m', 'uniques'], ['i', '30'], ['start', start], ['end', end], ['s', seg(v)]]);
    add(`funnel:${v}`, '/funnels', [['e', ev('page')], ['e', ev('order_completed')], ['mode', 'ordered'], ['cs', '86400'], ['start', start], ['end', end], ['s', seg(v)]]);
  }
  const results = await pool(jobs, 4, Date.now() + 8500);
  const by = Object.fromEntries(labels.map((l, i) => [l, results[i]]));

  // Exposed users per variant: monthly buckets, summed (a user seen in both months would count twice, so it runs slightly high).
  const exposed = {}; const ex = by.exposed;
  if (ex.status === 200 && ex.json?.data) {
    const names = (ex.json.data.seriesLabels || []).map((l) => (Array.isArray(l) ? l[l.length - 1] : String(l)));
    (ex.json.data.series || []).forEach((arr, i) => { exposed[names[i]] = (exposed[names[i]] || 0) + sum(arr); });
  }

  const got = {};
  for (const v of variants) {
    const rev = by[`revenue:${v}`], ord = by[`orders:${v}`], fun = by[`funnel:${v}`], buy = by[`buyers:${v}`];
    const raw = fun.json?.data?.[0]?.cumulativeRaw;
    got[v] = {
      exposed: exposed[v] ?? null,
      revenue: rev.status === 200 ? +sum(rev.json?.data?.series?.[0]).toFixed(2) : null,
      orders: ord.status === 200 ? sum(ord.json?.data?.series?.[0]) : null,
      funnelUsers: Array.isArray(raw) ? raw[0] : null,
      converters: Array.isArray(raw) ? raw[raw.length - 1] : null,
      // 4c: unique buyers per variant, counted straight from order_completed (monthly buckets summed; a buyer in both months counts twice).
      buyers: buy.status === 200 ? sum(buy.json?.data?.series?.[0]) : null,
    };
  }
  const derive = (g) => ({
    cvrVsExposed: g.exposed && g.converters != null ? g.converters / g.exposed : null,
    cvrBuyersVsExposed: g.exposed && g.buyers != null ? g.buyers / g.exposed : null,
    cvrVsFunnelUsers: g.funnelUsers && g.converters != null ? g.converters / g.funnelUsers : null,
    revenuePerExposed: g.exposed && g.revenue != null ? g.revenue / g.exposed : null,
    aov: g.orders && g.revenue != null ? g.revenue / g.orders : null,
  });
  const ref = REFERENCE[exp]; const computed = {}; const lifts = {}; const refLifts = {}; const diffVsReference = {};
  const refDerived = ref ? Object.fromEntries(Object.keys(ref).map((v) => [v, { cvrVsExposed: ref[v].converters / ref[v].exposed, revenuePerExposed: ref[v].revenue / ref[v].exposed, aov: ref[v].revenue / ref[v].orders }])) : null;
  for (const v of variants) computed[v] = { ...got[v], ...derive(got[v]) };
  for (const v of variants.filter((x) => x !== 'control')) {
    const c = computed.control, t = computed[v];
    lifts[v] = { cvrBuyersVsExposed: rel(t?.cvrBuyersVsExposed, c?.cvrBuyersVsExposed), cvrVsExposed: rel(t?.cvrVsExposed, c?.cvrVsExposed), cvrVsFunnelUsers: rel(t?.cvrVsFunnelUsers, c?.cvrVsFunnelUsers), revenuePerExposed: rel(t?.revenuePerExposed, c?.revenuePerExposed), aov: rel(t?.aov, c?.aov) };
    if (refDerived?.[v] && refDerived.control) refLifts[v] = { cvr: rel(refDerived[v].cvrVsExposed, refDerived.control.cvrVsExposed), revenuePerUser: rel(refDerived[v].revenuePerExposed, refDerived.control.revenuePerExposed), aov: rel(refDerived[v].aov, refDerived.control.aov) };
  }
  if (ref) for (const v of variants) if (ref[v]) diffVsReference[v] = { exposedPct: pct(got[v].exposed, ref[v].exposed), convertersPct: pct(got[v].converters, ref[v].converters), buyersPct: pct(got[v].buyers, ref[v].converters), ordersPct: pct(got[v].orders, ref[v].orders), revenuePct: pct(got[v].revenue, ref[v].revenue) };

  return send(res, 200, {
    experiment: exp, range: `${start} to ${end}`,
    calls: labels.map((l, i) => ({ call: l, status: results[i].status, ms: results[i].ms, ...(results[i].status !== 200 ? { message: results[i].message } : {}) })),
    computed, lifts, referenceLifts: refLifts, diffVsReferencePct: diffVsReference,
    reference: ref ? { source: 'Experiment analysis, Oct 29 to Nov 6', ...ref } : undefined,
  });
}