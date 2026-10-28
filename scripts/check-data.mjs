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
