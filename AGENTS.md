# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository.

## Package Manager

Always use **pnpm**. Never use `npm` or `yarn`. Two lockfiles exist (`pnpm-lock.yaml` and `package-lock.json`) — pnpm-lock.yaml is authoritative.

## Commands

```bash
pnpm dev       # development server
pnpm build     # production build
pnpm lint      # ESLint (eslint-config-next/core-web-vitals + typescript)
pnpm format    # Prettier — formats all files
```

## Code Style

Prettier is enforced via `.prettierrc`. Key non-default settings:

- `printWidth: 90` (not 80)
- `singleQuote: true` and `jsxSingleQuote: true`
- `endOfLine: "lf"` — always LF, even on Windows
- Import order is auto-sorted by `@ianvs/prettier-plugin-sort-imports`:
  1. `react` and `react-*`
  2. Third-party packages
  3. `@/components/*`
  4. `@/hooks/*`
  5. `@/utils/*`
  6. Relative imports

Run `pnpm format` after edits rather than sorting imports manually.

## Tailwind v4

There is no `tailwind.config.js`. Tailwind v4 is configured entirely via PostCSS (`postcss.config.mjs`). All theme customization (colors, dark mode, animations) lives in `app/globals.css` using `@theme inline` CSS variables. Do not create a `tailwind.config.js`.

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SECRET_KEY=
```

The URL and publishable key must be set or the Supabase client will log warnings and auth will fail. `.env.example` has a one-liner that fills all three from `supabase status`.

**Which key where:**

- **Publishable key**: used by the browser client (`utils/supabase/client.ts`) and the proxy (`utils/supabase/proxy.ts`). It acts as the signed-in user, so RLS applies. Use it for anything that runs on behalf of a user.
- **Secret key**: only via `createAdminClient()` in `utils/supabase/admin.ts`, and only in server code (Route Handlers, Server Actions, Server Components). It bypasses RLS. Use it for privileged work like `auth.admin.*`. Never give it a `NEXT_PUBLIC_` prefix and never import the admin client from a Client Component. The `server-only` import makes the build fail if you do.

## Local Supabase

Development is local-first. The Supabase CLI is a devDependency, so use it through `pnpm` (needs Docker running):

```bash
pnpm db:start    # start local Supabase; prints the API URL and publishable key for .env.local
pnpm db:status   # show the URL/keys again
pnpm db:reset    # drop the local DB, re-run migrations + seed
pnpm db:stop
```

- Schema changes go in `supabase/migrations/` as timestamped SQL files. Create them with `pnpm exec supabase migration new <name>`; never edit a migration that has already been applied.
- `supabase/seed.sql` is local-only test data. It creates the login user `admin@example.com` / `password123`.
- Auth itself needs no migration: Supabase ships the `auth` schema. Add migrations only for app tables (with RLS policies).
- Auth is behind the `AUTH_ENABLED` flag in `config/auth.ts`. It gates the `proxy.ts` route protection and the Navbar auth UI.

## Architecture Patterns

**Context + Hooks**: Contexts in `contexts/` define providers; custom hooks in `hooks/` consume them. Components call `useAuth()`, `useToast()` — never import contexts directly.

**Types**: All TypeScript interfaces live in `lib/types/` (per-feature files). Import via the barrel: `import { AuthContextType } from '@/lib/types'`.

**Shadcn UI**: All 40+ components are pre-installed in `components/ui/`. Do not recreate them — import from there directly.

**Reusable components**: If a piece of UI could plausibly be reused, build it as its own component in `components/` (e.g. `components/EmptyState.tsx`) instead of composing the raw shadcn primitives inline at each call site. Example: don't hand-assemble `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription` from `@/components/ui/empty` on every page. Wrap them once in an `EmptyState` component with props (`icon`, `title`, `description`, `action`) and use that everywhere. Before writing new UI, check `components/` for an existing wrapper and extend it rather than duplicating. Leave `components/ui/` untouched, since those files are shadcn-managed and get overwritten on update.

**Path alias**: `@/` maps to the project root. Use it for all non-relative imports.

## Branch & PR Conventions

Use prefixed branches: `feature/*`, `fix/*`, `chore/*`.
