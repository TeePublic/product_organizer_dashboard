// STEP 4a (round 4): can the project keys run ad-hoc queries (no saved chart) for revenue, orders and the Redbubble payment split,
// and do the answers match the numbers the page shows today? Reads only; stores and changes nothing. Delete after step 4b.
// Behind the Okta sign-in like the rest of the site. Open it in a browser tab while signed in.
export const config = { maxDuration: 60 };

const START = '20261006', END = '20261104';
const KNOWN = {
  revTp: { '2026-10-06': 224841, '2026-10-12': 244388, '2026-10-19': 281835, '2026-10-24': 398214 },
  revRb: { '2026-10-06': 318251, '2026-10-12': 276937, '2026-10-19': 270476, '2026-10-24': 337788 },
  ordTp: { '2026-10-06': 4545, '2026-10-12': 4991, '2026-10-19': 5589, '2026-10-24': 8795 },
  ordRb: { '2026-10-06': 8547, '2026-10-12': 6684, '2026-10-19': 6627, '2026-10-24': 8594 },
  payRb: {
    'Card': { '2026-10-10': 3878, '2026-10-17': 2900, '2026-10-24': 3690 },
    'Apple Pay': { '2026-10-10': 2386, '2026-10-17': 1676, '2026-10-24': 2227 },
    'Google Pay': { '2026-10-10': 309, '2026-10-17': 239, '2026-10-24': 330 },
    'PayPal': { '2026-10-10': 2078, '2026-10-17': 1407, '2026-10-24': 2043 },
    'Klarna, Afterpay': { '2026-10-10': 264, '2026-10-17': 184, '2026-10-24': 283 },
  },
};
const ev = (extra) => ({ event_type: 'order_completed', ...extra });
const CHECKS = [
  { key: 'revTp', name: 'TeePublic daily revenue (sum of total_revenue_usd)', brand: 'TP', m: 'sums', e: ev({ group_by: [{ type: 'event', value: 'total_revenue_usd' }] }) },
  { key: 'ordTp', name: 'TeePublic daily orders (order_completed totals)', brand: 'TP', m: 'totals', e: ev({}) },
  { key: 'revRb', name: 'Redbubble daily revenue (sum of transaction_amount_usd)', brand: 'RB', m: 'sums', e: ev({ group_by: [{ type: 'event', value: 'transaction_amount_usd' }] }) },
  { key: 'ordRb', name: 'Redbubble daily orders (order_completed totals)', brand: 'RB', m: 'totals', e: ev({}) },
  { key: 'payRb', name: 'Redbubble payments (order_completed by payment_type and wallet_type)', brand: 'RB', m: 'totals', e: ev({ group_by: [{ type: 'event', value: 'payment_type' }, { type: 'event', value: 'wallet_type' }] }), payments: true },
];

const creds = (b) => { const k = process.env[`AMPLITUDE_${b}_API_KEY`], s = process.env[`AMPLITUDE_${b}_SECRET_KEY`]; return k && s ? { k, s } : null; };
const labelText = (x, i) => (Array.isArray(x) ? x.filter((p) => p !== '' && p != null).join(' | ') : x && typeof x === 'object' ? JSON.stringify(x) : x === '' || x == null ? `series${i}` : String(x));

// Redbubble's page buckets: Card = Stripe + Stripe Link, PayPal = Paypal + Paypal Express, Klarna and Afterpay combined, Apple/Google Pay by wallet.
function bucket(label) {
  const t = label.toLowerCase();
  if (t.includes('klarna') || t.includes('afterpay')) return 'Klarna, Afterpay';
  if (t.includes('paypal')) return 'PayPal';
  if (t.includes('apple')) return 'Apple Pay';
  if (t.includes('google')) return 'Google Pay';
  return 'Card';
}

async function call(fetchImpl, c, sleep) {
  const order = [c.brand, c.brand === 'TP' ? 'RB' : 'TP'].filter((b) => creds(b));
  if (!order.length) return { error: 'no keys configured' };
  const url = `https://amplitude.com/api/2/events/segmentation?${new URLSearchParams({ e: JSON.stringify(c.e), m: c.m, start: START, end: END, i: '1' })}`;
  let last;
  for (const b of order) {
    const { k, s } = creds(b);
    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await fetchImpl(url, { headers: { Authorization: 'Basic ' + Buffer.from(`${k}:${s}`).toString('base64') } });
      last = { status: res.status, usedKeysOf: b, text: await res.text(), attempts: attempt };
      if (res.status === 429 && attempt < 3) { await sleep(4000 * attempt); continue; }
      break;
    }
    if (last.status !== 400 && last.status !== 404) return last;
  }
  return last;
}

const worst = (dates, vals, known) => { let w = 0, n = 0; for (const [d, want] of Object.entries(known)) { const i = dates.indexOf(d); if (i < 0 || !Number.isFinite(vals[i])) continue; n++; w = Math.max(w, Math.abs(vals[i] - want) / want); } return { n, w }; };

async function check(fetchImpl, c, sleep) {
  const r = { check: c.key, name: c.name };
  try {
    const got = await call(fetchImpl, c, sleep);
    if (got.error) return { ...r, problem: got.error };
    r.status = got.status; r.usedKeysOf = got.usedKeysOf; if (got.attempts > 1) r.attempts = got.attempts;
    if (got.status !== 200) return { ...r, problem: `HTTP ${got.status}`, bodyStart: got.text.slice(0, 400) };
    let body; try { body = JSON.parse(got.text); } catch { return { ...r, problem: 'not JSON', bodyStart: got.text.slice(0, 300) }; }
    const d = body?.data;
    if (!d || !Array.isArray(d.xValues) || !Array.isArray(d.series)) return { ...r, problem: 'unrecognised shape', topKeys: Object.keys(body || {}), dataKeys: Object.keys(d || {}) };
    const dates = d.xValues.map((x) => String(x).slice(0, 10));
    const labels = (d.seriesLabels ?? d.seriesMeta ?? []).map(labelText);
    r.read = { days: dates.length, first: dates[0], last: dates.at(-1), seriesCount: d.series.length };
    if (c.payments) {
      r.read.labelsSeen = labels.slice(0, 30);
      const sums = {};
      d.series.forEach((s, i) => { const b = bucket(labels[i] ?? ''); sums[b] ??= dates.map(() => 0); s.forEach((v, j) => { sums[b][j] += Number(v) || 0; }); });
      r.comparison = Object.entries(KNOWN.payRb).map(([name, known]) => { const w = sums[name] ? worst(dates, sums[name], known) : { n: 0, w: 0 }; return { label: name, datesFound: w.n, worstDifferencePct: Number((w.w * 100).toFixed(3)), ok: w.n > 0 && w.w < 0.02 }; });
    } else {
      const vals = (d.series[0] || []).map(Number);
      r.read.sample = vals.slice(-3);
      const w = worst(dates, vals, KNOWN[c.key]);
      r.comparison = [{ datesFound: w.n, worstDifferencePct: Number((w.w * 100).toFixed(3)), ok: w.n > 0 && w.w < 0.01 }];
      if (d.series.length > 1) r.note = `${d.series.length} series came back; compared the first (${labels[0]})`;
    }
  } catch (e) { r.problem = `error: ${e.message}`; }
  return r;
}

export default async function handler(req, res, deps) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const out = { environment: process.env.VERCEL_ENV || 'unknown', keysPresent: { TP: !!creds('TP'), RB: !!creds('RB') } };
  if (process.env.VERCEL_ENV !== 'production' && !deps) { out.verdict = 'Only runs on the production deployment (the keys exist only there).'; return res.status(200).send(JSON.stringify(out, null, 2)); }
  const fetchImpl = deps?.fetch ?? fetch;
  const sleep = deps?.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  out.checks = [];
  for (const c of CHECKS) { const t0 = Date.now(); const r = await check(fetchImpl, c, sleep); r.ms = Date.now() - t0; out.checks.push(r); } // one at a time
  const bad = out.checks.filter((r) => r.problem || (r.comparison || []).some((x) => !x.ok));
  out.verdict = bad.length === 0 ? 'All five ad-hoc queries worked through the keys and every known number matched.'
    : bad.some((r) => r.status === 401 || r.status === 403) ? 'Amplitude rejected a key pair. Check the _TP_ and _RB_ variables.'
    : `${bad.length} check(s) need a look (${bad.map((r) => r.check).join(', ')}). Copy this whole page and send it back.`;
  return res.status(200).send(JSON.stringify(out, null, 2));
}