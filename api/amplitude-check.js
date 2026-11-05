// STEP 4a (round 3): one-off check of how Amplitude answers for each KIND of chart we will need.
// Reads six charts one at a time and prints a report. Stores nothing, changes nothing. Delete this file after step 4b.
// Behind the Okta sign-in like the rest of the site. Open it in a browser tab while signed in.
export const config = { maxDuration: 60 };

const D1 = '2026-10-24', D2 = '2026-10-25';
const CHECKS = [
  { id: 't50lzd6f', name: 'TP · Sitewide CVR (bot ≥70)', brand: 'TP', known: { '*': { '2026-10-05': 0.018520122658997593, '2026-10-12': 0.029016013759787393, '2026-10-19': 0.02166986177858312, '2026-10-24': 0.030500964713598266 } } },
  { id: 'qhto4t7e', name: 'TP · CVR by Channel (bot ≥70)', brand: 'TP', known: { 'Paid Search': { [D1]: 0.05334920348151376, [D2]: 0.054289905723469895 }, 'Email': { [D1]: 0.05845449113722366, [D2]: 0.0677055346587856 } } },
  { id: 'v5smbr37', name: 'TP · Sessions · US / Canada / Australia (bot ≥70)', brand: 'TP', known: { 'US|United States': { [D1]: 242734, [D2]: 240196 }, 'Canada|CA': { [D1]: 14879, [D2]: 15178 } } },
  { id: 'hv3jdftd', name: 'RB · Sitewide CVR (bot ≥70 · excl. JA4 cb7bf)', brand: 'RB', known: { '*': { '2026-10-05': 0.020678, '2026-10-12': 0.016971, '2026-10-19': 0.018473, '2026-10-24': 0.022526 } } },
  { id: 'rb9kh9uz', name: 'RB · Daily Sessions (bot ≥70 · excl. JA4 cb7bf)', brand: 'RB', known: { '*': { '2026-10-05': 355326, '2026-10-12': 341446, '2026-10-19': 310989, '2026-10-24': 333078 } } },
  { id: 'bjjgl1uu', name: 'RB · CVR by Channel (bot ≥70 · excl. JA4 cb7bf)', brand: 'RB', known: { cpc: { [D1]: 0.038029, [D2]: 0.039622 }, email: { [D1]: 0.062333, [D2]: 0.063368 } } },
];

const creds = (b) => {
  const k = process.env[`AMPLITUDE_${b}_API_KEY`], s = process.env[`AMPLITUDE_${b}_SECRET_KEY`];
  return k && s ? { k, s } : null;
};

// A small tree showing the SHAPE of a value (keys, array lengths, first element), never more than a few levels deep.
function describe(v, depth = 0) {
  if (Array.isArray(v)) return { array: v.length, first: depth < 4 && v.length ? describe(v[0], depth + 1) : undefined };
  if (v && typeof v === 'object') {
    const ks = Object.keys(v);
    if (depth >= 4) return { keys: ks.slice(0, 12) };
    return Object.fromEntries(ks.slice(0, 16).map((k) => [k, describe(v[k], depth + 1)]));
  }
  return typeof v === 'string' ? v.slice(0, 30) : v;
}

const labelOf = (x, i) => { if (Array.isArray(x)) x = x.filter((p) => p !== '' && p != null && typeof p !== 'number').join(' · '); else if (x && typeof x === 'object') x = x.label ?? x.name ?? x.groupValue ?? JSON.stringify(x); return x === '' || x == null ? `series${i}` : String(x); };

// Layout 1: events, sessions, segmentation  ->  data.xValues + data.series (+ labels)
function readSeries(body) {
  const d = body?.data;
  if (!d || !Array.isArray(d.xValues) || !Array.isArray(d.series)) return null;
  const labels = d.seriesLabels ?? d.seriesMeta ?? [];
  const dates = d.xValues.map((x) => String(x).slice(0, 10)), out = {};
  d.series.forEach((s, i) => { out[labelOf(labels[i], i)] = (Array.isArray(s) ? s : s?.values ?? []).map((p) => Number(p && typeof p === 'object' ? p.value : p)); });
  return { layout: 'series', dates, series: out };
}

// Layout 2: funnels  ->  data = [ { dayFunnels: { xValues, series, isComplete }, groupValue } ], one entry per group.
// Round 2 showed series is a list per DAY, each holding the step counts: series[day] = [step 1 count, step 2 count].
// (If a chart ever comes back the other way round, per step, that is handled too.)
function readFunnel(body) {
  const g = Array.isArray(body?.data) ? body.data : null;
  if (!g?.length || !g[0]?.dayFunnels?.xValues || !Array.isArray(g[0].dayFunnels.series)) return null;
  const dates = g[0].dayFunnels.xValues.map((x) => String(x).slice(0, 10)), n = dates.length, ratio = {}, direct = {};
  let orientation = '', steps = 0;
  g.forEach((grp, i) => {
    const ser = grp.dayFunnels.series;
    const dayMajor = Array.isArray(ser[0]) && ser.length === n;
    const at = (j, step) => Number(dayMajor ? ser[j]?.[step] : ser[step]?.[j]);
    steps = dayMajor ? (ser[0]?.length || 0) : ser.length;
    orientation = dayMajor ? 'one list per day, holding the step counts' : 'one list per step, holding daily counts';
    const label = grp.groupValue != null && grp.groupValue !== '' ? String(grp.groupValue) : g.length === 1 ? 'Overall' : `group${i}`;
    ratio[label] = dates.map((_, j) => (at(j, 0) > 0 ? at(j, steps - 1) / at(j, 0) : NaN));
    direct[label] = dates.map((_, j) => at(j, steps - 1));
  });
  const flags = g[0].dayFunnels.isComplete;
  return { layout: 'funnel', dates, series: ratio, alt: direct, steps, orientation, incompleteDays: Array.isArray(flags) ? dates.filter((_, j) => flags[j] === false) : [] };
}

async function call(fetchImpl, id, brand, sleep) {
  const order = [brand, brand === 'TP' ? 'RB' : 'TP'].filter((b) => creds(b));
  if (!order.length) return { error: 'no keys configured' };
  let last;
  for (const b of order) {
    const { k, s } = creds(b);
    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await fetchImpl(`https://amplitude.com/api/3/chart/${id}/query`, { headers: { Authorization: 'Basic ' + Buffer.from(`${k}:${s}`).toString('base64') } });
      last = { status: res.status, usedKeysOf: b, text: await res.text(), attempts: attempt };
      if (res.status === 429 && attempt < 3) { await sleep(4000 * attempt); continue; } // Amplitude limits how much query cost runs at once
      break;
    }
    if (last.status !== 400 && last.status !== 404) return last;
  }
  return last;
}

const worstDiff = (dates, vals, known) => { let w = 0, n = 0; for (const [d, want] of Object.entries(known)) { const i = dates.indexOf(d); if (i < 0 || !Number.isFinite(vals[i])) continue; n++; w = Math.max(w, Math.abs(vals[i] - want) / want); } return { n, w }; };
const findLabel = (labels, want) => { for (const w of want.split('|')) { const f = labels.find((l) => l.toLowerCase() === w.toLowerCase()); if (f) return f; } return undefined; };

async function check(fetchImpl, c, sleep) {
  const r = { chart: c.id, name: c.name };
  try {
    const got = await call(fetchImpl, c.id, c.brand, sleep);
    if (got.error) return { ...r, problem: got.error };
    r.status = got.status; r.usedKeysOf = got.usedKeysOf; if (got.attempts > 1) r.attempts = got.attempts;
    if (got.status !== 200) return { ...r, problem: `HTTP ${got.status}`, bodyStart: got.text.slice(0, 300) };
    let body; try { body = JSON.parse(got.text); } catch { return { ...r, problem: 'not JSON', bodyStart: got.text.slice(0, 300) }; }
    const read = readFunnel(body) || readSeries(body);
    if (!read) return { ...r, problem: 'unrecognised shape', structure: describe(body?.data) };
    const labels = Object.keys(read.series);
    r.layout = read.layout;
    r.read = { days: read.dates.length, first: read.dates[0], last: read.dates.at(-1), labels: labels.slice(0, 8), sample: Object.fromEntries(labels.slice(0, 3).map((l) => [l, read.series[l].slice(0, 3)])) };
    if (read.layout === 'funnel') { r.read.steps = read.steps; r.read.orientation = read.orientation; r.read.incompleteDays = read.incompleteDays; }
    if (c.known) {
      r.comparison = [];
      for (const [want, known] of Object.entries(c.known)) {
        const l = want === '*' ? labels[0] : findLabel(labels, want);
        if (!l) { r.comparison.push({ label: want, ok: false, note: `no series like "${want}"; have ${labels.join(', ')}` }); continue; }
        const a = worstDiff(read.dates, read.series[l], known);
        const b = read.alt ? worstDiff(read.dates, read.alt[l], known) : { n: 0, w: Infinity };
        const useAlt = b.n > 0 && b.w < a.w;
        const best = useAlt ? b : a;
        r.comparison.push({ label: want, matchedSeries: l, datesFound: best.n, worstDifferencePct: Number((best.w * 100).toFixed(3)), reading: read.layout === 'funnel' ? (useAlt ? 'last step used as the rate' : 'last step / first step') : 'values as given', ok: best.n > 0 && best.w < 0.02 });
      }
    } else r.note = 'no known numbers for this chart; checked only that it could be read';
  } catch (e) { r.problem = `error: ${e.message}`; }
  return r;
}

async function mapLimit(items, n, fn) { const out = new Array(items.length); let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } })); return out; }

export default async function handler(req, res, deps) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const out = { environment: process.env.VERCEL_ENV || 'unknown', keysPresent: { TP: !!creds('TP'), RB: !!creds('RB') } };
  if (process.env.VERCEL_ENV !== 'production' && !deps) { out.verdict = 'Only runs on the production deployment (the keys exist only there).'; return res.status(200).send(JSON.stringify(out, null, 2)); }
  const fetchImpl = deps?.fetch ?? fetch;
  const sleep = deps?.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  out.checks = await mapLimit(CHECKS, 1, async (c) => { // ms = how long Amplitude took, so we can plan the refresh
    const t0 = Date.now(); const r = await check(fetchImpl, c, sleep); r.ms = Date.now() - t0; return r; }); // one at a time: Amplitude rejected 3 at once (429)
  const bad = out.checks.filter((r) => r.problem || (r.comparison || []).some((x) => !x.ok));
  out.verdict = bad.length === 0 ? 'All six charts were read and every known number matched. Layouts: ' + [...new Set(out.checks.map((r) => r.layout))].join(', ') + '.'
    : bad.some((r) => r.status === 401 || r.status === 403) ? 'Amplitude rejected a key pair. Check the _TP_ and _RB_ variables.'
    : `${bad.length} chart(s) need a look (${bad.map((r) => r.chart).join(', ')}). Copy this whole page and send it back.`;
  return res.status(200).send(JSON.stringify(out, null, 2));
}