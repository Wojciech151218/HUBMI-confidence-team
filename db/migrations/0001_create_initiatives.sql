-- Create the `initiatives` table.
--
-- Each row represents a single initiative with:
--   * a human-readable title,
--   * a link to the initiative (nullable — some documents don't mention one),
--   * the most important tags for categorisation/searching.

CREATE TABLE IF NOT EXISTS initiatives (
    id         BIGSERIAL PRIMARY KEY,
    title      TEXT        NOT NULL,
    url        TEXT        UNIQUE,
    tags       TEXT[]      NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup/filtering by tag.
CREATE INDEX IF NOT EXISTS initiatives_tags_gin_idx ON initiatives USING gin (tags);
