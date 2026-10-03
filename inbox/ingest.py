#!/usr/bin/env python3
"""Extract title, url and tags (categories + subcategories) from markdown documents
via DeepSeek and insert them into the `initiatives` table.

The prompt is given the tags already present in the DB so the model reuses the
exact same wording instead of inventing new variants of an existing category.

Usage:
    python3 ingest.py markdown/*.md
"""

import json
import os
import subprocess
import sys
import urllib.request

DB_CONTAINER = os.environ.get("DB_CONTAINER", "hubmi-confidence-team-db-1")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_NAME = os.environ.get("DB_NAME", "hubmi")

DEEPSEEK_URL = os.environ.get("DEEPSEEK_URL", "https://api.deepseek.com/anthropic")
DEEPSEEK_KEY = os.environ.get("DEEPSEEK_KEY", "")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")


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


def existing_tags() -> list[str]:
    out = psql("SELECT DISTINCT unnest(tags) FROM initiatives ORDER BY 1;")
    return [line.strip() for line in out.splitlines() if line.strip()]


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


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
        "Existing categories/tags:\n"
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


def extract(path: str, existing: list[str]) -> dict:
    content = read_text(path)
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


def insert(title: str, url: str | None, tags: list[str]) -> None:
    clean_tags = [t.strip() for t in tags if isinstance(t, str) and t.strip()]
    tags_sql = "ARRAY[" + ",".join(sql_literal(t) for t in clean_tags) + "]"
    url_sql = sql_literal(url.strip()) if url else "NULL"

    sql = (
        "INSERT INTO initiatives (title, url, tags) VALUES "
        f"({sql_literal(title.strip())}, {url_sql}, {tags_sql}) "
        "ON CONFLICT (url) DO NOTHING;"
    )
    psql(sql)


def main(paths: list[str]) -> int:
    if not DEEPSEEK_KEY:
        print("DEEPSEEK_KEY is not set.", file=sys.stderr)
        return 1

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

        marker = os.path.join("processed", safe(os.path.splitext(os.path.basename(path))[0]) + ".json")
        if os.environ.get("FORCE") != "1" and os.path.exists(marker):
            print(f"skip {safe(path)} (already processed)")
            continue

        print(f"extracting {safe(path)} ...")

        try:
            result = extract(path, existing_tags())
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
            insert(title, url, tags)
        except Exception as exc:  # noqa: BLE001
            print(f"  error inserting {safe(path)}: {exc}", file=sys.stderr)
            continue

        with open(marker, "w") as f:
            json.dump(
                {"title": title, "url": url, "tags": tags, "source": safe(path)},
                f,
                ensure_ascii=False,
                indent=2,
            )

        print(f"  -> title={title!r} url={url!r} tags={tags!r}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
