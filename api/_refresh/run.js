// One ROUND of a refresh. A refresh is the same work as before (fetch about 84 answers from Amplitude, merge, save) but split into rounds,
// each safely inside the function time limit, with every answer saved as it arrives. A slow or busy Amplitude just means more rounds.
//   dry   = do everything except save the snapshot.   store = also save it (the page picks up the newest snapshot).
import { lastCompleteBySite } from './dates.js';
import { merge } from './merge.js';
import { savedCharts, ADHOC } from './charts.js';
import { buildJobs, amplitudeGet } from './fetch.js';
import { readChart, addToUpdates } from './readers.js';
import { loadBaseline } from './baseline.js';
import { listArrays } from './paths.js';
import * as R from './runs.js';

const sleepReal = (ms) => new Promise((r) => setTimeout(r, ms));
const WAIT = { budget: 2, timeout: 30, busy: 60, hourly: 600, other: 10 }; // seconds the caller should wait before the next round

function diffSummary(a, b) {
  const A = new Map(listArrays(a).map((x) => [x.path, x.arr])); let changed = 0, added = 0, biggest = null;
  for (const { path, arr } of listArrays(b)) {
    const old = A.get(path); if (!old) continue;
    added += Math.max(0, arr.length - old.length);
    for (let i = 0; i < Math.min(old.length, arr.length); i++) if (old[i] !== arr[i]) { changed++; const rel = old[i] ? Math.abs(arr[i] - old[i]) / Math.abs(old[i]) : 0; if (!biggest || rel > biggest.rel) biggest = { path, index: i, from: old[i], to: arr[i], rel: Number(rel.toFixed(4)) }; }
  }
  return { valuesChanged: changed, valuesAdded: added, biggestChange: biggest };
}

export async function runRound({ mode = 'dry', runId = null, env = process.env, fetchImpl = fetch, sql, dir, now = new Date(), sleep = sleepReal, who = 'unknown',
  cooldownMin = Number(env.REFRESH_COOLDOWN_MIN || 15), acceptRevisions = false, extraJobs = [], budgetMs = 200000, hardMs = 270000, timeoutMs = 90000, paceMs = 250 } = {}) {
  const t0 = Date.now(), budgetEnd = t0 + budgetMs, hardEnd = t0 + hardMs, report = { mode, ok: false, status: 'failed' };
  const finish = (extra) => ({ ...report, ...extra, seconds: Number(((Date.now() - t0) / 1000).toFixed(1)) });
  if (!sql) return finish({ errors: ['The refresh needs the database, which is not configured.'] });

  await sql`INSERT INTO cvr_refresh_lock (id) VALUES (1) ON CONFLICT (id) DO NOTHING`; // make sure the lock row exists
  const got = await sql`UPDATE cvr_refresh_lock SET started_at = now(), started_by = ${who} WHERE id = 1 AND (started_at IS NULL OR started_at < now() - interval '6 minutes') RETURNING started_at::text AS started_at`;
  if (!got.length) {
    const held = await sql`SELECT started_at::text AS started_at, started_by FROM cvr_refresh_lock WHERE id = 1`;
    return finish({ refused: 'busy', status: 'refused', lock: held[0], errors: ['Another refresh round is running (or started in the last 6 minutes). Try again shortly.'] });
  }
  try {
    await R.purgeOld(sql);
    let run = await R.findRun(sql, runId ? { id: runId } : { mode });
    if (runId && !run) return finish({ errors: [`Refresh ${runId} was not found.`] });
    if (run && run.status !== 'running') return finish({ runId: run.id, status: run.status, ok: run.status === 'done', note: `That refresh already finished (${run.status}).` });
    const base = await loadBaseline({ sql, dir });
    const fail = async (errors, extra = {}) => { await R.finishRun(sql, run.id, 'failed', errors); return finish({ runId: run.id, status: 'failed', errors, ...extra }); };

    if (!run) {
      if (mode === 'store' && cooldownMin > 0) {
        const age = await sql`SELECT EXTRACT(EPOCH FROM (now() - created_at))::int AS age FROM cvr_snapshots ORDER BY created_at DESC LIMIT 1`;
        if (age.length && age[0].age < cooldownMin * 60) return finish({ refused: 'cooldown', status: 'refused', errors: [`The last refresh was ${Math.round(age[0].age / 60)} minute(s) ago. To stay inside Amplitude's hourly limit, wait until ${cooldownMin} minutes have passed.`] });
      }
      const lastComplete = lastCompleteBySite(now);
      const id = await R.createRun(sql, { mode, baselineEnd: base.roots.D.asOf, lastComplete, who });
      run = { id, mode, status: 'running', baseline_end: base.roots.D.asOf, last_complete: lastComplete, results: {}, fails: {}, rounds: 0 };
    } else if (base.roots.D.asOf !== run.baseline_end) {
      return fail(['The page data changed while this refresh was in progress (another refresh or an update landed). Start a new refresh.']);
    }
    await R.bumpRound(sql, run.id);
    Object.assign(report, { runId: run.id, baseline: base.source, lastCompleteDay: run.last_complete, baselineNotes: base.notes, round: run.rounds + 1 });
    console.log(`[refresh] round ${run.rounds + 1} of run ${run.id} (${mode}, by ${who}); baseline: ${base.source}`);

    const jobs = [...buildJobs({ charts: savedCharts(), adhoc: ADHOC, baselineEnd: run.baseline_end, lastComplete: run.last_complete }), ...extraJobs];
    let stop = null;
    for (const j of jobs) {
      if (run.results[j.key]) continue;
      if (Date.now() > budgetEnd) { stop = { kind: 'budget' }; break; }
      const t1 = Date.now();
      try {
        const { body, meta } = await amplitudeGet(j.url, j.brand, { env, fetchImpl, sleep, timeoutMs, deadlineAt: hardEnd });
        const read = readChart(body), errs = [];
        addToUpdates(new Map(), j.entry, read, errs); // checks the labels now, so a wrong chart fails the refresh early
        if (errs.length) return fail(errs);
        await R.saveResult(sql, run.id, j.key, read); run.results[j.key] = read;
        const extra = [meta.attempts > 1 ? `attempts ${meta.attempts}` : '', meta.cached != null ? `cached ${meta.cached}` : '', meta.amplitudeMs != null ? `amplitude ${meta.amplitudeMs}ms` : '', meta.throttleMs ? `throttled ${meta.throttleMs}ms` : ''].filter(Boolean).join(', ');
        console.log(`[refresh] ${Object.keys(run.results).length}/${jobs.length} ${j.label} ok ${Date.now() - t1}ms${extra ? ` (${extra})` : ''}`);
        if (paceMs) await sleep(paceMs);
      } catch (e) {
        console.log(`[refresh] ${j.label} ${e.kind ?? 'error'} after ${Date.now() - t1}ms: ${String(e.message).slice(0, 140)}`);
        if (e.kind === 'auth') return fail([`${j.label}: ${e.message}`, 'Stopped: Amplitude rejected the keys.']);
        if (['timeout', 'busy', 'budget', 'hourly'].includes(e.kind)) { stop = { kind: e.kind, label: j.label, message: e.message }; break; }
        const n = (run.fails[j.key] ?? 0) + 1; run.fails[j.key] = n; await R.saveFails(sql, run.id, run.fails);
        if (n >= 3) return fail([`${j.label}: ${e.message} (failed ${n} times)`]);
        stop = { kind: 'other', label: j.label, message: e.message }; break;
      }
    }
    const done = jobs.filter((j) => run.results[j.key]).length;
    if (done < jobs.length) {
      return finish({ status: 'running', progress: { done, total: jobs.length }, waitSeconds: WAIT[stop?.kind ?? 'budget'], pausedBecause: stop ? `${stop.kind}${stop.label ? ` at ${stop.label}` : ''}` : 'time budget', note: stop?.kind === 'hourly' ? "Amplitude's hourly limit is used up. Progress is saved; continue later." : 'Progress is saved. The next round continues from here.' });
    }

    // every answer is in: merge
    const updates = new Map(), errors = [], warnings = [];
    for (const j of jobs) addToUpdates(updates, j.entry, run.results[j.key], errors, warnings);
    if (errors.length) return fail(errors, { warnings });
    const m = merge(base.roots, updates, { lastComplete: run.last_complete, acceptRevisions });
    console.log(`[refresh] merge ok=${m.ok} errors=${m.errors.length}`);
    const common = { stage: 'merge', progress: { done, total: jobs.length }, warnings: [...warnings, ...m.warnings], info: m.info };
    if (!m.ok) return fail(m.errors, common);
    const out = { ...common, ok: true, status: 'done', window: { start: m.start, end: m.end, days: m.days, newDays: m.newDays }, ...diffSummary(base.roots, m.roots) };
    if (mode !== 'store') { await R.finishRun(sql, run.id, 'done', []); return finish({ ...out, stored: false, note: 'Dry run: nothing was saved.' }); }
    const note = `refresh by ${who}; baseline ${base.source}; ${jobs.length} requests over ${run.rounds + 1} round(s)`;
    const ins = await sql`INSERT INTO cvr_snapshots (as_of, payload, note) VALUES (${m.end}::date, ${JSON.stringify(m.roots)}::jsonb, ${note}) RETURNING id`;
    await R.finishRun(sql, run.id, 'done', []);
    return finish({ ...out, stored: true, snapshotId: ins[0].id });
  } finally {
    try { await sql`UPDATE cvr_refresh_lock SET started_at = NULL WHERE id = 1`; } catch { /* the lock expires by itself after 6 minutes */ }
  }
}