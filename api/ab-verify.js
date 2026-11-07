// STEP 4a: read-only check. Proves AMPLITUDE_RB_API_KEY / AMPLITUDE_RB_SECRET_KEY work and shows what the Amplitude
// Analytics API returns for one experiment's exposures, split by variant. It stores nothing, changes nothing on the page,
// never prints the keys, and only runs in Production (behind the Okta sign-in like the rest of the site).
const BASE = 'https://amplitude.com/api/2/events/segmentation';

// Exposed users per variant through Nov 6 as the Experiment analysis screen reported them (control, cross-sell, trimmed badges).
const REFERENCE = { 'rb-cart-upsell': { control: 30742, 'cross-sell': 30968, 'cross-sell-trimmed-badges': 30940 } };

const send = (res, code, body) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('Content-Type', 'application/json; charset=utf-8'); return res.status(code).send(JSON.stringify(body, null, 2)); };

async function call(fetchFn, auth, params, ms = 8000) {
  const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const t = Date.now(); const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetchFn(`${BASE}?${qs}`, { headers: { Authorization: auth, Accept: 'application/json' }, signal: ctl.signal });
    const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch { /* not JSON */ }
    return { status: r.status, ms: Date.now() - t, json, text: json ? undefined : text.slice(0, 300) };
  } catch (e) { return { status: 0, ms: Date.now() - t, error: e.name === 'AbortError' ? 'timeout' : e.message }; }
  finally { clearTimeout(timer); }
}

function summarize(r) {
  if (r.status !== 200 || !r.json?.data) return { status: r.status, ms: r.ms, error: r.error, message: r.json?.error || r.json?.message || r.text };
  const d = r.json.data; const labels = (d.seriesLabels || []).map((l) => (Array.isArray(l) ? l.join(' | ') : String(l)));
  const series = (d.series || []).map((arr, i) => ({ label: labels[i] ?? `series ${i}`, values: arr, sum: arr.reduce((a, b) => a + (Number(b) || 0), 0) }));
  return { status: 200, ms: r.ms, days: d.xValues, series };
}

export default async function handler(req, res, deps) {
  if (req.method !== 'GET') return send(res, 405, { error: 'GET only' });
  const env = deps?.env ?? process.env;
  if (env.VERCEL_ENV !== 'production') return send(res, 403, { error: 'Production only' });
  const key = env.AMPLITUDE_RB_API_KEY, secret = env.AMPLITUDE_RB_SECRET_KEY;
  if (!key || !secret) return send(res, 200, { keysPresent: { AMPLITUDE_RB_API_KEY: !!key, AMPLITUDE_RB_SECRET_KEY: !!secret }, error: 'a key is missing for this environment' });

  const q = req.query || {};
  const exp = String(q.exp || 'rb-cart-upsell'), start = String(q.start || '20261029'), end = String(q.end || '20261106');
  if (!/^[a-z0-9_-]{1,80}$/i.test(exp) || !/^\d{8}$/.test(start) || !/^\d{8}$/.test(end)) return send(res, 400, { error: 'exp must be a flag key, start and end must be YYYYMMDD' });

  const fetchFn = deps?.fetch ?? fetch; const auth = 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
  const exposure = (extra = {}) => ({
    e: JSON.stringify({ event_type: '[Experiment] Exposure', filters: [{ subprop_type: 'event', subprop_key: '[Experiment] Flag Key', subprop_op: 'is', subprop_value: [exp] }], group_by: [{ type: 'event', value: '[Experiment] Variant' }] }),
    m: 'uniques', start, end, limit: '20', ...extra,
  });
  const [keyCheck, daily, monthly] = await Promise.all([
    call(fetchFn, auth, { e: JSON.stringify({ event_type: '_active' }), m: 'uniques', start: end, end, i: '1' }),
    call(fetchFn, auth, exposure({ i: '1' })),
    call(fetchFn, auth, exposure({ i: '30' })),
  ]);

  const out = { experiment: exp, range: `${start} to ${end}`, keyCheck: { status: keyCheck.status, ms: keyCheck.ms, ok: keyCheck.status === 200, error: keyCheck.error }, dailyUniquesByVariant: summarize(daily), monthlyUniquesByVariant: summarize(monthly) };
  if (keyCheck.status === 401 || keyCheck.status === 403) out.hint = 'Keys were rejected. Check they belong to the Redbubble project (774278) and the region (EU projects use analytics.eu.amplitude.com).';
  if (REFERENCE[exp]) out.referenceExposedUsers = { source: 'Experiment analysis screen, through Nov 6', ...REFERENCE[exp] };
  return send(res, 200, out);
}