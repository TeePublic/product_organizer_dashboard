// Talks to Amplitude, ONE request at a time (Amplitude rejects too many at once), and turns the answers into updates for the merge.
import { addDays } from './dates.js';
import { readChart, addToUpdates } from './readers.js';

const sleepReal = (ms) => new Promise((r) => setTimeout(r, ms));
const creds = (env, b) => { const k = env[`AMPLITUDE_${b.toUpperCase()}_API_KEY`], s = env[`AMPLITUDE_${b.toUpperCase()}_SECRET_KEY`]; return k && s ? { k, s } : null; };
export const chartUrl = (id) => `https://amplitude.com/api/3/chart/${id}/query`;
export const segmentationUrl = (q, start, end) => `https://amplitude.com/api/2/events/segmentation?${new URLSearchParams({ e: JSON.stringify(q.event), m: q.metric, start: start.replaceAll('-', ''), end: end.replaceAll('-', ''), i: '1' })}`;

// Keys of the chart's own project first; a 400 or 404 means it belongs to the other project, so try those keys. A 429 waits and retries.
export async function amplitudeGet(url, brand, { env, fetchImpl, sleep, timeoutMs = 30000 }) {
  const order = [brand, brand === 'tp' ? 'rb' : 'tp'].filter((b) => creds(env, b));
  if (!order.length) throw new Error('No Amplitude keys are configured');
  let last, attempts = 0;
  for (const b of order) {
    const { k, s } = creds(env, b);
    for (let attempt = 1; attempt <= 3; attempt++) {
      let res;
      const stop = new AbortController(), timer = setTimeout(() => stop.abort(), timeoutMs);
      try {
        res = await fetchImpl(url, { headers: { Authorization: 'Basic ' + Buffer.from(`${k}:${s}`).toString('base64') }, signal: stop.signal });
        last = { status: res.status, text: await res.text() };
      } catch (e) {
        if (stop.signal.aborted || e?.name === 'TimeoutError' || e?.name === 'AbortError') throw new Error(`timed out after ${Math.round(timeoutMs / 1000)}s waiting for Amplitude`);
        throw e;
      } finally { clearTimeout(timer); }
      if (res.status === 429 && /hour/i.test(last.text)) throw new Error(`HTTP 429 (Amplitude's hourly limit is used up): ${last.text.slice(0, 140)}`); // retrying cannot help
      attempts++;
      if (res.status === 429 && attempt < 3) { console.log(`[refresh] Amplitude said slow down (429); waiting ${4 * attempt}s before retry ${attempt + 1}`); await sleep(4000 * attempt); continue; }
      break;
    }
    if (last.status !== 400 && last.status !== 404) break;
  }
  if (last.status !== 200) throw new Error(`HTTP ${last.status}${last.status === 429 ? ' (still rate limited after 3 tries)' : ''}: ${last.text.slice(0, 160)}`);
  let body; try { body = JSON.parse(last.text); } catch { throw new Error('the response was not JSON'); }
  // Amplitude's own timing, when it reports it: tells us whether a slow answer was computing, throttling or a cold cache.
  return { body, meta: { attempts, cached: body?.wasCached, amplitudeMs: body?.novaRuntime ?? body?.novaRequestDuration, throttleMs: body?.throttleTime } };
}

export async function collectUpdates({ charts, adhoc, baselineEnd, lastComplete, env, fetchImpl, sleep = sleepReal, timeoutMs = 30000, deadlineMs = 240000 }) {
  const updates = new Map(), errors = [], warnings = [], t0 = Date.now();
  let requests = 0, aborted = false;
  const lastDay = lastComplete.tp > lastComplete.rb ? lastComplete.tp : lastComplete.rb;
  const a = addDays(lastDay, -39), b = addDays(baselineEnd, -7), start = a < b ? a : b; // enough history to cover the gap and to check revisions
  const jobs = [
    ...charts.map((c) => ({ entry: c, label: `${c.view} ${c.brand} ${c.role} (${c.id})`, url: chartUrl(c.id), brand: c.brand })),
    ...adhoc.map((q) => ({ entry: q, label: `query ${q.key}`, url: segmentationUrl(q, start, lastDay), brand: q.brand })),
  ];
  for (const j of jobs) {
    if (aborted) break;
    if (Date.now() - t0 > deadlineMs) { errors.push(`Ran out of time after ${requests} of ${jobs.length} requests (limit ${Math.round(deadlineMs / 1000)}s); stopped before ${j.label}.`); break; }
    const t1 = Date.now();
    try {
      requests++;
      const { body, meta } = await amplitudeGet(j.url, j.brand, { env, fetchImpl, sleep, timeoutMs });
      addToUpdates(updates, j.entry, readChart(body), errors, warnings);
      const extra = [meta.attempts > 1 ? `attempts ${meta.attempts}` : '', meta.cached != null ? `cached ${meta.cached}` : '', meta.amplitudeMs != null ? `amplitude ${meta.amplitudeMs}ms` : '', meta.throttleMs ? `throttled ${meta.throttleMs}ms` : ''].filter(Boolean).join(', ');
      console.log(`[refresh] ${requests}/${jobs.length} ${j.label} ok ${Date.now() - t1}ms${extra ? ` (${extra})` : ''}`); // visible in the Vercel logs while it runs
    } catch (e) {
      errors.push(`${j.label}: ${e.message}`);
      console.log(`[refresh] ${requests}/${jobs.length} ${j.label} FAILED ${Date.now() - t1}ms: ${e.message.slice(0, 120)}`);
      if (/HTTP (401|403)/.test(e.message) || /No Amplitude keys/.test(e.message)) { aborted = true; errors.push('Stopped early: Amplitude rejected the keys, so the remaining requests were not sent.'); }
      else if (/hourly limit/.test(e.message)) { aborted = true; errors.push('Stopped early: Amplitude\'s hourly limit is used up, so the remaining requests were not sent. Try again in about an hour.'); }
    }
  }
  return { updates, errors, warnings, requests, ms: Date.now() - t0 };
}