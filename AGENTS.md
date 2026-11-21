# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository.

## Package Manager

Always use **pnpm**. Never use `npm` or `yarn`, and never commit a `package-lock.json` or `yarn.lock`.

## Commands

```bash
pnpm dev       # development server
pnpm build     # production build
pnpm lint      # oxlint (config in .oxlintrc.json)
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

**Linting** uses oxlint (`.oxlintrc.json`). The rule set mirrors Next.js's recommended config (core-web-vitals + TypeScript). Two rules oxlint lacks natively run through its `jsPlugins` bridge as `next-js/*` and `react-js/*`. Keep the packages listed under `jsPlugins` installed even though nothing imports them. Suppress a rule with `// oxlint-disable-next-line <rule>`, and only with a comment explaining why.

## Tailwind v4

There is no `tailwind.config.js`. Tailwind v4 is configured entirely via PostCSS (`postcss.config.mjs`). All theme customization (colors, dark mode, animations) lives in `app/globals.css` using `@theme inline` CSS variables. Do not create a `tailwind.config.js`.

## Setup

For setup and onboarding (env vars, local Supabase, seeded login, deploying), see the root [README.md](README.md). Keep setup instructions there, not in this file.

## Supabase

**Which key where:**

- **Publishable key**: used by the browser client (`utils/supabase/client.ts`) and the proxy (`utils/supabase/proxy.ts`). It acts as the signed-in user, so RLS applies. Use it for anything that runs on behalf of a user.
- **Secret key**: only via `createAdminClient()` in `utils/supabase/admin.ts`, and only in server code (Route Handlers, Server Actions, Server Components). It bypasses RLS. Use it for privileged work like `auth.admin.*`. Never give it a `NEXT_PUBLIC_` prefix and never import the admin client from a Client Component. The `server-only` import makes the build fail if you do.

**Migrations:**

- Schema changes go in `supabase/migrations/` as timestamped SQL files. Create them with `pnpm exec supabase migration new <name>`, and never edit a migration that has already been applied.
- Auth needs no migration, since Supabase ships the `auth` schema. Add migrations only for app tables, each with RLS policies.
- `supabase/seed.sql` is local-only test data. Never put anything there that a hosted project depends on.

**Auth flag**: `AUTH_ENABLED` in `config/auth.ts` gates the `proxy.ts` route protection and the Navbar auth UI. Check it when touching auth-related code.

## Architecture Patterns

**Context + Hooks**: Contexts in `contexts/` define providers; custom hooks in `hooks/` consume them. Components call `useAuth()`, `useToast()` — never import contexts directly.

**Types**: All TypeScript interfaces live in `lib/types/` (per-feature files). Import via the barrel: `import { AuthContextType } from '@/lib/types'`.

**Shadcn UI**: All 40+ components are pre-installed in `components/ui/`. Do not recreate them — import from there directly.

**Reusable components**: If a piece of UI could plausibly be reused, build it as its own component in `components/` (e.g. `components/EmptyState.tsx`) instead of composing the raw shadcn primitives inline at each call site. Example: don't hand-assemble `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription` from `@/components/ui/empty` on every page. Wrap them once in an `EmptyState` component with props (`icon`, `title`, `description`, `action`) and use that everywhere. Before writing new UI, check `components/` for an existing wrapper and extend it rather than duplicating. Leave `components/ui/` untouched, since those files are shadcn-managed and get overwritten on update.

**Path alias**: `@/` maps to the project root. Use it for all non-relative imports.

**Server vs. Client Components**: Default to Server Components. Add `'use client'` only when the component needs state, effects, event handlers, context, or browser APIs. Push it down to the smallest leaf that needs it; don't mark a whole page as a client component for one interactive button.

## UI Building Blocks

Use these existing helpers instead of re-implementing them.

**Typography**: Use `<Text>` from `@/components/Text` instead of raw text elements with hand-written font classes.

- Headings: `variant='hd-xs' | 'hd-sm' | 'hd-md' | 'hd-lg' | 'hd-xl' | 'hd-xxl'`. They're responsive and render `h6`–`h1` automatically, and `size` is ignored.
- Body text: `variant='default' | 'muted' | 'caption' | 'label'`, with `size='xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'` for scale.
- Override the element with `as` (e.g. `as='label' htmlFor='email'` for a real form label).

```tsx
// Do
<Text variant='hd-lg'>Features</Text>
<Text variant='muted' size='sm'>Last updated today</Text>

// Don't
<h3 className='text-xl md:text-2xl font-bold'>Features</h3>
```

**Toasts**: Call `const { toast } = useToast()` from `@/hooks/use-toast` (`toast.success`, `toast.error`, `toast.info`, `toast.warning`, `toast.promise`, …). Never import `sonner` directly in app code. For custom durations, use `DURATIONS` from `@/lib/durations` (`TOAST_SHORT`, `TOAST_LONG`) instead of hard-coded milliseconds, and add a new member there if none fits.

**Staggered animations**: Use `getDelayClass(index)` from `@/utils/animations` to stagger list items, instead of writing `delay-[…]` classes by hand.

## Before Finishing a Task

Run all three and fix any failures before calling the work done:

```bash
pnpm format
pnpm lint
pnpm typecheck
```

CI runs `format:check`, `lint`, and `typecheck` on every push and PR. For changes that affect routing, rendering, or config, also run `pnpm build`.

## Branch & PR Conventions

Use prefixed branches: `feature/*`, `fix/*`, `chore/*`.

**Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org): `type(optional-scope): summary`, lowercase and imperative, no trailing period.

| Type       | Use for                                    |
| ---------- | ------------------------------------------ |
| `feat`     | New user-facing functionality              |
| `fix`      | Bug fixes                                  |
| `chore`    | Tooling, config, maintenance               |
| `docs`     | README, AGENTS.md, comments                |
| `style`    | Formatting only (no logic change)          |
| `refactor` | Code changes that don't alter behavior     |
| `ci`       | GitHub Actions workflows                   |
| `deps`     | Use as a scope: `chore(deps): update next` |

Examples: `feat: add EmptyState component`, `fix(auth): redirect after logout`, `chore(deps): bump supabase-js`.

PRs use the template in `.github/pull_request_template.md`. Fill in Summary and Why, and add screenshots for UI changes.
