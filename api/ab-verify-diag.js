// STEP 4e: read-only diagnostic. Why does the Analytics API count about 88% more exposed users than the Experiment screen for the
// Topics-first navigation test? It looks only at the control variant and asks two kinds of question:
//   1. windows: exposed users after 1, 2, 8, 15 and 30 days, against Experiment's cumulative counts (does the gap exist from day 1, or does it grow?)
//   2. filters: exposed users and buyers over the full window when limited by bot score (30 or more, 70, 90, no score) and by whether
//      the user has a user ID (the experiment buckets by user ID).
// It stores nothing, never prints the keys, and only runs in Production (behind the Okta sign-in).
const BASE = 'https://amplitude.com/api/2';
const EXP = 'rb-nav-topics-internal', VARIANT = 'control', START = '20261007';
const FULL_END = '20261105';
// Experiment analysis, control variant, cumulative exposed users after N days (Oct 7 is day 1), and buyers over the full window.
const REF_WINDOWS = { 1: 142988, 2: 241272, 8: 791294, 15: 1519320, 30: 3049548 };
const REF_FULL = { exposed: 3049548, buyers: 32837 };

const send = (res, code, body) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json; charset=utf-8'); return res.status(code).send(JSON.stringify(body, null, 2)); };
const ratio = (v, r) => (typeof v === 'number' && typeof r === 'number' && r !== 0 ? +(v / r).toFixed(3) : null);
const dayEnd = (n) => { const d = new Date(Date.UTC(2026, 9, 7 + n - 1)); return `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`; };

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
    return send(res, 500, { error: 'ab-verify-diag crashed', detail: msg.slice(0, 1500) });
  }
}

async function run(req, res, deps) {
  if (req.method !== 'GET') return send(res, 405, { error: 'GET only' });
  const env = deps?.env ?? process.env;
  if (env.VERCEL_ENV !== 'production') return send(res, 403, { error: 'Production only' });
  const key = env.AMPLITUDE_RB_API_KEY, secret = env.AMPLITUDE_RB_SECRET_KEY;
  if (!key || !secret) return send(res, 200, { keysPresent: { AMPLITUDE_RB_API_KEY: !!key, AMPLITUDE_RB_SECRET_KEY: !!secret }, error: 'a key is missing for this environment' });

  const started = Date.now(); const fetchFn = deps?.fetch ?? fetch; const auth = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
  const callMs = deps?.callMs ?? 25000, budgetMs = deps?.budgetMs ?? 50000;
  const exposure = JSON.stringify({ event_type: '[Experiment] Exposure', filters: [{ subprop_type: 'event', subprop_key: '[Experiment] Flag Key', subprop_op: 'is', subprop_value: [EXP] }, { subprop_type: 'event', subprop_key: '[Experiment] Variant', subprop_op: 'is', subprop_value: [VARIANT] }] });
  const buy = JSON.stringify({ event_type: 'order_completed' });
  const seg = (prop, op, values) => JSON.stringify([{ prop, op, values }]);
  const funnel = (end, cs, s) => ['/funnels', [['e', exposure], ['e', buy], ['mode', 'ordered'], ['cs', String(cs)], ['start', START], ['end', end], ...(s ? [['s', s]] : [])]];

  const plan = []; // [label, path, pairs]
  for (const n of Object.keys(REF_WINDOWS)) plan.push([`window:${n}`, ...funnel(n === '30' ? FULL_END : dayEnd(+n), +n * 86400)]);
  const full = (label, s) => plan.push([label, ...funnel(FULL_END, 30 * 86400, s)]);
  full('bot>=30', seg('gp:cloudflare_bot_score', 'greater or equal', ['30']));
  full('bot>=70', seg('gp:cloudflare_bot_score', 'greater or equal', ['70']));
  full('bot>=90', seg('gp:cloudflare_bot_score', 'greater or equal', ['90']));
  full('bot:none', seg('gp:cloudflare_bot_score', 'is', ['(none)']));
  full('userid:set', seg('user_id', 'is not', ['(none)']));
  full('userid:none', seg('user_id', 'is', ['(none)']));

  const results = await pool(plan.map(([, p, q]) => () => call(fetchFn, auth, p, q, callMs)), 4, started + budgetMs);
  const read = (i) => { const raw = results[i].json?.data?.[0]?.cumulativeRaw; const a = Array.isArray(raw) ? raw : []; return { exposed: typeof a[0] === 'number' ? a[0] : null, buyers: typeof a[a.length - 1] === 'number' && a.length > 1 ? a[a.length - 1] : null }; };
  const byLabel = {}; plan.forEach(([l], i) => { byLabel[l] = { ...read(i), status: results[i].status, ms: results[i].ms, ...(results[i].status !== 200 ? { message: results[i].message } : {}) }; });

  const windows = Object.keys(REF_WINDOWS).map((n) => ({ days: +n, ours: byLabel[`window:${n}`].exposed, experiment: REF_WINDOWS[n], oursOverExperiment: ratio(byLabel[`window:${n}`].exposed, REF_WINDOWS[n]) }));
  const filters = ['bot>=30', 'bot>=70', 'bot>=90', 'bot:none', 'userid:set', 'userid:none'].map((l) => ({ filter: l, ...byLabel[l], exposedOverExperiment: ratio(byLabel[l].exposed, REF_FULL.exposed), buyersOverExperiment: ratio(byLabel[l].buyers, REF_FULL.buyers) }));
  const all = byLabel['window:30'];
  const eligible = byLabel['bot>=30'].exposed != null && byLabel['bot:none'].exposed != null ? byLabel['bot>=30'].exposed + byLabel['bot:none'].exposed : null;
  return send(res, 200, {
    experiment: EXP, variant: VARIANT, fullWindow: `${START} to ${FULL_END}`,
    timing: { totalMs: Date.now() - started, calls: plan.length },
    unfiltered: { exposed: all.exposed, buyers: all.buyers, exposedOverExperiment: ratio(all.exposed, REF_FULL.exposed), buyersOverExperiment: ratio(all.buyers, REF_FULL.buyers) },
    botScoreAtLeast30OrNone: { exposed: eligible, exposedOverExperiment: ratio(eligible, REF_FULL.exposed) },
    windows, filters, experimentFullWindow: REF_FULL,
  });
}