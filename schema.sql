-- One table backs every shared feature (collections: order, flags, acks, ticks, topics).
-- api/docs.js also runs this on first request, so running it by hand is optional.
CREATE TABLE IF NOT EXISTS docs (
  collection text        NOT NULL,
  id         text        NOT NULL,
  data       jsonb       NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, id)
);
