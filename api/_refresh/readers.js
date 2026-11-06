// Turns Amplitude's answers into { dates, series: { label: [numbers] } }, then into updates for the merge.
// Layouts confirmed against your real projects: funnels (data = list of groups, each with dayFunnels) and
// events/sessions/segmentation (data.xValues + data.series + data.seriesLabels).
const clean = (x, i) => {
  if (Array.isArray(x)) x = x.filter((p) => p !== '' && p != null && typeof p !== 'number').join(' | ');
  else if (x && typeof x === 'object') x = x.label ?? x.name ?? x.groupValue ?? JSON.stringify(x);
  return x === '' || x == null ? `series${i}` : String(x);
};

export function readChart(body) {
  const g = Array.isArray(body?.data) ? body.data : null;
  if (g?.length && g[0]?.dayFunnels?.xValues && Array.isArray(g[0].dayFunnels.series)) {
    const dates = g[0].dayFunnels.xValues.map((x) => String(x).slice(0, 10)), n = dates.length, series = {};
    g.forEach((grp, i) => {
      const ser = grp.dayFunnels.series, dayMajor = Array.isArray(ser[0]) && ser.length === n; // normally: one list per day holding the step counts
      const at = (j, step) => Number(dayMajor ? ser[j]?.[step] : ser[step]?.[j]);
      const steps = dayMajor ? ser[0]?.length || 0 : ser.length;
      const label = grp.groupValue != null && grp.groupValue !== '' ? String(grp.groupValue) : g.length === 1 ? 'Overall' : `group${i}`;
      series[label] = dates.map((_, j) => (at(j, 0) > 0 ? at(j, steps - 1) / at(j, 0) : NaN)); // conversion = last step / first step
    });
    return { layout: 'funnel', dates, series, incompleteDays: Array.isArray(g[0].dayFunnels.isComplete) ? dates.filter((_, j) => g[0].dayFunnels.isComplete[j] === false) : [] };
  }
  const d = body?.data;
  if (d && Array.isArray(d.xValues) && Array.isArray(d.series)) {
    const labels = d.seriesLabels ?? d.seriesMeta ?? [], dates = d.xValues.map((x) => String(x).slice(0, 10)), series = {};
    d.series.forEach((s, i) => {
      const label = clean(labels[i], i);
      const vals = (Array.isArray(s) ? s : s?.values ?? []).map((p) => Number(p && typeof p === 'object' ? p.value : p));
      series[series[label] ? `${label} #${i}` : label] = vals;
    });
    return { layout: 'series', dates, series, incompleteDays: [] };
  }
  throw new Error(`Unrecognised response layout (top-level keys: ${Object.keys(body || {}).slice(0, 8).join(', ') || 'none'})`);
}

// Redbubble payment labels -> the page's buckets. null = an order type the page does not count; undefined = a label we have never seen.
export function paymentBucket(label) {
  const t = label.toLowerCase();
  if (t.startsWith('zero amount') || t.startsWith('(none)')) return null;
  if (t.includes('klarna') || t.includes('afterpay')) return 'Klarna, Afterpay';
  if (t.includes('paypal')) return 'PayPal';
  if (t.includes('apple')) return 'Apple Pay';
  if (t.includes('google')) return 'Google Pay';
  if (t.startsWith('stripe')) return 'Card'; // Stripe with no wallet, or the Link wallet
  return undefined;
}

function put(updates, path, dates, vals, errors, where) {
  if (updates.has(path)) { errors.push(`${path} is fed twice (${where}).`); return; }
  const m = new Map();
  dates.forEach((d, i) => { if (Number.isFinite(vals[i])) m.set(d, vals[i]); });
  updates.set(path, m);
}

// Adds one chart's (or query's) series to `updates` under the targets in `entry`.
export function addToUpdates(updates, entry, read, errors, warnings = []) {
  const where = entry.id ?? entry.key, labels = Object.keys(read.series);
  if (entry.payments) {
    const sums = {}, unmapped = [];
    labels.forEach((l) => {
      const b = paymentBucket(l);
      if (b === undefined) { unmapped.push(l); return; }
      if (b === null) return;
      sums[b] ??= read.dates.map(() => 0);
      read.series[l].forEach((v, j) => { sums[b][j] += Number(v) || 0; });
    });
    if (unmapped.length) warnings.push(`${where}: payment labels not recognised and left out: ${unmapped.join('; ')}.`);
    for (const [bucket, path] of Object.entries(entry.targets)) { if (!sums[bucket]) { errors.push(`${where}: no orders found for "${bucket}". Labels: ${labels.join('; ')}.`); continue; } put(updates, path, read.dates, sums[bucket], errors, where); }
    return;
  }
  if ('default' in entry.targets) {
    if (labels.length !== 1) { errors.push(`${where}: expected one series, got ${labels.length} (${labels.slice(0, 6).join(', ')}).`); return; }
    return put(updates, entry.targets.default, read.dates, read.series[labels[0]], errors, where);
  }
  const used = new Set();
  for (const [lab, path] of Object.entries(entry.targets)) {
    const got = labels.find((l) => l === lab) ?? labels.find((l) => l.toLowerCase() === lab.toLowerCase());
    if (!got) { errors.push(`${where}: no series "${lab}". Found: ${labels.join(', ')}.`); continue; }
    used.add(got); put(updates, path, read.dates, read.series[got], errors, where);
  }
  const extra = labels.filter((l) => !used.has(l));
  if (extra.length) warnings.push(`${where}: unexpected series ignored: ${extra.join(', ')}.`);
}