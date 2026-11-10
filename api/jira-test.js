// api/jira-test.js  (throwaway; delete after testing)
const MCP = 'https://mcp.atlassian.com/v2/mcp';

async function rpc(token, body, sessionId) {
  const r = await fetch(MCP, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let json = null;
  try {
    const dataLine = text.split('\n').find(l => l.startsWith('data:'));
    json = JSON.parse(dataLine ? dataLine.slice(5).trim() : text);
  } catch (_) {}
  return { status: r.status, sessionId: r.headers.get('mcp-session-id'), json, raw: text.slice(0, 300) };
}

export default async function handler(req, res) {
  const out = {};
  try {
    const { getToken } = await import('@vercel/connect');
    const token = await getToken('jira/product-organizer-jira', { subject: { type: 'app' } });
    out.tokenReceived = !!token;

    const init = await rpc(token, {
      jsonrpc: '2.0', id: 1, method: 'initialize',
      params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'product-org-dashboard', version: '1.0' } },
    });
    out.initStatus = init.status;
    if (init.status !== 200) { out.initRaw = init.raw; return res.status(200).json(out); }

    await rpc(token, { jsonrpc: '2.0', method: 'notifications/initialized' }, init.sessionId);

    const call = await rpc(token, {
      jsonrpc: '2.0', id: 2, method: 'tools/call',
      params: {
        name: 'searchJiraIssuesUsingJql',
        arguments: { cloudId: 'articore.atlassian.net', jql: 'parent = DEAP-5324', maxResults: 100, fields: ['status', 'customfield_10032'] },
      },
    }, init.sessionId);
    out.callStatus = call.status;
    const txt = call.json?.result?.content?.[0]?.text;
    out.isError = call.json?.result?.isError || !!call.json?.error;
    out.sample = (txt || call.raw || '').slice(0, 800);
  } catch (e) {
    out.error = String(e && e.message || e).slice(0, 300);
  }
  res.status(200).json(out);
}