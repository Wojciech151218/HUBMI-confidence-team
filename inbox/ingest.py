#!/usr/bin/env python3
"""Extract title, url and tags (categories) from markdown documents via DeepSeek,
generate embeddings via OpenAI, and store them in the canonical `documents` /
`categories` / `document_categories` schema — the same tables TypeORM maps in
db/document.ts and db/category.ts.

The prompt is given the category names already present in the DB so the model
reuses the exact same wording instead of inventing new variants.

Usage:
    python3 ingest.py markdown/*.md
"""

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

DB_CONTAINER = os.environ.get("DB_CONTAINER", "hubmi-confidence-team-db-1")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_NAME = os.environ.get("DB_NAME", "hubmi")

DEEPSEEK_URL = os.environ.get("DEEPSEEK_URL", "https://api.deepseek.com/anthropic")
DEEPSEEK_KEY = os.environ.get("DEEPSEEK_KEY", "")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")

# Embeddings must use the same model the app uses (lib/embedding.ts) so the
# stored vectors stay comparable with query vectors during search.
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_EMBED_URL = os.environ.get("OPENAI_EMBED_URL", "https://api.openai.com/v1/embeddings")
EMBEDDING_MODEL = os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDING_DIMENSIONS = int(os.environ.get("EMBEDDING_DIMENSIONS", "1536"))
# text-embedding-3-small caps input at 8192 tokens. Some pdftotext -layout
# markdown tokenizes very densely (layout spacing), so truncate conservatively
# and embed only the beginning of the document. The full text is always stored
# in `body`.
MAX_EMBED_CHARS = int(os.environ.get("MAX_EMBED_CHARS", "8000"))

# Seed migration file rewritten from the DB by sync_migration() at the end of a
# run, so a fresh database recreates the same rows. Path is relative to this
# script's directory by default.
MIGRATION_FILE = os.environ.get(
    "MIGRATION_FILE",
    os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..", "db", "migrations", "0002_seed_documents.sql",
    ),
)


def psql(sql: str) -> str:
    """Run SQL inside the DB container via psql and return stdout."""
    proc = subprocess.run(
        [
            "docker", "exec", "-i", DB_CONTAINER,
            "psql", "-U", DB_USER, "-d", DB_NAME,
            "-tA", "-q", "-v", "ON_ERROR_STOP=1",
        ],
        input=sql,
        text=True,
        capture_output=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or f"psql failed ({proc.returncode})")
    return proc.stdout


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def ensure_schema() -> None:
    """Create the canonical tables (matching db/document.ts and db/category.ts)
    if they do not exist yet.

    TypeORM runs `synchronize` lazily — only on the app's first DB access — so
    the tables are not guaranteed to exist when this script (which talks to the
    DB directly via psql) starts. This keeps the pipeline self-sufficient.
    """
    psql(
        "CREATE EXTENSION IF NOT EXISTS vector;\n"
        "CREATE TABLE IF NOT EXISTS documents (\n"
        "    id SERIAL PRIMARY KEY,\n"
        "    title TEXT,\n"
        "    body TEXT NOT NULL,\n"
        "    minio_url TEXT,\n"
        f"    embedding vector({EMBEDDING_DIMENSIONS}),\n"
        "    created_at TIMESTAMPTZ NOT NULL DEFAULT now()\n"
        ");\n"
        "CREATE TABLE IF NOT EXISTS categories (\n"
        "    id SERIAL PRIMARY KEY,\n"
        "    name TEXT NOT NULL UNIQUE\n"
        ");\n"
        "CREATE TABLE IF NOT EXISTS document_categories (\n"
        "    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,\n"
        "    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,\n"
        "    PRIMARY KEY (document_id, category_id)\n"
        ");\n"
    )


def existing_categories() -> list[str]:
    out = psql("SELECT name FROM categories ORDER BY 1;")
    return [line.strip() for line in out.splitlines() if line.strip()]


def category_id(name: str) -> int:
    """Get-or-create a category row and return its id."""
    clean = name.strip()
    psql(
        "INSERT INTO categories (name) VALUES "
        f"({sql_literal(clean)}) ON CONFLICT (name) DO NOTHING;"
    )
    out = psql(f"SELECT id FROM categories WHERE name = {sql_literal(clean)};")
    return int(out.strip())


def embed(text: str) -> list[float]:
    """Generate an embedding for `text` with the app's OpenAI model.

    The input is truncated to MAX_EMBED_CHARS so it stays under the model's
    8192-token limit; the full document is still stored in `body`.
    """
    text = text[:MAX_EMBED_CHARS]
    payload = {
        "model": EMBEDDING_MODEL,
        "input": text,
        "dimensions": EMBEDDING_DIMENSIONS,
    }
    req = urllib.request.Request(
        OPENAI_EMBED_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        raise RuntimeError(f"embedding request failed ({exc.code}): {body}") from exc
    embedding = data["data"][0]["embedding"]
    if len(embedding) != EMBEDDING_DIMENSIONS:
        raise ValueError(
            f"embedding has {len(embedding)} dims, expected {EMBEDDING_DIMENSIONS}"
        )
    return embedding


def embedding_literal(embedding: list[float]) -> str:
    return (
        sql_literal("[" + ",".join(str(value) for value in embedding) + "]")
        + "::vector"
    )


def insert_document(
    title: str, body: str, url: str | None, embedding: list[float]
) -> int | None:
    """Insert one document (idempotent) and return its id, or None if it existed."""
    title_lit = sql_literal(title.strip())
    body_lit = sql_literal(body)
    url_lit = sql_literal(url.strip()) if url else "NULL"
    emb_lit = embedding_literal(embedding)

    sql = (
        "INSERT INTO documents (title, body, minio_url, embedding)\n"
        f"SELECT {title_lit}, {body_lit}, {url_lit}, {emb_lit}\n"
        "WHERE NOT EXISTS (\n"
        "    SELECT 1 FROM documents\n"
        f"    WHERE title = {title_lit}\n"
        f"      AND minio_url IS NOT DISTINCT FROM {url_lit}\n"
        ")\n"
        "RETURNING id;"
    )
    out = psql(sql).strip()
    return int(out) if out else None


def link_category(document_id: int, category_id: int) -> None:
    psql(
        "INSERT INTO document_categories (document_id, category_id) "
        f"VALUES ({document_id}, {category_id}) ON CONFLICT DO NOTHING;"
    )


def read_text(path: str) -> str:
    with open(path, "rb") as f:
        raw = f.read()
    for enc in ("utf-8", "cp1250", "latin-1"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def safe(text: str) -> str:
    """Replace lone surrogates (from invalid filenames on disk) so the string
    is printable and storable. Filesystem reads still use the original path."""
    return text.encode("utf-8", "replace").decode("utf-8")


def build_system_prompt(existing: list[str]) -> str:
    if existing:
        block = "\n".join(f"- {tag}" for tag in existing)
    else:
        block = "(none yet — this is the first document)"

    return (
        "You extract metadata from Polish social-innovation documents for a discovery portal. "
        "Reply with a single JSON object and nothing else (no markdown fences, no prose).\n"
        "Fields:\n"
        '- "title": a short human-readable title of the initiative.\n'
        '- "url": the initiative\'s own website or link if the document mentions one, otherwise null.\n'
        '- "tags": an array of 3 to 10 short strings covering BOTH broad categories and narrower '
        "subcategories (e.g. zdrowie, otyłość, niepełnosprawność, dieta, seniorzy, bezdomność, higiena). "
        "Use Polish, lowercase.\n"
        "Reuse the EXACT string from the list below when a concept is already present; "
        "do not coin a new wording for an existing category. Only add new tags for concepts not listed.\n"
        "Existing categories:\n"
        + block
    )


def parse_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
        text = text.strip()
    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        result = json.loads(text[start : end + 1])

    if not isinstance(result, dict):
        raise ValueError("DeepSeek reply is not a JSON object")
    return result


def extract(content: str, existing: list[str]) -> dict:
    base = DEEPSEEK_URL.rstrip("/")
    endpoint = base if base.endswith("/messages") else base + "/v1/messages"

    payload = {
        "model": DEEPSEEK_MODEL,
        "max_tokens": 2048,
        "temperature": 0,
        "system": build_system_prompt(existing),
        "messages": [{"role": "user", "content": content}],
    }

    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-api-key": DEEPSEEK_KEY,
            "anthropic-version": "2023-06-01",
        },
    )

    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode("utf-8"))

    text = " ".join(part.get("text", "") for part in data.get("content", [])).strip()
    if not text:
        raise ValueError("DeepSeek returned no text")
    return parse_json(text)


def sync_migration() -> None:
    """Rewrite the seed migration file from the current database contents.

    Pulls every document, category and link out of the DB and writes a
    deterministic, idempotent seed file. Because it regenerates the whole file
    from the DB, anything already in the DB is guaranteed to be present in the
    migration file, and nothing appears twice. A fresh database (via
    docker-entrypoint-initdb.d) recreates the exact same rows.
    """
    path = MIGRATION_FILE
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

    categories = json.loads(
        psql(
            "SELECT COALESCE(json_agg(json_build_object('id', id, 'name', name) "
            "ORDER BY id), '[]'::json) FROM categories;"
        )
    )
    documents = json.loads(
        psql(
            "SELECT COALESCE(json_agg(json_build_object("
            "'id', id, 'title', title, 'body', body, "
            "'minio_url', minio_url, 'embedding', embedding::text) "
            "ORDER BY id), '[]'::json) FROM documents;"
        )
    )
    links = json.loads(
        psql(
            "SELECT COALESCE(json_agg(json_build_object("
            "'document_id', document_id, 'category_id', category_id) "
            "ORDER BY document_id, category_id), '[]'::json) "
            "FROM document_categories;"
        )
    )

    header = (
        "-- Seed data for the knowledge base (documents / categories / links).\n"
        "-- Auto-generated from the database by inbox/ingest.py sync_migration();\n"
        "-- regenerating the file rewrites it fully, so it always mirrors the DB.\n"
        "-- Runs after 0001_create_documents.sql on a fresh database.\n\n"
    )

    sections: list[str] = [header]

    if categories:
        sections.append(
            "-- categories\n"
            + "\n".join(
                "INSERT INTO categories (id, name) VALUES "
                f"({c['id']}, {sql_literal(c['name'])}) "
                "ON CONFLICT (id) DO NOTHING;"
                for c in categories
            )
        )

    if documents:
        sections.append(
            "-- documents\n"
            + "\n".join(
                "INSERT INTO documents (id, title, body, minio_url, embedding) VALUES ("
                f"{d['id']}, "
                f"{sql_literal(d['title']) if d['title'] is not None else 'NULL'}, "
                f"{sql_literal(d['body'])}, "
                f"{sql_literal(d['minio_url']) if d['minio_url'] is not None else 'NULL'}, "
                f"{sql_literal(d['embedding']) + '::vector' if d['embedding'] is not None else 'NULL'}"
                ") ON CONFLICT (id) DO NOTHING;"
                for d in documents
            )
        )

    if links:
        sections.append(
            "-- document_categories\n"
            + "\n".join(
                "INSERT INTO document_categories (document_id, category_id) VALUES "
                f"({l['document_id']}, {l['category_id']}) "
                "ON CONFLICT DO NOTHING;"
                for l in links
            )
        )

    if documents:
        sections.append(
            "SELECT setval('documents_id_seq', (SELECT MAX(id) FROM documents));"
        )
    if categories:
        sections.append(
            "SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories));"
        )

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n\n".join(sections) + "\n")


def main(paths: list[str]) -> int:
    if not DEEPSEEK_KEY:
        print("DEEPSEEK_KEY is not set.", file=sys.stderr)
        return 1
    if not OPENAI_API_KEY:
        print("OPENAI_API_KEY is not set (needed for embeddings).", file=sys.stderr)
        return 1

    ensure_schema()

    # Survive non-UTF-8 filenames on disk (surrogates in sys.argv).
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(errors="replace")
        except (AttributeError, ValueError, OSError):
            pass

    os.makedirs("processed", exist_ok=True)

    for path in paths:
        if not os.path.isfile(path):
            continue

        marker = os.path.join(
            "processed", safe(os.path.splitext(os.path.basename(path))[0]) + ".json"
        )
        if os.environ.get("FORCE") != "1" and os.path.exists(marker):
            print(f"skip {safe(path)} (already processed)")
            continue

        print(f"extracting {safe(path)} ...")

        try:
            content = read_text(path)
            result = extract(content, existing_categories())
        except Exception as exc:  # noqa: BLE001 — one bad doc must not kill the batch
            print(f"  error extracting {safe(path)}: {exc}", file=sys.stderr)
            continue

        title = (result.get("title") or "").strip()
        url = (result.get("url") or "").strip() or None
        tags = result.get("tags") or []

        if not title:
            print(f"  error: no title for {safe(path)}", file=sys.stderr)
            continue

        try:
            embedding = embed(f"{title}\n\n{content}")
            document_id = insert_document(title, content, url, embedding)
        except Exception as exc:  # noqa: BLE001
            print(f"  error inserting {safe(path)}: {exc}", file=sys.stderr)
            continue

        if document_id is not None:
            for tag in tags:
                if not (isinstance(tag, str) and tag.strip()):
                    continue
                try:
                    link_category(document_id, category_id(tag))
                except Exception as exc:  # noqa: BLE001
                    print(f"  error linking category {tag!r}: {exc}", file=sys.stderr)

        with open(marker, "w") as f:
            json.dump(
                {"title": title, "url": url, "tags": tags, "source": safe(path)},
                f,
                ensure_ascii=False,
                indent=2,
            )

        print(f"  -> title={title!r} url={url!r} tags={tags!r}")

    # Always sync the DB into the seed migration, even when nothing new was
    # ingested, so rows that are already in the DB also land in the file.
    try:
        sync_migration()
        print(f"migration seed synced -> {MIGRATION_FILE}")
    except Exception as exc:  # noqa: BLE001
        print(f"  error syncing migration seed: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
