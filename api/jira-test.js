// api/jira-test.js  (still a throwaway; delete after testing)
export default async function handler(req, res) {
  const out = {};
  try {
    const { getToken } = await import('@vercel/connect');
    const token = await getToken('jira/product-organizer-jira', { subject: { type: 'app' } });
    const H = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' };

    const sites = await (await fetch('https://api.atlassian.com/oauth/token/accessible-resources', { headers: H })).json();
    const site = sites.find(s => /articore\.atlassian\.net/.test(s.url));
    if (!site) { out.error = 'articore site not in accessible resources'; return res.status(200).json(out); }

    let done = 0, total = 0, count = 0, next;
    do {
      const r = await fetch(`https://api.atlassian.com/ex/jira/${site.id}/rest/api/3/search/jql`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ jql: 'parent = DEAP-5324', fields: ['status', 'customfield_10032'], maxResults: 100, nextPageToken: next }),
      });
      out.searchStatus = r.status;
      if (!r.ok) { out.body = (await r.text()).slice(0, 300); return res.status(200).json(out); }
      const j = await r.json();
      for (const i of j.issues || []) {
        const sp = Number(i.fields.customfield_10032) || 0;
        total += sp; count++;
        if (i.fields.status?.statusCategory?.name === 'Done') done += sp;
      }
      next = j.nextPageToken;
    } while (next);
    out.result = { done, total, count };
  } catch (e) {
    out.error = String(e && e.message || e).slice(0, 300);
  }
  res.status(200).json(out);
}