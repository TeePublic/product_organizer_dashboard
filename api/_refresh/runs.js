// The bookkeeping for a refresh that takes several rounds: every answer from Amplitude is saved as it arrives,
// so a slow chart, a closed page or a failed round never loses finished work.
export async function findRun(sql, { id, mode }) {
  const rows = id
    ? await sql`SELECT id, mode, status, baseline_end::text AS baseline_end, last_complete, results, fails, rounds FROM cvr_refresh_runs WHERE id = ${id}`
    : await sql`SELECT id, mode, status, baseline_end::text AS baseline_end, last_complete, results, fails, rounds FROM cvr_refresh_runs WHERE status = 'running' AND mode = ${mode} AND updated_at > now() - interval '2 hours' ORDER BY id DESC LIMIT 1`;
  return rows[0] ?? null;
}
export const createRun = async (sql, { mode, baselineEnd, lastComplete, who }) =>
  (await sql`INSERT INTO cvr_refresh_runs (mode, baseline_end, last_complete, started_by) VALUES (${mode}, ${baselineEnd}::date, ${JSON.stringify(lastComplete)}::jsonb, ${who}) RETURNING id`)[0].id;
export const saveResult = (sql, id, key, read) => sql`UPDATE cvr_refresh_runs SET results = results || ${JSON.stringify({ [key]: read })}::jsonb, updated_at = now() WHERE id = ${id}`;
export const saveFails = (sql, id, fails) => sql`UPDATE cvr_refresh_runs SET fails = ${JSON.stringify(fails)}::jsonb, updated_at = now() WHERE id = ${id}`;
export const bumpRound = (sql, id) => sql`UPDATE cvr_refresh_runs SET rounds = rounds + 1, updated_at = now() WHERE id = ${id}`;
export const finishRun = (sql, id, status, errors) => sql`UPDATE cvr_refresh_runs SET status = ${status}, errors = ${JSON.stringify(errors ?? [])}::jsonb, updated_at = now() WHERE id = ${id}`;
export const purgeOld = (sql) => sql`DELETE FROM cvr_refresh_runs WHERE created_at < now() - interval '7 days'`;