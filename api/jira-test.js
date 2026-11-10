// api/jira-test.js  (throwaway; delete after testing)
export default async function handler(req, res) {
  const out = {};
  try {
    const { getToken } = await import('@vercel/connect');
    const token = await getToken('jira/product-organizer-jira', { subject: { type: 'app' } });
    const r = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    out.status = r.status;
    const j = await r.json();
    out.isArray = Array.isArray(j);
    out.count = Array.isArray(j) ? j.length : null;
    out.sites = Array.isArray(j) ? j.map(s => ({ name: s.name, url: s.url, scopes: s.scopes })) : j;
  } catch (e) {
    out.error = String(e && e.message || e).slice(0, 300);
  }
  res.status(200).json(out);
}