// Run with: npm run check
// Loads every data file the way the browser does (same order, shared globals) and checks that the page's expected data is still there.
// Catches syntax errors, missing datasets and roadmap items without a source link BEFORE a bad update goes live.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]).filter((f) => f.startsWith('data/'));

const ctx = vm.createContext({ console });
let failed = false;
const fail = (m) => { failed = true; console.log('FAIL', m); };
const warn = (m) => console.log('WARN', m);
const ok = (m) => console.log('ok  ', m);

for (const f of files) {
  try { vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }); ok(`${f} loads`); }
  catch (e) { fail(`${f} does not load: ${e.message}`); }
}

const get = (name) => { try { return vm.runInContext(`typeof ${name} === 'undefined' ? undefined : ${name}`, ctx); } catch { return undefined; } };
const required = ['D', 'L', 'ORD', 'EXPS', 'ROADMAP_REVIEW', 'TEAM_MEETINGS', 'COMING_PREV', 'COMING', 'PEOPLE', 'MAX', 'PROD', 'SRCS'];
for (const n of required) get(n) === undefined ? fail(`dataset ${n} is missing`) : ok(`dataset ${n} present`);

// Freshness: show the as-of dates so a stale snapshot is obvious.
for (const [n, v] of [['D', get('D')], ['PROD', get('PROD')]]) if (v && v.asOf) console.log(`info ${n}.asOf = ${v.asOf}`);

// Product CVR must reach the same last day as each site's CVR series, with a value on that day for every product (Emma, Nov 3 and Nov 4: "no RBO product data").
// Compares the real dates, not the asOf label. A gap here shows up on the page as "No value" and a sessions chart that falls to 0.
{
  const D = get('D'), PROD = get('PROD');
  const addDays = (d, n) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  if (D && PROD) for (const b of ['tp', 'rb']) {
    const site = D[b], P = PROD[b];
    if (!site || !P) { fail(`PROD.${b} or D.${b} is missing`); continue; }
    const siteEnd = addDays(site.start, site.cvr.length - 1), prodEnd = P.dates[P.dates.length - 1];
    if (prodEnd !== siteEnd) fail(`PROD.${b} ends ${prodEnd} but the ${b.toUpperCase()} site series ends ${siteEnd}: extend PROD to ${siteEnd}`);
    else ok(`PROD.${b} ends ${prodEnd}, same as the site series`);
    for (const [name, it] of Object.entries(P.items)) {
      if (it.v.length !== P.dates.length || it.s.length !== P.dates.length) fail(`PROD.${b} ${name}: v/s length does not match dates`);
      else if (it.v[it.v.length - 1] == null || it.s[it.s.length - 1] == null) fail(`PROD.${b} ${name}: no value on the last day ${prodEnd}`);
    }
  }
}

// Parity between the two sites (Mike, Nov 5: "a change on one CVR dashboard applies to the other; the pages are far more the same than different").
// The two sites carry the same datasets with the same fields; only things that truly differ by site (channel and product names, last year, which exists only for TeePublic) may differ.
{
  const sites = (name, X, skip = []) => {
    if (!X || !X.tp || !X.rb) return;
    const a = Object.keys(X.tp), b = Object.keys(X.rb);
    for (const k of a.filter((k) => !b.includes(k) && !skip.includes(k))) fail(`parity: ${name}.tp has "${k}" but ${name}.rb does not`);
    for (const k of b.filter((k) => !a.includes(k) && !skip.includes(k))) fail(`parity: ${name}.rb has "${k}" but ${name}.tp does not`);
  };
  for (const n of ['D', 'R', 'ORD', 'PROD', 'CS']) sites(n, get(n));
  const L = get('L');
  if (L) for (const sec of ['device', 'funnel', 'geo']) sites(`L.${sec}`, { tp: (L.tp || {})[sec], rb: (L.rb || {})[sec] });
  const D = get('D'), PROD = get('PROD');
  if (D && PROD) for (const b of ['tp', 'rb']) {
    const shapes = new Set(Object.values(PROD[b].items).map((it) => Object.keys(it).filter((k) => !['ly', 'lys'].includes(k)).sort().join(',')));
    if (shapes.size > 1) fail(`parity: PROD.${b} items do not all have the same fields`);
  }
  // Last year exists for TeePublic only (Redbubble has no usable last year). Wherever the site has a last-year series, every product must have one too.
  if (D && PROD && D.tpLY) for (const [name, it] of Object.entries(PROD.tp.items)) {
    if (!Array.isArray(it.ly) || it.ly.length !== D.tpLY.cvr.length) fail(`parity: PROD.tp "${name}" has no last-year series (ly) of length ${D.tpLY.cvr.length}: the By product table shows "No LY value"`);
  }
  for (const [n, X] of [['MAX', get('MAX')], ['STD', get('STD')]]) if (X && D) for (const b of ['tp', 'rb']) {
    const len = X.D && X.D[b] && X.D[b].cvr ? X.D[b].cvr.length : null;
    if (len != null && len !== D[b].cvr.length) warn(`parity: ${n}.${b} series is ${len} long but D.${b} is ${D[b].cvr.length}: one filter is a day behind`);
  }
}

// Every roadmap item should have a source link (this is what the agent maps against).
const coming = get('COMING'), srcs = get('SRCS');
if (coming && srcs && Array.isArray(coming.teams)) {
  const titles = [].concat(...coming.teams.map((t) => (t.items || []).map((i) => i.t)));
  const missing = titles.filter((t) => !srcs[t]);
  const orphan = Object.keys(srcs).filter((k) => !titles.includes(k));
  console.log(`info ${titles.length} roadmap items, ${Object.keys(srcs).length} source entries`);
  if (missing.length) warn(`${missing.length} roadmap items have no source entry: ${missing.slice(0, 8).join(' | ')}${missing.length > 8 ? ' ...' : ''}`);
  if (orphan.length) warn(`${orphan.length} source entries match no roadmap item: ${orphan.slice(0, 8).join(' | ')}${orphan.length > 8 ? ' ...' : ''}`);
}
console.log(failed ? '\nCHECK FAILED: do not commit.' : '\nCheck passed (warnings, if any, are worth a look).');
process.exit(failed ? 1 : 0);
