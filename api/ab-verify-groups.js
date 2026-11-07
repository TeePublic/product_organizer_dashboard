// STEP 4f: read-only diagnostic. Breaks the control variant's exposed users (Topics-first navigation, whole window) down by a few
// Cloudflare / device properties and shows, for the biggest values of each, how many were exposed and how many then bought.
// The goal is to find which value holds the roughly 2.7 million extra "exposed" users that the Experiment screen does not count.
// It stores nothing, never prints the keys, and only runs in Production (behind the Okta sign-in).
const BASE = 'https://amplitude.com/api/2';
const EXP = 'rb-nav-topics-internal', VARIANT = 'control', START = '20261007', END = '20261105', CS = 30 * 86400;
const REF = { exposed: 3049548, buyers: 32837 }; // Experiment screen, control, same window
const OURS_TOTAL = 5749299;                       // what the Analytics API counted for the same people (step 4d)
const KNOWN_SCRAPER_JA4 = 't13d1517h2_8daaf6152771_cb7bf5808d99'; // the one Mike's dashboard excludes
const DIMENSIONS = ['gp:cloudflare_ja4', 'gp:cloudflare_device_type', 'gp:cloudflare_ip_country', 'platform'];

const send = (res, code, body) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json; charset=utf-8'); return res.status(code).send(JSON.stringify(body, null, 2)); };
const share = (v, t) => (typeof v === 'number' && t ? +(v / t).toFixed(4) : null);

async function call(fetchFn, auth, pairs, ms) {
  const qs = pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const t = Date.now(); const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetchFn(`${BASE}/funnels?${qs}`, { headers: { Authorization: auth, Accept: 'application/json' }, signal: ctl.signal });
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: r.status, ms: Date.now() - t, json, message: json ? (json.error || json.message) : text.slice(0, 200) };
  } catch (e) { return { status: 0, ms: Date.now() - t, message: e.name === 'AbortError' ? `timeout after ${ms} ms` : e.message }; }
  finally { clearTimeout(timer); }
}
async function pool(jobs, limit, deadline) {
  let next = 0; const out = new Array(jobs.length);
  await Promise.all(Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    while (next < jobs.length) { const i = next++; out[i] = Date.now() > deadline ? { status: 0, ms: 0, message: 'skipped: out of time' } : await jobs[i](); }
  }));
  return out;
}

export default async function handler(req, res, deps) {
  try { return await run(req, res, deps); } catch (e) {
    const env = deps?.env ?? process.env; let msg = String((e && e.stack) || e);
    for (const k of [env.AMPLITUDE_RB_API_KEY, env.AMPLITUDE_RB_SECRET_KEY]) if (k) msg = msg.split(k).join('***');
    return send(res, 500, { error: 'ab-verify-groups crashed', detail: msg.slice(0, 1500) });
  }
}

async function run(req, res, deps) {
  if (req.method !== 'GET') return send(res, 405, { error: 'GET only' });
  const env = deps?.env ?? process.env;
  if (env.VERCEL_ENV !== 'production') return send(res, 403, { error: 'Production only' });
  const key = env.AMPLITUDE_RB_API_KEY, secret = env.AMPLITUDE_RB_SECRET_KEY;
  if (!key || !secret) return send(res, 200, { keysPresent: { AMPLITUDE_RB_API_KEY: !!key, AMPLITUDE_RB_SECRET_KEY: !!secret }, error: 'a key is missing for this environment' });

  const started = Date.now(); const fetchFn = deps?.fetch ?? fetch; const auth = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
  const exposure = JSON.stringify({ event_type: '[Experiment] Exposure', filters: [{ subprop_type: 'event', subprop_key: '[Experiment] Flag Key', subprop_op: 'is', subprop_value: [EXP] }, { subprop_type: 'event', subprop_key: '[Experiment] Variant', subprop_op: 'is', subprop_value: [VARIANT] }] });
  const buy = JSON.stringify({ event_type: 'order_completed' });
  const results = await pool(DIMENSIONS.map((d) => () => call(fetchFn, auth, [['e', exposure], ['e', buy], ['mode', 'ordered'], ['cs', String(CS)], ['start', START], ['end', END], ['g', d], ['limit', '10']], deps?.callMs ?? 25000)), 4, started + (deps?.budgetMs ?? 50000));

  const out = {};
  DIMENSIONS.forEach((d, i) => {
    const r = results[i];
    if (r.status !== 200) { out[d] = { status: r.status, ms: r.ms, message: r.message }; return; }
    const entries = Array.isArray(r.json?.data) ? r.json.data : [];
    const groups = entries.map((e, n) => {
      const raw = Array.isArray(e?.cumulativeRaw) ? e.cumulativeRaw : [];
      const value = e?.groupValue ?? e?.group_value ?? e?.name ?? `group ${n}`;
      const exposed = typeof raw[0] === 'number' ? raw[0] : null, buyers = raw.length > 1 && typeof raw[raw.length - 1] === 'number' ? raw[raw.length - 1] : null;
      return { value: String(value), exposed, buyers, shareOfExposed: share(exposed, OURS_TOTAL), buyersPer1000Exposed: exposed ? +((buyers || 0) / exposed * 1000).toFixed(2) : null, ...(String(value) === KNOWN_SCRAPER_JA4 ? { knownScraper: true } : {}) };
    }).sort((a, b) => (b.exposed || 0) - (a.exposed || 0));
    const shown = groups.reduce((s, g) => s + (g.exposed || 0), 0);
    out[d] = { status: 200, ms: r.ms, groupsReturned: groups.length, exposedShownInTopGroups: shown, shareOfAllExposedShown: share(shown, OURS_TOTAL), groups, ...(entries.length && !entries.some((e) => Array.isArray(e?.cumulativeRaw)) ? { note: 'response had no cumulativeRaw; first entry keys: ' + Object.keys(entries[0] || {}).join(',') } : {}) };
  });
  return send(res, 200, { experiment: EXP, variant: VARIANT, window: `${START} to ${END}`, ourTotalExposed: OURS_TOTAL, experimentExposed: REF.exposed, extraExposedOverExperiment: OURS_TOTAL - REF.exposed, timing: { totalMs: Date.now() - started, calls: DIMENSIONS.length }, byProperty: out });
}