// Reads the Active Work tab with a service account. No Google library: it signs the login token itself.
// Read-only scope, so even if the sheet were later shared as Editor, this key could not change it.
import crypto from 'node:crypto';

const SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const b64u = (x) => Buffer.from(x).toString('base64url');

export function parseCreds(raw) {
  let c;
  try { c = JSON.parse(raw); } catch { throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON (paste the whole key file as one value)'); }
  if (!c.client_email || !c.private_key) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON has no client_email or private_key');
  return { client_email: c.client_email, private_key: String(c.private_key).replace(/\\n/g, '\n') };
}

export async function getToken(creds, fetchImpl = fetch, nowMs = Date.now()) {
  const iat = Math.floor(nowMs / 1000);
  const head = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64u(JSON.stringify({ iss: creds.client_email, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3000 }));
  const sig = crypto.createSign('RSA-SHA256').update(`${head}.${claim}`).sign(creds.private_key).toString('base64url');
  const r = await fetchImpl('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${sig}` }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`Google sign-in failed (${r.status}): ${j.error_description || j.error || 'no detail'}`);
  return j.access_token;
}

async function sheetsGet(token, url, fetchImpl) {
  const r = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(j.error?.message || `Sheets API error ${r.status}`); e.status = r.status; e.reason = j.error?.status || j.error?.errors?.[0]?.reason; throw e; }
  return j;
}

// Finds the tab by its gid (never by name), then returns every cell as { v, link }.
export async function readTab({ token, sheetId, gid, fetchImpl = fetch }) {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}`;
  const meta = await sheetsGet(token, `${base}?fields=sheets.properties(sheetId,title)`, fetchImpl);
  const tab = (meta.sheets || []).find((s) => String(s.properties.sheetId) === String(gid));
  if (!tab) throw Object.assign(new Error(`No tab with gid ${gid} in this spreadsheet`), { status: 'no-tab' });
  const title = tab.properties.title;
  const range = encodeURIComponent(`'${title.replace(/'/g, "''")}'!A:AA`);
  const fields = encodeURIComponent('sheets(data(rowData(values(effectiveValue,hyperlink))))');
  const grid = await sheetsGet(token, `${base}?ranges=${range}&includeGridData=true&fields=${fields}`, fetchImpl);
  const rows = grid.sheets?.[0]?.data?.[0]?.rowData ?? [];
  const values = rows.map((r) => (r.values ?? []).map((c) => ({
    v: c.effectiveValue?.stringValue ?? c.effectiveValue?.numberValue ?? null, link: c.hyperlink ?? null,
  })));
  return { title, values };
}