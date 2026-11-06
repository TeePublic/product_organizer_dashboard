// What the page shows right now: the newest Neon snapshot if it is at least as fresh as the data files, otherwise the data files.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const FILES = ['cvr-pacer-snapshot', 'cvr-ledger', 'standard-bot-filter', 'max-bot-filter-and-products', 'orders-slack-standups'];
const ROOTS = ['D', 'L', 'MAX', 'STD', 'R', 'ORD'];

export function loadFromFiles(dir) {
  const ctx = vm.createContext({});
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(dir, `${f}.js`), 'utf8'), ctx, { filename: `${f}.js` });
  const roots = {};
  for (const n of ROOTS) roots[n] = JSON.parse(JSON.stringify(vm.runInContext(`typeof ${n} === 'undefined' ? undefined : ${n}`, ctx) ?? null));
  const missing = ROOTS.filter((n) => !roots[n]);
  if (missing.length) throw new Error(`The data files do not define: ${missing.join(', ')}`);
  return roots;
}

export async function loadBaseline({ sql, dir }) {
  const files = loadFromFiles(dir), fileAsOf = files.D.asOf, notes = [];
  if (sql) {
    try {
      const head = await sql`SELECT id, to_char(as_of, 'YYYY-MM-DD') AS as_of, created_at::text AS created_at FROM cvr_snapshots ORDER BY created_at DESC LIMIT 1`;
      if (head.length && head[0].as_of >= fileAsOf) {
        const rows = await sql`SELECT payload FROM cvr_snapshots WHERE id = ${head[0].id}`;
        const p = rows[0]?.payload;
        if (p && ROOTS.every((n) => p[n])) return { roots: p, source: `snapshot #${head[0].id} (data through ${head[0].as_of}, saved ${head[0].created_at})`, fileAsOf, snapshotId: head[0].id, notes };
        notes.push(`Snapshot #${head[0].id} is incomplete, so the data files were used instead.`);
      } else if (head.length) notes.push(`The newest snapshot (through ${head[0].as_of}) is older than the data files (through ${fileAsOf}), so the data files were used.`);
    } catch (e) { notes.push(`Could not read snapshots (${e.message}); used the data files.`); }
  }
  return { roots: files, source: `data files (through ${fileAsOf})`, fileAsOf, snapshotId: null, notes };
}