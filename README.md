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

## Local initiatives (Inicjatywy lokalne)

Logged-in users can submit local initiatives and vote on them. The **Inicjatywy lokalne** button on the home page opens the list.

| Page | What it does |
|------|--------------|
| `/initiatives` | Lists all initiatives ranked by vote count (ties: newest first). Click a card to expand it and read the full description, submission date and vote count. Click **+** to vote, and click it again to take the vote back. Each user has one vote per initiative. |
| `/initiatives/new` | Form opened with **Stwórz inicjatywę lokalną**: name, description, optional town, contact e-mail (pre-filled with the user's e-mail). |
| `/admin/initiatives` | Lists all initiatives and deletes them. See [Admin panel](#admin-panel). |

The contact e-mail is shown only in the admin panel, not on the public list.

### Data

| Table | Columns |
|-------|---------|
| `initiatives` | `id`, `title`, `description`, `location`, `contact_email`, `user_id` (submitter), `created_at` |
| `initiative_votes` | `id`, `initiative_id`, `user_id`, `created_at`; unique on (`initiative_id`, `user_id`); `ON DELETE CASCADE` from `initiatives` |

TypeORM creates both tables from the entities in `db/initiative.ts` and `db/initiative-vote.ts` (`synchronize: true`). There is no migration. The two entities reference each other by name (`"Initiative"`, `"InitiativeVote"`) with type-only imports, because importing each other's classes at runtime fails under Turbopack with "Cannot access 'Initiative' before initialization".

### Code

- `app/initiatives/page.tsx` renders the list page. `InitiativeVoteList.tsx` loads the list and handles votes, and `InitiativeCard.tsx` is one expandable card.
- `app/initiatives/actions.ts` has the Server Actions `listInitiatives(userId)`, which returns the ranking plus whether this user voted, and `toggleVote(initiativeId, userId)`.
- `app/initiatives/new/` holds the form (`InitiativeForm.tsx`) and its Server Action (`submitInitiative`).

The app has no server-side session, so the user id comes from the client (`useUser()`) and the server trusts it. Votes and the submitter id can therefore be spoofed by someone calling the actions directly.

## Admin panel

http://localhost:3001/admin/initiatives lists every submitted local initiative (title, description, date, vote count, location, contact e-mail) and deletes it with **Usuń**. Deleting an initiative also deletes its votes.

There is no admin account. The panel has no login and no password, so anyone who opens the URL can use it, whether logged in or not. `AuthGate` (`app/_components/auth-gate.tsx`) lets every path under `/admin` through, and the Server Actions in `app/admin/initiatives/actions.ts` check nothing. Nothing on the regular pages links to it; open it by typing the address.

Do not deploy it publicly as is. Add authentication to the page and to its Server Actions first.

## What is included

- Next.js dev server on port 3000
- PostgreSQL 16 with the pgvector extension
- TypeORM mapping for a `documents` table (`embedding vector(1536)`)
- OpenAI client (`text-embedding-3-small`) used by the embed form once `OPENAI_API_KEY` is set
- Local initiatives with voting and an admin panel (see [Local initiatives](#local-initiatives-inicjatywy-lokalne))
- Knowledge base seeded from `md-database/*.md` on every app start (`lib/seed-documents.ts`). Each file starts with a `title:` / `categories: [...]` frontmatter block. The embedding is built from the title only and is created once per document (clear `documents.embedding` to force a re-embed). Documents or categories without a backing file are deleted.
