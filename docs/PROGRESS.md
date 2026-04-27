# English Variant — Progress Notes

Concise, append-only log of what's been done. One line per material change.

## 2026-04-24 — Foundation

- Audited repo: empty project, npm 10, Node 22. Root had HeroUI web + native deps installed but no source.
- Decided on npm workspaces (not Turborepo) — simpler, fewer moving parts, can upgrade later.
- Laid out monorepo:
  - `apps/web` — Next.js 15 (App Router) + HeroUI + Tailwind v4
  - `apps/mobile` — Expo SDK 52 + heroui-native + NativeWind
  - `packages/shared` — design tokens, domain types, Zod schemas, dialect analyzer, Supabase client factory
  - `packages/content` — seed dataset (British vs American contrasts) and content helpers
  - `supabase/` — migrations + seed SQL
- Redistributed existing root dependencies across web/mobile workspaces.
- TypeScript everywhere, strict mode.
- Auth decision: Supabase magic-link (one input, no password hygiene, clean first-run).
- Content decision: deterministic analyzer first (token-level scanner against the seed dataset). AI is a pluggable service behind a thin interface; real provider (OpenAI/Anthropic) swaps in via env var. MVP ships with a no-op AI stub so nothing is broken without keys.

## 2026-04-24 — Shared domain landed

- `packages/shared/src/tokens` — full token system (colors, spacing, radius, typography, elevation, motion).
- `packages/shared/src/types` — domain types (Variant, ContentItem, Attempt, Profile, ReviewQueueEntry, etc.).
- `packages/shared/src/schemas` — Zod schemas for content, onboarding input, attempt input.
- `packages/shared/src/analyzer` — deterministic dialect analyzer with lexicon + suffix-rule passes. Smoke-tested against exception handling and inflectional forms.
- `packages/shared/src/exercises` — exercise builders and a pure `grade()` function.
- `packages/shared/src/supabase` — typed client factory + hand-authored `Database` types.
- `packages/shared/src/ai` — `AiService` interface + `noopAiService` fallback using the analyzer only.

## 2026-04-24 — Content seed

- 37 hand-picked British/American contrasts in `packages/content/src/seed.ts` across all 5 categories.
- Each entry has natural example sentences, detection clues, and confusion traps where applicable.
- `supabase/seed/generate-seed.mjs` emits `supabase/seed.sql` from the TS source — keeps one source of truth.

## 2026-04-24 — Supabase layer

- `supabase/migrations/20260424000000_init.sql` — 7 tables, RLS on every user-scoped table.
- Triggers handle `profiles` auto-creation, `review_queue` bookkeeping, and `progress_summary` maintenance (including streak logic).
- `supabase/config.toml` wired for both web (`http://localhost:3000`) and mobile (`englishvariant://auth/callback`) redirects.

## 2026-04-24 — Web app

- Next.js 15 App Router, Tailwind v4, HeroUI.
- Middleware guards authed routes; `/auth/callback` handles magic-link exchange.
- Route group `(app)` enforces auth + onboarding before any authed screen.
- Pages: landing, sign-in, onboarding, home, practice, checker, review.
- Components: `Brand`, `Shell`, `DialectBadge`, `MarkerText`, `Providers`.
- Checker renders inline highlighted markers with tooltips + one-click variant-consistent rewrite with a diff of changes.

## 2026-04-24 — Mobile app

- Expo SDK 52 with expo-router and typed routes.
- Shared token-driven UI primitives in `components/ui.tsx` (Screen, Title, Body, Card, Button, Field, DialectChip).
- Session-aware root layout redirects between sign-in, onboarding, and `(app)` tabs.
- Screens: sign-in (magic link), onboarding, home, practice, checker, review — full parity with the web MVP.

## 2026-04-24 — Analyzer bug fixes after smoke test

- Added `fav`, `harb`, `parl`, `rig` stems to the `-our/-or` rule and `ite(s)` suffix so `favour`, `favourite`, `harbour`, etc. are now detected.
- Fixed exception lookup: `isExcepted()` now tries multiple lemma reductions so inflected forms like `promised`, `advertised`, `surprised` hit their base-form exceptions.
- Verified with assertions: exception-safe words skipped; expected markers caught bidirectionally.

## 2026-04-24 — Build verified end-to-end

- `npm install` across all workspaces succeeds with `--legacy-peer-deps` (Expo SDK 52 still declares `react@^18.2` peer, which is a known false positive — SDK 52 actually supports React 19).
- Added root-level `overrides` block pinning `react`/`react-dom` to `19.2.5` — without it, mobile's pinned `19.0.0` propagates to the root hoist and trips Next.js's version-match check at build time.
- Upgraded `@supabase/ssr` from `0.5.2` → `0.10.x`. The older version returned a `SupabaseClient` with a 3-arg generic signature that no longer assigns to `@supabase/supabase-js@2.104`'s 5-arg signature, causing all query types to collapse to `never`.
- Added `Relationships: []` to every table in `packages/shared/src/supabase/types.ts`. `@supabase/postgrest-js`'s `GenericTable` requires it; without it, the `Schema` generic falls to `never` and `.from()`/`.select()` lose all typing.
- Dropped `.js` extensions from internal shared-package imports. Next.js's webpack doesn't auto-rewrite `./foo.js` → `./foo.ts` when transpiling workspace packages; the tsconfig `moduleResolution: "Bundler"` handles this correctly so the extensions were unnecessary.
- Rewrote the destructured swap in `packages/content/src/index.ts` (`[a, b] = [b, a]`) — SWC's parser doesn't accept non-null assertions (`!`) on destructuring targets.

### HeroUI v3 reality check

HeroUI v3 is a ground-up React Aria Components rewrite with a different API from v2:
- No `HeroUIProvider` needed (the library is provider-free)
- Form fields follow the compound-component pattern (`TextField.Root > Label + Input + Description`)
- Button variants are `primary | secondary | tertiary | ghost | outline | danger | danger-soft`

Rather than port every form to v3's compound API, I wrote a thin `@/components/ui` with token-driven native `<input>`/`<textarea>` wrappers and a `Button` that wraps HeroUI's v3 Button. This keeps the premium visual language, avoids fighting the API, and gives us an easy upgrade path if we want richer HeroUI fields later.

### Verified green

- `npm run typecheck` passes for: `packages/shared`, `packages/content`, `apps/web`, `apps/mobile`.
- `next build` produces 11 routes, middleware wired (87.9 kB), and static pages at all expected paths.
- Dev server serves `/` (200) and `/sign-in` (200) correctly; all authed routes (`/home`, `/practice`, `/checker`, `/review`) 307-redirect to `/sign-in?next=<path>`.

### Blocked on Docker (user-side)

- `supabase start` needs Docker Desktop running. Docker Desktop on Windows typically blocks on first launch waiting for consent / sign-in that requires a user click. I launched the exe but the daemon never came up from automation alone. User needs to open Docker Desktop once, confirm any first-run prompts, then re-run `supabase start` + `supabase db reset`.
- Placeholder `.env.local` (web) and `.env` (mobile) point at the default local Supabase URL/anon key so the apps compile and the dev server serves pages without crashing. They work as-is once Supabase is up on `127.0.0.1:54321`.

## Architectural tradeoffs (captured briefly)

- **No Turborepo yet**: npm workspaces are sufficient for 2 apps + 2 packages. Add Turbo only when build times hurt.
- **No shared UI package**: HeroUI on web, heroui-native on mobile. We share tokens + logic, not components. This is the right call for a web lib that was never meant to render in native.
- **Deterministic analyzer first, AI second**: The seed dataset gives us precise, explainable detection today. AI is reserved for rewrites and edge-case explanations where deterministic rules break down.
- **Supabase migrations as SQL files**: Clean, portable, reviewable. No ORM for MVP — the shared package exposes typed Supabase client queries.
