// Talks to Amplitude, ONE request at a time (Amplitude rejects too many at once), and turns the answers into updates for the merge.
import { addDays } from './dates.js';
import { readChart, addToUpdates } from './readers.js';

const sleepReal = (ms) => new Promise((r) => setTimeout(r, ms));
const creds = (env, b) => { const k = env[`AMPLITUDE_${b.toUpperCase()}_API_KEY`], s = env[`AMPLITUDE_${b.toUpperCase()}_SECRET_KEY`]; return k && s ? { k, s } : null; };
export const chartUrl = (id) => `https://amplitude.com/api/3/chart/${id}/query`;
export const segmentationUrl = (q, start, end) => `https://amplitude.com/api/2/events/segmentation?${new URLSearchParams({ e: JSON.stringify(q.event), m: q.metric, start: start.replaceAll('-', ''), end: end.replaceAll('-', ''), i: '1' })}`;

// Keys of the chart's own project first; a 400 or 404 means it belongs to the other project, so try those keys. A 429 waits and retries.
export async function amplitudeGet(url, brand, { env, fetchImpl, sleep }) {
  const order = [brand, brand === 'tp' ? 'rb' : 'tp'].filter((b) => creds(env, b));
  if (!order.length) throw new Error('No Amplitude keys are configured');
  let last;
  for (const b of order) {
    const { k, s } = creds(env, b);
    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await fetchImpl(url, { headers: { Authorization: 'Basic ' + Buffer.from(`${k}:${s}`).toString('base64') } });
      last = { status: res.status, text: await res.text() };
      if (res.status === 429 && attempt < 3) { await sleep(4000 * attempt); continue; }
      break;
    }
    if (last.status !== 400 && last.status !== 404) break;
  }
  if (last.status !== 200) throw new Error(`HTTP ${last.status}${last.status === 429 ? ' (still rate limited after 3 tries)' : ''}: ${last.text.slice(0, 160)}`);
  try { return JSON.parse(last.text); } catch { throw new Error('the response was not JSON'); }
}

export async function collectUpdates({ charts, adhoc, baselineEnd, lastComplete, env, fetchImpl, sleep = sleepReal }) {
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
    try {
      requests++;
      const body = await amplitudeGet(j.url, j.brand, { env, fetchImpl, sleep });
      addToUpdates(updates, j.entry, readChart(body), errors, warnings);
    } catch (e) {
      errors.push(`${j.label}: ${e.message}`);
      if (/HTTP (401|403)/.test(e.message) || /No Amplitude keys/.test(e.message)) { aborted = true; errors.push('Stopped early: Amplitude rejected the keys, so the remaining requests were not sent.'); }
    }
  }
  return { updates, errors, warnings, requests, ms: Date.now() - t0 };
}