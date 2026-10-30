import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { readFileSync } from 'node:fs';

neonConfig.webSocketConstructor = ws;
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) throw new Error('No database URL in env');

const pool = new Pool({ connectionString: url });
const existing = await pool.query(
  "select table_name from information_schema.tables where table_schema='public' order by 1");
console.log('Existing tables:', existing.rows.map(r => r.table_name).join(', ') || '(none)');

if (!process.argv.includes('--yes')) {
  console.log('Review the list above, then re-run with --yes to apply.');
  await pool.end();
  process.exit(0);
}
await pool.query(readFileSync(process.argv[2], 'utf8'));
const t = await pool.query("select (select count(*) from approvers) approvers, (select count(*) from team_coverage) coverage, (select count(*) from field_defs) fields");
console.log('Applied. Row counts:', t.rows[0]);
await pool.end();
