# HUBMI confidence team — agent notes

## Structure

| Path | Role |
|------|------|
| `app/` | Next.js App Router: layouts, `page.tsx` routes, optional `route.ts` APIs, Server Actions |
| `lib/` | TypeORM data source & entities, OpenAI helpers |
| `db/init.sql` | Postgres pgvector extension on first container init |
| `docker-compose.yml` | `web` (Next dev) + `db` (pgvector Postgres) |

Path alias: `@/*` → project root.

## Technologies to use

1. **Next.js** — App Router pages under `app/`, Route Handlers under `app/api/**/route.ts` when appropriate, Server Actions for mutations. Server Components by default.
2. **TypeORM** — All database access via `getDataSource()` from `@/lib/data-source`. Entities live in `lib/`. Register new entities on `AppDataSource`. Postgres includes **pgvector** for embeddings.
3. **Embeddings** — `@/lib/embedding` (`EmbeddingProvider`, `createEmbedding`); OpenAI when `OPENAI_API_KEY` is set, otherwise mock (see local `.env`, not committed).

Do not add parallel DB layers (raw `pg` pools, Prisma, etc.) unless the user explicitly asks.

## React UI

When props would chain through **more than two** wrapper components, use **Context + Provider** and a small `useX()` hook instead of prop drilling. Providers are client components; keep TypeORM/OpenAI on the server.

## Run locally

See `README.md`: `docker compose up --build`, app on http://localhost:3001.
