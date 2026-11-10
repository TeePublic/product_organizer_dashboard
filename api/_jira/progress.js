// Reads Jira through the Vercel Connect Jira connector (Atlassian MCP server) and works out each epic's progress.
// Plain code, no AI. Used by /api/jira-progress-refresh. The underscore folder keeps this from becoming an endpoint.
const MCP = 'https://mcp.atlassian.com/v2/mcp';
const CONNECTOR = 'jira/product-organizer-jira';
const CLOUD = 'articore.atlassian.net';
const POINTS = 'customfield_10032'; // "Story Points" on this site
const KEY = /^[A-Z][A-Z0-9]+-\d+$/;

export const epicKey = (link) => (String(link || '').match(/\b([A-Z][A-Z0-9]+-\d+)\b/) || [])[1] || null;

// The epics behind the cards that already show a progress bar: every board or team card that has pts and a Jira link.
export function epicsFromBoard(coming) {
  const cards = [...(coming?.board || []), ...(coming?.teams || []).flatMap((t) => t.items || [])];
  const out = {};
  for (const it of cards) {
    if (!it || !it.pts || !it.link) continue;
    const k = epicKey(it.link);
    if (!k) continue;
    (out[k] ??= { titles: [], pts: it.pts, unit: it.ptsUnit === 'issues' ? 'issues' : 'points' }).titles.push(it.t);
  }
  return out;
}

// One epic's children -> done / total. Story points when the epic has any; otherwise ticket counts.
export function summarize(issues) {
  let pts = 0, donePts = 0, done = 0;
  for (const i of issues) {
    const f = i.fields || {};
    const raw = f.customFields?.['Story Points']?.value ?? f[POINTS];
    const sp = Number(raw) || 0;
    const isDone = f.status?.statusCategory?.name === 'Done';
    pts += sp; if (isDone) { donePts += sp; done += 1; }
  }
  const r = (n) => Math.round(n * 10) / 10;
  return pts > 0 ? { done: r(donePts), total: r(pts), unit: 'points', children: issues.length }
    : { done, total: issues.length, unit: 'issues', children: issues.length };
}

async function rpc(fetchImpl, token, body, sessionId) {
  const r = await fetchImpl(MCP, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}) },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json = null;
  try { const d = text.split('\n').find((l) => l.startsWith('data:')); json = JSON.parse(d ? d.slice(5).trim() : text); } catch { /* not JSON */ }
  return { status: r.status, sessionId: r.headers.get('mcp-session-id'), json, raw: text.slice(0, 300) };
}

// getToken comes from @vercel/connect (passed in so tests can fake it). The subject is the Atlassian sign-in that was authorized once.
export async function openSession({ getToken, subjectId, fetchImpl = fetch }) {
  const token = await getToken(CONNECTOR, { subject: { type: 'user', id: subjectId } });
  const init = await rpc(fetchImpl, token, { jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'product-org-dashboard', version: '1.0' } } });
  if (init.status !== 200) throw new Error('Jira MCP initialize failed (' + init.status + '): ' + init.raw);
  await rpc(fetchImpl, token, { jsonrpc: '2.0', method: 'notifications/initialized' }, init.sessionId);
  let n = 1;
  return {
    async call(name, args) {
      const r = await rpc(fetchImpl, token, { jsonrpc: '2.0', id: ++n, method: 'tools/call', params: { name, arguments: args } }, init.sessionId);
      if (r.status !== 200 || r.json?.error || r.json?.result?.isError) {
        throw new Error(name + ' failed (' + r.status + '): ' + String(r.json?.error?.message || r.json?.result?.content?.[0]?.text || r.raw).slice(0, 200));
      }
      return JSON.parse(r.json.result.content[0].text);
    },
  };
}

export async function fetchEpic(session, key) {
  if (!KEY.test(key)) throw new Error('not a Jira key: ' + key);
  const issues = [];
  let next;
  for (let page = 0; page < 10; page++) {
    const res = await session.call('searchJiraIssuesUsingJql', { cloudId: CLOUD, jql: `parent = ${key}`, maxResults: 100, fields: ['status', POINTS], ...(next ? { nextPageToken: next } : {}) });
    const d = res.data ?? res;
    issues.push(...(d.issues || []));
    next = d.nextPageToken;
    if (d.isLast !== false || !next) break;
  }
  return summarize(issues);
}

// Four epics at a time. One failed epic is reported by key and does not stop the others.
export async function pullAll(session, keys, concurrency = 4) {
  const results = {}, errors = {};
  const queue = [...keys];
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const k = queue.shift();
      try { results[k] = await fetchEpic(session, k); } catch (e) { errors[k] = e.message; }
    }
  }));
  return { results, errors };
}