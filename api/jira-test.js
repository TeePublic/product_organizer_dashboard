// api/jira-test.js  (delete after testing)
export default async function handler(req, res) {
  const out = {};
  try {
    const { getToken } = await import('@vercel/connect');
    const token = await getToken('jira/product-organizer-jira', { subject: { type: 'app' } });
    out.tokenReceived = !!token;
    const r = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    out.restStatus = r.status;
  } catch (e) {
    out.error = String(e && e.message || e).slice(0, 300);
  }
  res.status(200).json(out);
}