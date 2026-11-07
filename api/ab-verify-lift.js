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
  if (!key || !secret) return send(res, 200, { keysPresent: { AMPLITUDE_RB_API_KEY: !!key, AMPLITUDE_RB_SECRET_KEY: !!secret }, error: