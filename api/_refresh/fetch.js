// Talks to Amplitude, ONE request at a time, and waits for slow answers instead of abandoning them
// (an abandoned query keeps running at Amplitude and keeps counting against its limit, which snowballs).
import { addDays } from './dates.js';

const sleepReal = (ms) => new Promise((r) => setTimeout(r, ms));
const creds = (env, b) => { const k = env[`AMPLITUDE_${b.toUpperCase()}_API_KEY`], s = env[`AMPLITUDE_${b.toUpperCase()}_SECRET_KEY`]; return k && s ? { k, s } : null; };
export const chartUrl = (id) => `https://amplitude.com/api/3/chart/${id}/query`;
export const segmentationUrl = (q, start, end) => `https://amplitude.com/api/2/events/segmentation?${new URLSearchParams({ e: JSON.stringify(q.event), m: q.metric, start: start.replaceAll('-', ''), end: end.replaceAll('-', ''), i: '1' })}`;

// Everything one refresh has to fetch: the saved charts and the ad-hoc queries. Each job has a stable key, so progress can be saved and resumed.
export function buildJobs({ charts, adhoc, baselineEnd, lastComplete }) {
  const lastDay = lastComplete.tp > lastComplete.rb ? lastComplete.tp : lastComplete.rb;
  const a = addDays(lastDay, -39), b = addDays(baselineEnd, -7), start = a < b ? a : b; // enough history to cover the gap and to check revisions
  return [
    ...charts.map((c) => ({ key: c.id, entry: c, label: `${c.view} ${c.brand} ${c.role} (${c.id})`, url: chartUrl(c.id), brand: c.brand })),
    ...adhoc.map((q) => ({ key: `q:${q.key}`, entry: q, label: `query ${q.key}`, url: segmentationUrl(q, start, lastDay), brand: q.brand })),
  ];
}

const problem = (kind, message) => Object.assign(new Error(message), { kind }); // kind: auth | timeout | busy | hourly | budget | other

// Keys of the chart's own project first; a 400 or 404 means it belongs to the other project, so try those keys.
// A 429 waits 10s, then 30s. Nothing here starts a request or a wait that would run past `deadlineAt`.
export async function amplitudeGet(url, brand, { env, fetchImpl, sleep = sleepReal, timeoutMs = 90000, deadlineAt = Infinity }) {
  const order = [brand, brand === 'tp' ? 'rb' : 'tp'].filter((b) => creds(env, b));
  if (!order.length) throw problem('auth', 'No Amplitude keys are configured');
  let last, attempts = 0;
  for (const b of order) {
    const { k, s } = creds(env, b);
    for (let attempt = 1; attempt <= 3; attempt++) {
      const room = deadlineAt - Date.now();
      if (room < 2000) throw problem('budget', 'out of time in this round; it will continue in the next one');
      const ms = Math.min(timeoutMs, room), stop = new AbortController(), timer = setTimeout(() => stop.abort(), ms);
      let res;
      try {
        res = await fetchImpl(url, { headers: { Authorization: 'Basic ' + Buffer.from(`${k}:${s}`).toString('base64') }, signal: stop.signal });
        last = { status: res.status, text: await res.text() };
      } catch (e) {
        if (stop.signal.aborted || e?.name === 'TimeoutError' || e?.name === 'AbortError') throw problem('timeout', `no answer after ${Math.round(ms / 1000)}s (Amplitude may still be computing it; it will be tried again in the next round)`);
        throw e;
      } finally { clearTimeout(timer); }
      attempts++;
      if (res.status === 429 && /hour/i.test(last.text)) throw problem('hourly', `Amplitude's hourly limit is used up: ${last.text.slice(0, 120)}`);
      if (res.status === 429) {
        const wait = attempt === 1 ? 10000 : 30000;
        if (attempt === 3 || Date.now() + wait + 2000 > deadlineAt) throw problem('busy', 'Amplitude is busy (429); it will be tried again in the next round');
        console.log(`[refresh] Amplitude said slow down (429); waiting ${wait / 1000}s before retry ${attempt + 1}`);
        await sleep(wait); continue;
      }
      break;
    }
    if (last.status !== 400 && last.status !== 404) break;
  }
  if (last.status === 401 || last.status === 403) throw problem('auth', `HTTP ${last.status}: ${last.text.slice(0, 120)}`);
  if (last.status !== 200) throw problem('other', `HTTP ${last.status}: ${last.text.slice(0, 160)}`);
  let body; try { body = JSON.parse(last.text); } catch { throw problem('other', 'the response was not JSON'); }
  // Amplitude's own timing, when it reports it: shows whether a slow answer was computing, throttling or a cold cache.
  return { body, meta: { attempts, cached: body?.wasCached, amplitudeMs: body?.novaRuntime ?? body?.novaRequestDuration, throttleMs: body?.throttleTime } };
}