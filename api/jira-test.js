// api/jira-test.js  (throwaway; delete after testing)
const MCP = 'https://mcp.atlassian.com/v2/mcp';
const CONNECTOR = 'jira/product-organizer-jira';
const SCOPES = ['search:jira:agent-interface'];

// Try this first. If you want to test the shortcut, swap 'dashboard-jira'
// for your Slack member ID (starts with U) and redeploy.
const subject = { type: 'user', id: 'dashboard-jira' };

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
    const d = text.split('\n').find(l => l.startsWith('data:'));
    json = JSON.parse(d ? d.slice(5).trim() : text);
  } catch (_) {}
  return { status: r.status, sessionId: r.headers.get('mcp-session-id'), json, raw: text.slice(0, 300) };
}

export default async function handler(req, res) {
  const out = {};
  let m;
  try {
    m = await import('@vercel/connect');
    const token = await m.getToken(CONNECTOR, { subject, scopes: SCOPES });
    out.tokenReceived = true;

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
    out.isError = call.json?.result?.isError || !!call.json?.error;
    out.sample = (call.json?.result?.content?.[0]?.text || call.raw || '').slice(0, 800);
  } catch (e) {
    const needsConsent = e && (e.name === 'UserAuthorizationRequiredError' || e.name === 'NoValidTokenError');
    if (m && needsConsent) {
      try {
        const { url } = await m.startAuthorization(
          CONNECTOR,
          { subject, scopes: SCOPES },
          { callbackUrl: `https://${req.headers.host}/api/jira-test` },
        );
        out.authorizeUrl = url;
      } catch (e2) {
        out.authError = String(e2 && e2.message || e2).slice(0, 300);
      }
    } else {
      out.error = String(e && e.message || e).slice(0, 300);
    }
  }
  res.status(200).json(out);
}