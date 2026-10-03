# HUBMI confidence team

Next.js app with TypeORM, PostgreSQL (pgvector), and the OpenAI TypeScript client. Docker Compose runs the app and the database.

## Requirements

- Docker with Compose v2

## Setup

Create a `.env` file in the project root. It is not committed.

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hubmi
OPENAI_API_KEY=
```

`OPENAI_API_KEY` selects the OpenAI backend in `lib/embedding.ts`. Leave it empty to use local keyword embeddings (hashed words, stems and trigrams; no API calls). After switching backends, run `update documents set embedding = null` so documents are re-embedded with the same model as queries. Check search quality with `npm run eval:search`. Inside Compose, `DATABASE_URL` is overridden so the app reaches Postgres at the `db` service.

## Run

```bash
docker compose up --build
```

- App: http://localhost:3001 (container listens on 3000)
- Postgres: `localhost:5433` on the host → `5432` in the container (database `hubmi`, user `postgres`, password `postgres`). Use port `5433` in `DATABASE_URL` when connecting from the host; the `web` service still uses `db:5432` inside Compose.

The first start builds the Next.js image and enables the `vector` extension. Later starts can omit `--build` unless dependencies change:

```bash
docker compose up
```

Stop it with Ctrl+C, or, if it is running in the background:

```bash
docker compose down
```

## Live reload

The app source is bind-mounted into the `web` container, and Next.js runs in dev mode. On Linux, the bind mount delivers file events, so the dev server reloads without polling. Edit files on the host (for example `app/page.tsx`) and refresh http://localhost:3001. Do not rebuild the image for source changes.

Rebuild after changing `package.json` or `package-lock.json`:

```bash
docker compose up --build
```

## Admin panel

http://localhost:3001/admin/initiatives lists every submitted social initiative (title, description, date, vote count, location, contact e-mail) and deletes it with **Usuń**. Deleting an initiative also deletes its votes.

There is no admin account. The panel has no login and no password, so anyone who opens the URL can use it, whether logged in or not. `AuthGate` (`app/_components/auth-gate.tsx`) lets every path under `/admin` through, and the Server Actions in `app/admin/initiatives/actions.ts` check nothing. Nothing on the regular pages links to it; open it by typing the address.

Do not deploy it publicly as is. Add authentication to the page and to its Server Actions first.

## What is included

- Next.js dev server on port 3000
- PostgreSQL 16 with the pgvector extension
- TypeORM mapping for a `documents` table (`embedding vector(1536)`)
- OpenAI client (`text-embedding-3-small`) used by the embed form once `OPENAI_API_KEY` is set
- Social initiatives: `/initiatives` lists them ranked by votes (one vote per user, click **+** again to take it back), and `/initiatives/new` submits one. They are stored in the `initiatives` and `initiative_votes` tables, which TypeORM creates (`synchronize: true`).
- Knowledge base seeded from `md-database/*.md` on every app start (`lib/seed-documents.ts`). Each file starts with a `title:` / `categories: [...]` frontmatter block. The embedding is built from the title only and is created once per document (clear `documents.embedding` to force a re-embed). Documents or categories without a backing file are deleted.
