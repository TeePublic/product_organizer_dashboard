// STEP 4a: a one-off check that the Amplitude keys work and that Amplitude's answer matches numbers we already know.
// It reads three charts and prints a report. It stores nothing and changes nothing. Delete this file after step 4b.
// It sits behind the Okta sign-in like the rest of the site. Open it in a browser tab while signed in.

const CHECKS = [
  { id: 't50lzd6f', name: 'TP · Sitewide CVR (bot ≥70)', brand: 'TP',
    known: { '2026-10-05': 0.018520122658997593, '2026-10-12': 0.029016013759787393, '2026-10-19': 0.02166986177858312, '2026-10-24': 0.030500964713598266 } },
  { id: 'ebr0nnlc', name: 'TP · Daily Sessions (bot ≥70)', brand: 'TP',
    known: { '2026-10-05': 274699, '2026-10-12': 201191, '2026-10-19': 276553, '2026-10-24': 313533 } },
  { id: 'hv3jdftd', name: 'RB · Sitewide CVR (bot ≥70 · excl. JA4 cb7bf)', brand: 'RB', sanity: [0.001, 0.1] },
];

const creds = (b) => {
  const k = process.env[`AMPLITUDE_${b}_API_KEY`], s = process.env[`AMPLITUDE_${b}_SECRET_KEY`];
  return k && s ? { k, s } : null;
};

// Same reading rules the refresh will use later; if the shape is not what we expect we say so instead of guessing.
function adapt(body) {
  const d = body?.data ?? body;
  const xs = d?.xValues ?? d?.x_values, ser = d?.series;
  if (!Array.isArray(xs) || !Array.isArray(ser)) return { error: 'unrecognised shape', topKeys: Object.keys(body || {}), dataKeys: Object.keys(d || {}) };
  const labels = d.seriesLabels ?? d.seriesMeta ?? [];
  const dates = xs.map((x) => String(x).slice(0, 10));
  const series = ser.map((s, i) => {
    let label = labels[i]; if (Array.isArray(label)) label = label.filter(Boolean).join(' · ');
    return { label: String(label ?? `series${i}`), values: (Array.isArray(s) ? s : s?.values ?? s?.data ?? []).map((p) => Number(p && typeof p === 'object' ? p.value : p)) };
  });
  return { dates, series };
}

async function call(fetchImpl, id, brand) {
  const order = [brand, brand === 'TP' ? 'RB' : 'TP'].filter((b) => creds(b));
  if (!order.length) return { error: 'no keys configured' };
  let last;
  for (const b of order) {
    const { k, s } = creds(b);
    const res = await fetchImpl(`https://amplitude.com/api/3/chart/${id}/query`, { headers: { Authorization: 'Basic ' + Buffer.from(`${k}:${s}`).toString('base64') } });
    const text = await res.text();
    last = { status: res.status, usedKeysOf: b, text };
    if (res.status !== 400 && res.status !== 404) return last; // 400/404 = chart belongs to the other project; try the other keys
  }
  return last;
}

export default async function handler(req, res, deps) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const out = { environment: process.env.VERCEL_ENV || 'unknown', keysPresent: { TP: !!creds('TP'), RB: !!creds('RB') }, checks: [] };
  if (process.env.VERCEL_ENV !== 'production' && !deps) { out.verdict = 'Only runs on the production deployment (the keys exist only there).'; return res.status(200).send(JSON.stringify(out, null, 2)); }
  const fetchImpl = deps?.fetch ?? fetch;
  for (const c of CHECKS) {
    const r = { chart: c.id, name: c.name };
    try {
      const got = await call(fetchImpl, c.id, c.brand);
      if (got.error) { r.problem = got.error; out.checks.push(r); continue; }
      r.status = got.status; r.usedKeysOf = got.usedKeysOf;
      if (got.status !== 200) { r.problem = `HTTP ${got.status}`; r.bodyStart = got.text.slice(0, 300); out.checks.push(r); continue; }
      let body; try { body = JSON.parse(got.text); } catch { r.problem = 'not JSON'; r.bodyStart = got.text.slice(0, 300); out.checks.push(r); continue; }
      const a = adapt(body);
      if (a.error) { r.problem = a.error; r.topKeys = a.topKeys; r.dataKeys = a.dataKeys; r.bodyStart = got.text.slice(0, 800); out.checks.push(r); continue; }
      const s0 = a.series[0];
      r.shape = { days: a.dates.length, first: a.dates[0], last: a.dates.at(-1), seriesCount: a.series.length, seriesLabel: s0.label };
      if (c.known) {
        let worst = 0, n = 0;
        for (const [d, want] of Object.entries(c.known)) { const i = a.dates.indexOf(d); if (i < 0) continue; n++; worst = Math.max(worst, Math.abs(s0.values[i] - want) / want); }
        r.comparison = { knownDatesFound: n, worstDifferencePct: Number((worst * 100).toFixed(3)), ok: n > 0 && worst < 0.02 };
      } else {
        const v = s0.values.filter((x) => Number.isFinite(x));
        r.sanity = { min: Math.min(...v), max: Math.max(...v), ok: v.length > 30 && Math.min(...v) >= c.sanity[0] && Math.max(...v) <= c.sanity[1] };
      }
    } catch (e) { r.problem = `error: ${e.message}`; }
    out.checks.push(r);
  }
  const bad = out.checks.filter((r) => r.problem || r.comparison?.ok === false || r.sanity?.ok === false);
  out.verdict = bad.length === 0 ? 'All three charts came back and the numbers match. The keys work and the response shape is understood.'
    : bad.some((r) => r.status === 401 || r.status === 403) ? 'Amplitude rejected a key pair. Check that the TeePublic pair is in the _TP_ variables and the Redbubble pair in the _RB_ ones, and that each secret was copied whole.'
    : 'Something needs a look: copy this whole page and send it back.';
  return res.status(200).send(JSON.stringify(out, null, 2));
}