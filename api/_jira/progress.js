// Reads Jira through the Vercel Connect Jira connector (Atlassian MCP server) and works out each card's progress.
// Plain code, no AI. Used by /api/jira-progress-refresh. The underscore folder keeps this from becoming an endpoint.
const MCP = 'https://mcp.atlassian.com/v2/mcp';
const CONNECTOR = 'jira/product-organizer-jira';
const CLOUD = 'articore.atlassian.net';
const POINTS = 'customfield_10032'; // "Story Points" on this site
const KEY = /^[A-Z][A-Z0-9]+-\d+$/;

// Two judgment calls, easy to change here:
const POINT_COVERAGE = 0.75; // an epic counts story points only when at least this share of its tickets carry points; otherwise it counts tickets
const NOT_COUNTED = /^(discarded|won'?t do|cancel+ed|duplicate|rejected)$/i; // dropped tickets are left out of both the done and the total

export const epicKey = (link) => (String(link || '').match(/\b([A-Z][A-Z0-9]+-\d+)\b/) || [])[1] || null;

// The Jira items behind the cards that already show a progress bar: every board or team card that has pts and a Jira link.
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

const r1 = (n) => Math.round(n * 10) / 10;
const pointsOf = (f) => Number(f?.customFields?.['Story Points']?.value ?? f?.[POINTS]) || 0;
const isDone = (f) => f?.status?.statusCategory?.name === 'Done';

// An epic's children -> done / total. Story points when most tickets carry them; otherwise ticket counts.
export function summarize(issues) {
  const live = issues.filter((i) => !NOT_COUNTED.test(i.fields?.status?.name || ''));
  let pts = 0, donePts = 0, done = 0, pointed = 0;
  for (const i of live) {
    const sp = pointsOf(i.fields);
    pts += sp; if (sp > 0) pointed++;
    if (isDone(i.fields)) { done++; donePts += sp; }
  }
  const base = { kind: 'epic', children: live.length, pointed, skipped: issues.length - live.length };
  return pts > 0 && live.length && pointed / live.length >= POINT_COVERAGE
    ? { done: r1(donePts), total: r1(pts), unit: 'points', ...base }
    : { done, total: live.length, unit: 'issues', ...base };
}

// A card that points at a single ticket (story, task or bug), not an epic: its own points and its own status.
export function ticketSummary(f) {
  const pts = pointsOf(f), d = isDone(f);
  return pts > 0 ? { done: d ? pts : 0, total: pts, unit: 'points', kind: 'ticket' } : { done: d ? 1 : 0, total: 1, unit: 'issues', kind: 'ticket' };
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

async function search(session, jql, fields) {
  const issues = [];
  let next;
  for (let page = 0; page < 10; page++) {
    const res = await session.call('searchJiraIssuesUsingJql', { cloudId: CLOUD, jql, maxResults: 100, fields, ...(next ? { nextPageToken: next } : {}) });
    const d = res.data ?? res;
    issues.push(...(d.issues || []));
    next = d.nextPageToken;
    if (d.isLast !== false || !next) break;
  }
  return issues;
}

// Pulls every key. One lookup says which keys are epics and which are single tickets; epics then get their children read, four at a time.
// One failed key is reported by key and does not stop the others.
export async function pullAll(session, keys, concurrency = 4) {
  const results = {}, errors = {};
  for (const k of keys) if (!KEY.test(k)) { errors[k] = 'not a Jira key'; }
  const ok = keys.filter((k) => !errors[k]);
  if (!ok.length) return { results, errors };
  let items = {};
  try {
    for (const i of await search(session, `key in (${ok.join(', ')})`, ['issuetype', 'status', POINTS])) items[i.key] = i;
  } catch (e) { for (const k of ok) errors[k] = e.message; return { results, errors }; }
  const queue = [];
  for (const k of ok) {
    const it = items[k];
    if (!it) errors[k] = 'Jira did not return this ticket (deleted, or no access)';
    else if (it.fields?.issuetype?.name === 'Epic') queue.push(k);
    else results[k] = ticketSummary(it.fields);
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const k = queue.shift();
      try { results[k] = summarize(await search(session, `parent = ${k}`, ['status', POINTS])); } catch (e) { errors[k] = e.message; }
    }
  }));
  return { results, errors };
}