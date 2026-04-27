# English Variant

A focused MVP that teaches users the differences between **British English**
and **American English** — detect, understand, convert, practise.

Not a generic English tutor. Not a chatbot. One sharp idea, executed well.

---

## What this app does

1. **Detect** — paste text, see every British and American marker, with the clue that explains why.
2. **Understand** — each marker shows the equivalent in the other variant, plus a short editorial note.
3. **Convert** — one click rewrites the whole text into a single, consistent variant.
4. **Practise** — short drills built from the markers you actually miss.

Everything flows from a single, curated content library — 37 hand-picked
British/American contrasts covering vocabulary, spelling, pronunciation,
grammar, and usage.

---

## Architecture

```
aksan/
├── apps/
│   ├── web/          Next.js 15 · App Router · HeroUI · Tailwind v4
│   └── mobile/       Expo SDK 52 · expo-router · shared tokens
├── packages/
│   ├── shared/       Design tokens · domain types · Zod schemas ·
│   │                 dialect analyzer · Supabase client factory · AI interface
│   └── content/      Seed dataset (37 contrasts) and helpers
├── supabase/
│   ├── config.toml
│   ├── migrations/   20260424000000_init.sql
│   └── seed.sql      Generated from packages/content
└── docs/PROGRESS.md  Append-only engineering log
```

### Why a monorepo, not a single cross-platform codebase

HeroUI is a web library. Forcing it into native would mean writing a second
component layer to shim it. Instead, **we share logic, not UI primitives**:

- `packages/shared` holds the entire domain: tokens, types, schemas, the dialect
  analyzer, the AI service interface, and the Supabase client factory. Both
  apps import from it.
- `apps/web` uses HeroUI.
- `apps/mobile` uses a small set of token-driven RN primitives (`components/ui.tsx`)
  built directly from the same design tokens, so the two apps look and feel
  like the same product.

When HeroUI Native matures, the mobile primitives can be swapped out without
touching any business logic.

### Why npm workspaces, not Turborepo

Two apps, two packages. Turborepo adds caching and pipeline orchestration,
which we don't need at this size. We'll add it when build times hurt.

---

## Getting started

### Prerequisites

- Node 20+ and npm 10+
- Expo CLI for mobile development (`npx expo` works, no global install needed)
- [Supabase CLI](https://supabase.com/docs/guides/cli) for running the local database

### 1. Install

From the repo root:

```bash
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required: Expo SDK 52 still declares `react@^18.2` as a
peer, even though SDK 52 supports React 19. This is a false positive that npm 9+
trips on — the `--legacy-peer-deps` flag matches Expo's own recommendation.

npm workspaces will link the shared packages automatically.

### 2. Start Supabase locally

```bash
supabase start          # requires Docker Desktop running
supabase db reset       # applies migration + seed
```

Note the `anon` key and API URL printed in the terminal.

> **Windows note:** if Docker Desktop isn't already running,
> `supabase start` will hang. Launch Docker Desktop manually first and wait
> for the whale icon to go solid before running the command.

Alternatively, run against a hosted Supabase project:

- Copy the SQL in `supabase/migrations/20260424000000_init.sql` into the SQL Editor.
- Then run `supabase/seed.sql` to populate content.
- Copy the project URL and anon key into the two `.env.local` files.

### 3. Configure env vars

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env
# Fill in SUPABASE_URL and SUPABASE_ANON_KEY in both.
```

### 4. Run the web app

```bash
npm run web
# → http://localhost:3000
```

### 5. Run the mobile app

```bash
npm run mobile
# Then press 'i' for iOS simulator, 'a' for Android, or scan the QR code in Expo Go.
```

---

## How the content system works

Content lives in `packages/content/src/seed.ts` as strongly-typed
`ContentItem[]`. Each item carries:

- `id` (stable kebab-case slug)
- `category` — `vocabulary | spelling | pronunciation | grammar | usage`
- `level` — 1/2/3 difficulty
- `tags` — free-form labels for filtering
- `uk` + `us` — term, example sentence, audio URL (null for MVP), optional IPA
- `notes` — short editorial note
- `clues` — explicit detection hints the analyzer and UI can surface
- `traps` — common confusion cases

To scale the library:

1. Add new items to `seed.ts`.
2. Run `node supabase/seed/generate-seed.mjs` to regenerate `supabase/seed.sql`.
3. Run `supabase db reset` (or push to prod) to apply.

The web/mobile apps read seed content directly at build time. Once we move to
a live-editable library, switch the apps to query `content_items` from Supabase
(the schema is already in place).

---

## How the checker works

Two passes of a rule-based analyzer in `packages/shared/src/analyzer/`:

1. **Lexicon pass** — looks up multi-word phrases first, then single words,
   against a curated list (`rules.ts`). Each entry is a triple of
   `(uk, us, clue)`, so every match carries its own explanation.
2. **Suffix pass** — applies high-precision regex rules for systematic
   contrasts: `-ise/-ize`, `-our/-or`, `-re/-er`, `-ogue/-og`, double-L
   inflection, `-yse/-yze`, `-ae/-e`. Exceptions list protects words that
   share the suffix shape but aren't contrasts (e.g. `exercise`, `franchise`).

The analyzer returns `Finding[]` objects with character offsets, so the UI
can highlight them inline and the `rewrite()` function can produce a
fully-consistent version of the input in either variant.

It's deterministic and explainable — no API keys required. AI is layered on
top via `packages/shared/src/ai/` as a pluggable service for richer
explanations. A no-op implementation ships by default so the app works
without any keys.

---

## Supabase schema

| Table | Purpose | RLS |
|---|---|---|
| `profiles` | one row per auth user, auto-created by trigger | owner-only |
| `user_preferences` | target variant + reason tags | owner-only |
| `content_items` | the shared content library | public read |
| `attempts` | every practice answer | owner-only |
| `saved_items` | user-saved content | owner-only |
| `review_queue` | missed items with a miss counter (auto-maintained) | owner-only |
| `progress_summary` | streak + accuracy (auto-maintained) | owner-only |

Triggers do the bookkeeping:

- On `auth.users` insert → creates a `profiles` row.
- On `attempts` insert → upserts `review_queue` (wrong answers) and updates
  `progress_summary` (streak, totals).

---

## What to build next

The MVP foundation is in place. Natural follow-ups:

1. **Audio** — wire a small catalog of UK/US audio samples and plug them into
   `listen_and_identify` exercises. Schema supports it already.
2. **AI explanations** — swap `noopAiService` for a real provider (OpenAI /
   Anthropic) behind a server action. Use it for the trickiest contrasts only;
   don't chat-ify the app.
3. **Consistency exercises** — the MVP ships with the first two exercise types.
   Adding `make_consistent` and `listen_and_identify` means wiring the UI —
   the grader and shapes already exist in `packages/shared/src/exercises`.
4. **Spaced repetition** — tighten the review queue with interval scheduling
   (the `miss_count + last_seen_at` columns are the groundwork).
5. **Pronunciation feedback** — out of scope for MVP, but the schema doesn't
   preclude it. Treat it as a v2 module.
6. **Content authoring** — the seed dataset is quality over quantity. At 200+
   items, switch to authoring content in Supabase directly and drop the
   generator.

---

## Design direction

- Calm, typography-led, minimal.
- One accent (deep slate-blue) — no flag colors.
- Dialect markers are neutral earth tones (warm tea for UK, cool navy for US)
  to keep the app informational, not nationalistic.
- Generous whitespace. No gamification theatrics.
- Strong microcopy over visual noise.

Tokens live in `packages/shared/src/tokens/index.ts` and are mirrored in
`apps/web/src/app/globals.css` (Tailwind v4 `@theme`) and used directly in
`apps/mobile/lib/theme.ts`. Changing a color in tokens propagates to both.

---

## Verified status

| What | Status |
|---|---|
| `npm install` across all workspaces | ✅ |
| `npm run typecheck` for `packages/shared`, `packages/content`, `apps/web`, `apps/mobile` | ✅ |
| `npm run build` for the web app (11 routes, middleware 87.9 kB) | ✅ |
| Dev server on http://localhost:3000 | ✅ |
| Landing + sign-in pages render | ✅ |
| Middleware auth-gate (authed routes 307 → `/sign-in?next=…`) | ✅ |
| Supabase migration + seed | ⏳ requires Docker Desktop locally |
| Mobile Expo run | ⏳ user machine — not exercised during this session |

## Engineering conventions

- TypeScript everywhere, `strict: true`, `noUncheckedIndexedAccess: true`.
- Zod for any runtime boundary (onboarding input, attempt payloads, env).
- Supabase migrations are plain SQL and reviewed like code.
- The analyzer is pure. Tests live next to it; logic is free of side effects.
- Content is data, not code — treat `seed.ts` like a spreadsheet.

See `docs/PROGRESS.md` for the running engineering log.
