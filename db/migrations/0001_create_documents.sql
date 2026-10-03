-- Create the canonical knowledge-base tables: documents, categories and the
-- many-to-many join table. This mirrors db/document.ts / db/category.ts
-- (TypeORM synchronize would create the same shape); it is declared here too so
-- the seed in 0002_seed_documents.sql is self-sufficient on a fresh database.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS documents (
    id         SERIAL PRIMARY KEY,
    title      TEXT,
    body       TEXT NOT NULL,
    minio_url  TEXT,
    embedding  vector(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
    id   SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS document_categories (
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, category_id)
);
