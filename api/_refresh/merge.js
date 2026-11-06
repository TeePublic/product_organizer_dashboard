// The merge: takes what the page shows now (baseline) plus fresh numbers from Amplitude (updates) and produces the next snapshot,
// or refuses with a clear list of what is wrong. Pure logic: no network, no files, no database.
//
// Rules, in plain words:
//  * Merge BY DATE. Fresh values replace old ones for the same day; days nobody refreshed keep their old values.
//  * The start date stays where it is (Aug 1) and the end grows. Every aligned array moves together, so nothing slips out of line.
//  * Last year (tpLY) is never touched.
//  * Only days that are finished in each site's own time zone are used; both sites share one end date.
//  * If any series cannot reach the new end date, or an older day moved a lot, nothing is produced.
import { addDays, diffDays, datesFrom } from './dates.js';
import { getAt, setAt, listArrays, tokens } from './paths.js';

export const VIEWS = { strong: { D: 'D', L: 'L' }, max: { D: 'MAX.D', L: 'MAX.L' }, mod: { D: 'STD.D', L: 'STD.L' } };
export const PRIMARY = Object.values(VIEWS).flatMap((v) => ['tp', 'rb'].flatMap((b) => ['cvr', 'sess'].map((f) => `${v.D}.${b}.${f}`)));
const MAIN = [/^(D|MAX\.D|STD\.D)\.(tp|rb)\.(cvr|sess)$/, /^(L|MAX\.L|STD\.L)\.(tp|rb)[.[]/, /^(R|ORD)\.(tp|rb)$/];
const PAY = /^D\.pay\.(tp|rb)[.[]/;
export const isMain = (p) => MAIN.some((r) => r.test(p));
export const isPay = (p) => PAY.test(p);
const brandOf = (p) => (/(^|\.)tp(\.|\[|$)/.test(p) ? 'tp' : 'rb');
const trunc6 = (x) => Math.floor(x * 1e6 + 1e-9) / 1e6;

// The file conventions: CVR-type numbers keep 6 decimals (cut, not rounded); sessions, revenue, orders and payments are whole numbers.
export function conv(path, v) {
  if (/(^D\.pay\.)|^R\.|^ORD\./.test(path)) return Math.round(v);
  if (/\.(cvr|v)$/.test(path)) return trunc6(v);
  return Math.round(v);
}

const clone = (x) => JSON.parse(JSON.stringify(x));
const short = (list, n = 6) => list.slice(0, n).join(', ') + (list.length > n ? `, and ${list.length - n} more` : '');

export function merge(baseline, updates, { lastComplete, warnRev = 0.01, failRev = 0.05, acceptRevisions = false } = {}) {
  const errors = [], warnings = [], info = [];
  const roots = clone(baseline);
  const result = (ok, extra = {}) => ({ ok, errors, warnings, info, ...extra });

  // ---- 1. the baseline must be in line with itself ----
  const start = roots.D.tp.start, N0 = roots.D.tp.cvr.length, baseEnd = addDays(start, N0 - 1);
  if (roots.D.rb.start !== start) errors.push(`D.tp.start (${start}) and D.rb.start (${roots.D.rb.start}) differ.`);
  const all = listArrays(roots), mainPaths = all.filter((a) => isMain(a.path)), payPaths = all.filter((a) => isPay(a.path));
  const off = mainPaths.filter((a) => a.arr.length !== N0).map((a) => `${a.path} (${a.arr.length})`);
  if (off.length) errors.push(`These arrays do not have ${N0} days like D.tp.cvr, so the current data is out of line: ${short(off)}.`);
  if (errors.length) return result(false);

  // ---- 2. check what we were given, and keep only finished days ----
  const bad = [...updates.keys()].filter((p) => !(isMain(p) || isPay(p)) || !Array.isArray(getAt(roots, p)));
  if (bad.length) errors.push(`These targets do not exist in the data: ${short(bad)}.`);
  const missingPrimary = PRIMARY.filter((p) => !updates.has(p));
  if (missingPrimary.length) errors.push(`The overall CVR and sessions series are missing for: ${short(missingPrimary)}.`);
  if (errors.length) return result(false);
  const upd = new Map();
  for (const [p, m] of updates) {
    const cutoff = lastComplete[brandOf(p)];
    const keep = new Map([...m].filter(([d]) => d >= start && d <= cutoff && Number.isFinite(m.get(d))));
    upd.set(p, keep);
  }

  // ---- 3. the new end date: the latest day every overall series has, for both sites ----
  const lastOf = (p) => [...upd.get(p).keys()].sort().pop();
  const ends = PRIMARY.map((p) => [p, lastOf(p)]);
  const end = ends.map((x) => x[1]).sort()[0];
  if (!end) { errors.push('No finished days came back from Amplitude.'); return result(false); }
  if (end < baseEnd) { errors.push(`The newest finished day Amplitude returned (${end}) is older than the data already in the page (${baseEnd}).`); return result(false); }
  const lagging = ends.filter((x) => x[1] === end && ends.some((y) => y[1] > end)).map((x) => x[0]);
  if (lagging.length) warnings.push(`The end date was held at ${end} by: ${short(lagging)} (others had newer days).`);
  for (const m of upd.values()) for (const d of [...m.keys()]) if (d > end) m.delete(d);
  const N = diffDays(end, start) + 1, wanted = datesFrom(start, N);

  // ---- 4. rebuild every aligned array, collecting gaps and big revisions ----
  const built = new Map(), gaps = {}, failures = [], softs = [];
  const guard = (p, d, oldV, newV) => {
    if (diffDays(end, d) <= 7 || !Number.isFinite(oldV) || Math.abs(oldV) < 1e-9) return;
    const rel = Math.abs(newV - oldV) / Math.abs(oldV);
    if (rel > failRev) failures.push({ p, d, oldV, newV, rel }); else if (rel > warnV) softs.push({ p, d, rel });
  };
  const warnV = warnRev;
  for (const { path: p, arr } of mainPaths) {
    const u = upd.get(p), out = [], miss = [];
    for (const d of wanted) {
      const j = diffDays(d, start);
      if (u?.has(d)) { const nv = conv(p, u.get(d)); if (j < N0) guard(p, d, arr[j], nv); out.push(nv); }
      else if (j < N0) out.push(arr[j]);
      else { out.push(null); miss.push(d); }
    }
    if (miss.length) gaps[p] = miss; else built.set(p, out);
  }

  // ---- 5. payments: a rolling window as long as before, ending on the same day ----
  const NP = payPaths[0]?.arr.length ?? 30, payStart = addDays(end, -(NP - 1)), oldPayStart = roots.D.pay.start;
  if (payPaths.some((a) => upd.has(a.path))) {
    const wantedPay = datesFrom(payStart, NP);
    for (const { path: p, arr } of payPaths) {
      const u = upd.get(p), out = [], miss = [];
      for (const d of wantedPay) {
        const j = diffDays(d, oldPayStart);
        if (u?.has(d)) { const nv = conv(p, u.get(d)); if (j >= 0 && j < arr.length) guard(p, d, arr[j], nv); out.push(nv); }
        else if (j >= 0 && j < arr.length) out.push(arr[j]);
        else { out.push(null); miss.push(d); }
      }
      if (miss.length) gaps[p] = miss; else built.set(p, out);
    }
  } else info.push('No payment numbers came back, so payments were left as they were.');

  // ---- 6. refuse, or apply ----
  const gapPaths = Object.keys(gaps);
  if (gapPaths.length) {
    errors.push(`${gapPaths.length} series could not be brought up to ${end}, because nothing came back for the missing days:`);
    for (const p of gapPaths.slice(0, 40)) errors.push(`   ${p}: missing ${gaps[p].length} day(s) starting ${gaps[p][0]}`);
    if (gapPaths.length > 40) errors.push(`   ...and ${gapPaths.length - 40} more`);
  }
  if (failures.length && !acceptRevisions) {
    errors.push(`${failures.length} older day(s) changed by more than ${(failRev * 100).toFixed(0)}% against what the page has now. That usually means a chart was changed or mapped to the wrong field:`);
    failures.sort((a, b) => b.rel - a.rel).slice(0, 12).forEach((f) => errors.push(`   ${f.p} ${f.d}: ${f.oldV} -> ${f.newV} (${(f.rel * 100).toFixed(1)}%)`));
  } else if (failures.length) warnings.push(`${failures.length} large revisions were accepted.`);
  if (errors.length) return result(false, { gaps, failures });
  if (softs.length) warnings.push(`${softs.length} older value(s) moved by ${(warnV * 100).toFixed(0)}% to ${(failRev * 100).toFixed(0)}% (late data); largest: ${softs.sort((a, b) => b.rel - a.rel).slice(0, 3).map((s) => `${s.p} ${s.d} ${(s.rel * 100).toFixed(1)}%`).join(', ')}.`);

  for (const [p, arr] of built) setAt(roots, p, arr);
  roots.D.asOf = end;
  if (built.size && [...built.keys()].some(isPay)) roots.D.pay.start = payStart;
  // D.slices is always the last 14 days of L (it is derived, never fetched separately)
  const sl = roots.D.slices;
  for (const b of ['tp', 'rb']) for (const dim of Object.keys(sl[b] || {})) for (const k of Object.keys(sl[b][dim])) for (const f of Object.keys(sl[b][dim][k])) {
    const src = roots.L[b]?.[dim]?.[k]?.[f];
    if (!Array.isArray(src) || src.length < 14) { warnings.push(`D.slices.${b}.${dim}['${k}'].${f} could not be rebuilt and was left alone.`); continue; }
    sl[b][dim][k][f] = src.slice(-14);
  }
  sl.start = addDays(end, -13);
  info.push(`Window ${start} .. ${end} (${N} days, ${N - N0} new); payments ${roots.D.pay.start}; ${built.size} series rebuilt; last year untouched.`);
  return result(true, { roots, start, end, days: N, newDays: N - N0, rebuilt: built.size });
}