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

`OPENAI_API_KEY` selects the OpenAI backend in `lib/embedding.ts`. Leave it empty to use mock embeddings until you want real vectors. Inside Compose, `DATABASE_URL` is overridden so the app reaches Postgres at the `db` service.

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

The app source is bind-mounted into the `web` container, and Next.js runs in dev mode with file polling. Edit files on the host (for example `app/page.tsx`) and refresh http://localhost:3001. Do not rebuild the image for source changes.

Rebuild after changing `package.json` or `package-lock.json`:

```bash
docker compose up --build
```

## What is included

- Next.js dev server on port 3000
- PostgreSQL 16 with the pgvector extension
- TypeORM mapping for a `documents` table (`embedding vector(1536)`)
- OpenAI client (`text-embedding-3-small`) used by the embed form once `OPENAI_API_KEY` is set
