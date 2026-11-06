// One refresh: lock, find the baseline, fetch from Amplitude, merge, and (only in store mode) save a snapshot to Neon.
//   dry   = do everything except save. Nothing is written anywhere.
//   store = also save the result as a new snapshot (the page picks up the newest one).
import { lastCompleteBySite } from './dates.js';
import { merge } from './merge.js';
import { savedCharts, ADHOC } from './charts.js';
import { collectUpdates } from './fetch.js';
import { loadBaseline } from './baseline.js';
import { listArrays } from './paths.js';

function diffSummary(a, b) {
  const A = new Map(listArrays(a).map((x) => [x.path, x.arr])); let changed = 0, added = 0, biggest = null;
  for (const { path, arr } of listArrays(b)) {
    const old = A.get(path); if (!old) continue;
    added += Math.max(0, arr.length - old.length);
    for (let i = 0; i < Math.min(old.length, arr.length); i++) if (old[i] !== arr[i]) { changed++; const rel = old[i] ? Math.abs(arr[i] - old[i]) / Math.abs(old[i]) : 0; if (!biggest || rel > biggest.rel) biggest = { path, index: i, from: old[i], to: arr[i], rel: Number(rel.toFixed(4)) }; }
  }
  return { valuesChanged: changed, valuesAdded: added, biggestChange: biggest };
}

export async function runRefresh({ mode = 'dry', env = process.env, fetchImpl = fetch, sql, dir, now = new Date(), sleep, who = 'unknown', cooldownMin = Number(env.REFRESH_COOLDOWN_MIN || 15), acceptRevisions = false, extraSources = [] } = {}) {
  const t0 = Date.now(), report = { mode, ok: false };
  const finish = (extra) => ({ ...report, ...extra, seconds: Number(((Date.now() - t0) / 1000).toFixed(1)) });
  if (mode === 'store' && !sql) return finish({ errors: ['Saving needs the database, which is not configured.'] });

  let locked = false;
  if (sql) {
    const got = await sql`UPDATE cvr_refresh_lock SET started_at = now(), started_by = ${who} WHERE id = 1 AND (started_at IS NULL OR started_at < now() - interval '10 minutes') RETURNING started_at::text AS started_at`;
    if (!got.length) return finish({ refused: 'busy', errors: ['Another refresh is already running (or started in the last 10 minutes). Try again shortly.'] });
    locked = true;
  }
  try {
    if (sql && mode === 'store' && cooldownMin > 0) {
      const age = await sql`SELECT EXTRACT(EPOCH FROM (now() - created_at))::int AS age FROM cvr_snapshots ORDER BY created_at DESC LIMIT 1`;
      if (age.length && age[0].age < cooldownMin * 60) return finish({ refused: 'cooldown', errors: [`The last refresh was ${Math.round(age[0].age / 60)} minute(s) ago. To stay inside Amplitude's hourly limit, wait until ${cooldownMin} minutes have passed.`] });
    }
    const base = await loadBaseline({ sql, dir });
    const lastComplete = lastCompleteBySite(now);
    const baselineEnd = base.roots.D.asOf;
    Object.assign(report, { baseline: base.source, lastCompleteDay: lastComplete, baselineNotes: base.notes });
    const got = await collectUpdates({ charts: savedCharts(), adhoc: ADHOC, baselineEnd, lastComplete, env, fetchImpl, sleep });
    // Extra sources (for example the Maximum region queries) add to the same updates and can add their own errors.
    for (const src of extraSources) { const x = await src({ updates: got.updates, lastComplete, baselineEnd, env, fetchImpl, sleep }); got.errors.push(...(x.errors ?? [])); got.warnings.push(...(x.warnings ?? [])); got.requests += x.requests ?? 0; }
    report.requests = got.requests; report.fetchSeconds = Number((got.ms / 1000).toFixed(1));
    if (got.errors.length) return finish({ stage: 'fetch', errors: got.errors, warnings: got.warnings });
    const m = merge(base.roots, got.updates, { lastComplete, acceptRevisions });
    const common = { stage: 'merge', warnings: [...got.warnings, ...m.warnings], info: m.info };
    if (!m.ok) return finish({ ...common, errors: m.errors });
    const out = { ...common, ok: true, window: { start: m.start, end: m.end, days: m.days, newDays: m.newDays }, ...diffSummary(base.roots, m.roots) };
    if (mode !== 'store') return finish({ ...out, stored: false, note: 'Dry run: nothing was saved.' });
    const note = `refresh by ${who}; baseline ${base.source}; ${got.requests} requests`;
    const ins = await sql`INSERT INTO cvr_snapshots (as_of, payload, note) VALUES (${m.end}::date, ${JSON.stringify(m.roots)}::jsonb, ${note}) RETURNING id`;
    return finish({ ...out, stored: true, snapshotId: ins[0].id });
  } finally {
    if (locked) { try { await sql`UPDATE cvr_refresh_lock SET started_at = NULL WHERE id = 1`; } catch { /* the lock expires by itself after 10 minutes */ } }
  }
}