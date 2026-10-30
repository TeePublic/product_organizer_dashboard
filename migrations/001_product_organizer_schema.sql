-- Product Organizer: approved record, evidence, proposals and approvers.
-- Target: the Neon database on the Articore Vercel team (Postgres).
-- Run once in the Neon SQL editor, or with: psql "$DATABASE_URL" -f 001_product_organizer_schema.sql
-- Safe to re-run: every statement is idempotent.

BEGIN;

-- ---------------------------------------------------------------- approvers
CREATE TABLE IF NOT EXISTS approvers (
  slack_member_id text PRIMARY KEY,           -- the U... ID carried on Slack button presses
  name            text NOT NULL,
  active          boolean NOT NULL DEFAULT true
);

-- One row per (team, approver). Core has two approvers; Matz and Tom cover two teams each.
CREATE TABLE IF NOT EXISTS team_coverage (
  team            text NOT NULL,              -- dashboard team slug, lower case
  slack_member_id text NOT NULL REFERENCES approvers(slack_member_id),
  PRIMARY KEY (team, slack_member_id)
);

-- ------------------------------------------------------------ field catalogue
-- human_only = the agent may never propose a value; a person enters it.
CREATE TABLE IF NOT EXISTS field_defs (
  field      text PRIMARY KEY,
  label      text NOT NULL,
  human_only boolean NOT NULL DEFAULT false
);

-- ------------------------------------------------------------ approved record
CREATE TABLE IF NOT EXISTS projects (
  id           bigserial PRIMARY KEY,
  name         text NOT NULL UNIQUE,          -- same names the dashboard uses today
  team         text NOT NULL,
  jira_key     text,                          -- epic or initiative, e.g. DEAP-6266
  pm_member_id text REFERENCES approvers(slack_member_id)  -- overrides team coverage when set
);

CREATE TABLE IF NOT EXISTS project_fields (
  project_id   bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  field        text   NOT NULL REFERENCES field_defs(field),
  value        jsonb  NOT NULL,
  approved_by  text   REFERENCES approvers(slack_member_id),
  approved_at  timestamptz,
  source_kind  text,                          -- jira | slack | sheet | confluence | release | meeting | person
  source_ref   text,
  source_url   text,
  source_date  date,
  PRIMARY KEY (project_id, field)
);

-- -------------------------------------------------- what the sources say now
-- Latest observation per project, field and source. Feeds the "Also" rows and drift flags.
CREATE TABLE IF NOT EXISTS field_evidence (
  project_id  bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  field       text   NOT NULL REFERENCES field_defs(field),
  source_kind text   NOT NULL,
  source_ref  text   NOT NULL DEFAULT '',
  value       jsonb  NOT NULL,
  source_url  text,
  who         text,
  observed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, field, source_kind, source_ref)
);

-- ------------------------------------------------------------------ runs
CREATE TABLE IF NOT EXISTS runs (
  run_id      text PRIMARY KEY,
  started_at  timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  sources_ok  jsonb NOT NULL DEFAULT '{}'::jsonb   -- e.g. {"jira":true,"slack":true,"sheet":false}
);

-- ------------------------------------------------------------------ proposals
CREATE TABLE IF NOT EXISTS proposals (
  id             bigserial PRIMARY KEY,
  project_id     bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  field          text   NOT NULL REFERENCES field_defs(field),
  proposed_value jsonb  NOT NULL,
  evidence       jsonb  NOT NULL DEFAULT '[]'::jsonb,
  status         text   NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','expired','superseded')),
  run_id         text   REFERENCES runs(run_id),
  proposed_at    timestamptz NOT NULL DEFAULT now(),
  slack_channel  text,
  slack_ts       text,
  decided_by     text   REFERENCES approvers(slack_member_id),
  decided_at     timestamptz
);

-- At most one pending proposal per project and field; a newer run supersedes the older one.
CREATE UNIQUE INDEX IF NOT EXISTS proposals_one_pending
  ON proposals (project_id, field) WHERE status = 'pending';

-- Agent can never propose a human-only field.
CREATE OR REPLACE FUNCTION proposals_block_human_only() RETURNS trigger AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM field_defs WHERE field = NEW.field AND human_only) THEN
    RAISE EXCEPTION 'field % is human-only; the agent cannot propose it', NEW.field;
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS proposals_block_human_only_trg ON proposals;
CREATE TRIGGER proposals_block_human_only_trg
  BEFORE INSERT ON proposals
  FOR EACH ROW EXECUTE FUNCTION proposals_block_human_only();

-- ------------------------------------------------------------------ audit log
CREATE TABLE IF NOT EXISTS change_log (
  id          bigserial PRIMARY KEY,
  project_id  bigint NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  field       text   NOT NULL,
  old_value   jsonb,
  new_value   jsonb,
  by_member   text,                           -- approver, or 'agent' for evidence-only writes
  at          timestamptz NOT NULL DEFAULT now(),
  proposal_id bigint REFERENCES proposals(id)
);

-- ------------------------------------------------------------ dashboard view
-- The dashboard reads this; it never sees Slack member IDs.
CREATE OR REPLACE VIEW dashboard_fields AS
SELECT p.name AS project, p.team, f.field, f.value,
       a.name AS approved_by_name, f.approved_at,
       f.source_kind, f.source_ref, f.source_url, f.source_date
FROM project_fields f
JOIN projects p ON p.id = f.project_id
LEFT JOIN approvers a ON a.slack_member_id = f.approved_by;

CREATE OR REPLACE VIEW dashboard_evidence AS
SELECT p.name AS project, e.field, e.source_kind, e.source_ref, e.value,
       e.source_url, e.who, e.observed_at
FROM field_evidence e
JOIN projects p ON p.id = e.project_id;

-- ------------------------------------------------------------------ seed: field catalogue
-- Adjust as Mike finishes restructuring the sheet. Committed flags, ROI and goal are human-only.
INSERT INTO field_defs (field, label, human_only) VALUES
  ('pd_committed',   'PD Committed',       true),
  ('de_committed',   'DE Committed',       true),
  ('da_committed',   'DA Committed',       true),
  ('estimated_roi',  'Estimated ROI',      true),
  ('goal',           'Goal',               true),
  ('pillar',         'Pillar',             false),
  ('size',           'Size',               false),
  ('pm',             'PM',                 false),
  ('exec_stakeholder','Exec Stakeholder',  false),
  ('eng_lead',       'Eng Lead',           false),
  ('impact_owner',   'Impact Owner',       false),
  ('team',           'Team',               false),
  ('site',           'Site',               false),
  ('current_phase',  'Current Phase',      false),
  ('status',         'Status',             false),
  ('phase_start',    'Phase Start Date',   false),
  ('phase_end_eta',  'Phase End ETA',      false),
  ('launch_date',    'Est. Launch Date',   false),
  ('confidence',     'Confidence',         false),
  ('spec_url',       'Spec',               false),
  ('jira_url',       'Jira',               false)
ON CONFLICT (field) DO NOTHING;

-- ------------------------------------------------------------------ seed: approvers
-- Names are as in the CSV; confirm spelling of the two flagged ones.
INSERT INTO approvers (slack_member_id, name) VALUES
  ('U03713KRQF8', 'Bishal Shrestha'),
  ('U02NBR6SKU6', 'Wendy Fullam'),
  ('U04MH54DNAD', 'Jonathan Tan'),
  ('U01UJ084CP7', 'Revin Wade'),
  ('U067W2YUHV5', 'Amelia Cacchoine'),   -- dashboard data spells it Cacchione: confirm
  ('U097UE7CVJR', 'Grace Rusell'),       -- possibly Russell: confirm
  ('U05T9C0AJ1M', 'Matz Edstrom'),
  ('U0NCMNZ45',   'Tom Sommer'),
  ('U0BQ6GBUZQS', 'Vaibhav Soni')
ON CONFLICT (slack_member_id) DO NOTHING;

INSERT INTO team_coverage (team, slack_member_id) VALUES
  ('core',     'U03713KRQF8'),
  ('core',     'U0NCMNZ45'),
  ('infra',    'U0NCMNZ45'),
  ('search',   'U02NBR6SKU6'),
  ('customer', 'U04MH54DNAD'),
  ('tiger',    'U04MH54DNAD'),            -- Jon for now; update when it changes
  ('plc',      'U01UJ084CP7'),
  ('de',       'U067W2YUHV5'),
  ('dashery',  'U097UE7CVJR'),
  ('artist',   'U05T9C0AJ1M'),
  ('app',      'U05T9C0AJ1M'),
  ('martech',  'U0BQ6GBUZQS')
ON CONFLICT DO NOTHING;

COMMIT;

-- ------------------------------------------------------------------ roles (optional, run separately)
-- Create the roles in the Neon console (Roles) or API, set passwords there, then:
--   GRANT SELECT ON dashboard_fields, dashboard_evidence, runs TO dashboard_reader;
--   GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO agent_writer;
--   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO agent_writer;
--   REVOKE DELETE ON change_log FROM agent_writer;
