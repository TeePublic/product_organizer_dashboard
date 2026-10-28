// Shared-state API for the dashboard (replaces the claude.ai artifact database).
//   GET /api/docs?collections=ticks,topics   -> { collections: { ticks: [{id,data}], ... } }
//   PUT /api/docs  { collection, id, data }  -> { ok: true }
// Reads the Neon connection string that the Vercel integration adds to the project.
import { neon } from '@neondatabase/serverless';

const COLLECTIONS = ['order', 'flags', 'acks', 'ticks', 'topics'];
const ID_RE = /^[A-Za-z0-9_.:-]{1,120}$/;
const MAX_BYTES = 100000;

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const sql = url ? neon(url) : null;

let ready = null;
function ensureTable() {
  if (!ready) {
    ready = sql`CREATE TABLE IF NOT EXISTS docs (
      collection text NOT NULL,
      id text NOT NULL,
      data jsonb NOT NULL DEFAULT '{}',
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (collection, id)
    )`.catch((e) => { ready = null; throw e; });
  }
  return ready;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!sql) return res.status(500).json({ error: 'No database connection string (DATABASE_URL) is set on this project.' });
  try {
    if (req.method === 'GET') {
      await ensureTable();
      const asked = String(req.query.collections || '').split(',').map((s) => s.trim()).filter((s) => COLLECTIONS.includes(s));
      const list = asked.length ? asked : COLLECTIONS;
      const rows = await Promise.all(list.map((c) => sql`SELECT id, data FROM docs WHERE collection = ${c} ORDER BY id`));
      const out = {};
      list.forEach((c, i) => { out[c] = rows[i].map((r) => ({ id: r.id, data: r.data })); });
      return res.status(200).json({ collections: out });
    }

    if (req.method === 'PUT') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      const { collection, id, data } = body;
      if (!COLLECTIONS.includes(collection)) return res.status(400).json({ error: 'Unknown collection.' });
      if (typeof id !== 'string' || !ID_RE.test(id)) return res.status(400).json({ error: 'Bad id.' });
      if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'data must be an object.' });
      const json = JSON.stringify(data);
      if (json.length > MAX_BYTES) return res.status(413).json({ error: 'Document too large.' });
      await ensureTable();
      await sql`INSERT INTO docs (collection, id, data) VALUES (${collection}, ${id}, ${json}::jsonb)
                ON CONFLICT (collection, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (e) {
    console.error('docs api error', e);
    return res.status(500).json({ error: 'Database error.' });
  }
}
