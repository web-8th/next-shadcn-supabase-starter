# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Codex, etc.) when working with code in this repository.

## Package Manager

Always use **pnpm**. Never use `npm` or `yarn`, and never commit a `package-lock.json` or `yarn.lock`.

## Commands

```bash
pnpm dev         # development server
pnpm build       # production build
pnpm check       # format:check + lint + typecheck (same as CI, minus build)
pnpm lint        # oxlint (config in .oxlintrc.json)
pnpm format      # Prettier — formats all files
pnpm typecheck   # tsc --noEmit
pnpm db:types    # regenerate lib/types/database.ts from the local database
pnpm db:types:check  # fail if database.ts doesn't match the local database
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

**Which client where:**

| Code runs in                                      | Use                                                   |
| ------------------------------------------------- | ----------------------------------------------------- |
| Client Component                                  | `createClient()` from `@/utils/supabase/client`       |
| Server Component, Server Action, Route Handler    | `await createClient()` from `@/utils/supabase/server` |
| Server code that needs the signed-in user         | `await getUser()` from `@/utils/supabase/server`      |
| Server code that must bypass RLS (`auth.admin.*`) | `createAdminClient()` from `@/utils/supabase/admin`   |
| Client Component that needs the current user      | `useAuth()` from `@/hooks/use-auth`                   |

- Default to the server client in Server Components and Server Actions. It acts as the signed-in user, so RLS protects the data. Reach for the admin client only when a user's own permissions can't do the job, and say why in a comment.
- Create clients inside the function that uses them. Never create one at module level: the app has to import, build, and render without Supabase env vars. Use `isSupabaseConfigured` from `@/utils/supabase/env` to branch on that.
- On the server, trust `getUser()`, which verifies the session with Supabase Auth. Don't trust `getSession()` there, since it reads the cookie without verifying it.
- Don't add new ways to construct a Supabase client. Extend the files in `utils/supabase/`.

**Which key where:**

- **Publishable key**: used by the browser client (`utils/supabase/client.ts`), the server client (`utils/supabase/server.ts`), and the proxy (`utils/supabase/proxy.ts`). It acts as the signed-in user, so RLS applies. Use it for anything that runs on behalf of a user.
- **Secret key**: only via `createAdminClient()` in `utils/supabase/admin.ts`, and only in server code (Route Handlers, Server Actions, Server Components). It bypasses RLS. Use it for privileged work like `auth.admin.*`. Never give it a `NEXT_PUBLIC_` prefix and never import the admin client from a Client Component. The `server-only` import makes the build fail if you do.

**Migrations:**

- Schema changes go in `supabase/migrations/` as timestamped SQL files. Create them with `pnpm exec supabase migration new <name>`, and never edit a migration that has already been applied. Fix mistakes with a new migration.
- Auth needs no migration, since Supabase ships the `auth` schema. Add migrations only for app tables.
- Every table gets `enable row level security` and explicit policies in the same migration. A table with RLS on and no policies is unreadable, and a table with RLS off is readable by anyone with the publishable key. Follow [docs/examples/profiles-table.md](docs/examples/profiles-table.md).
- Apply with `pnpm exec supabase migration up`, which keeps local data. Don't run `pnpm db:reset` without asking, because it wipes the local database.
- `supabase/seed.sql` is local-only test data. Never put anything there that a hosted project depends on.

**Database types:** `lib/types/database.ts` is generated (its header says so), so never edit it by hand. After any migration, run `pnpm db:types` and commit the result with the migration. The `Database types` CI workflow regenerates it from the migrations and fails the PR if the file doesn't match. Use the generated helpers for row types (`Tables<'todos'>`, `TablesInsert<'todos'>`, `TablesUpdate<'todos'>` from `@/lib/types`) instead of writing interfaces that duplicate table columns. If a query fails typecheck, the schema or the query is wrong; don't cast it away with `as` or `any`.

**Env vars:** add every new variable to `.env.example` with a comment saying what it's for and whether it's public. Only `NEXT_PUBLIC_*` values reach the browser.

**Auth flag**: `AUTH_ENABLED` in `config/auth.ts` gates the `proxy.ts` route protection, the Navbar's Login button, and its Admin link. Check it when touching auth-related code. Whenever someone is signed in, the Navbar shows `UserButton` (`components/UserButton.tsx`): their name plus a logout icon, which opens a confirm dialog. Get a user's name with `getDisplayName(user)` from `@/utils/user`.

## Architecture Patterns

**Context + Hooks**: Contexts in `contexts/` define providers; custom hooks in `hooks/` consume them. Components call `useAuth()`, `useToast()` — never import contexts directly.

**Types**: All TypeScript interfaces live in `lib/types/` (per-feature files). Import via the barrel: `import { AuthContextType } from '@/lib/types'`.

**Shadcn UI**: All 40+ components are pre-installed in `components/ui/`. Do not recreate them — import from there directly. Add missing ones with `pnpm dlx shadcn@latest add <name>`, which picks up the Base UI style from `components.json`.

**Reusable components**: If a piece of UI could plausibly be reused, build it as its own component in `components/` (e.g. `components/EmptyState.tsx`) instead of composing the raw shadcn primitives inline at each call site. Example: don't hand-assemble `Empty`, `EmptyHeader`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription` from `@/components/ui/empty` on every page. Wrap them once in an `EmptyState` component with props (`icon`, `title`, `description`, `action`) and use that everywhere. Before writing new UI, check `components/` for an existing wrapper and extend it rather than duplicating. Leave `components/ui/` untouched, since those files are shadcn-managed and get overwritten on update.

**Path alias**: `@/` maps to the project root. Use it for all non-relative imports.

**Server vs. Client Components**: Default to Server Components. Add `'use client'` only when the component needs state, effects, event handlers, context, or browser APIs. Push it down to the smallest leaf that needs it; don't mark a whole page as a client component for one interactive button.

## Base UI, not Radix (no `asChild`)

This project's shadcn style is **base-lyra**, built on [Base UI](https://base-ui.com). Most shadcn examples online, and most of what you may remember, use the Radix API. Follow these rules even when an example shows otherwise:

- **Never use `asChild`.** It doesn't exist here. To render a component as another element, pass that element through the `render` prop.
- **Add `nativeButton={false}`** to a `Button` whenever `render` turns it into something other than a `<button>`, such as a `Link` or `<a>`.
- **Triggers take `render` too** (`DialogTrigger`, `SheetTrigger`, `PopoverTrigger`, `DropdownMenuTrigger`, `TooltipTrigger`, …). Pass the `Button` as `render` instead of nesting a `Button` inside the trigger, which produces a button inside a button.
- **Never nest interactive elements**, like a `<Link>` inside a `<Button>`. Use `render`.
- Copying from the shadcn docs? Pick the **Base UI** tab. Before using a prop you haven't seen in this repo, check the component's source in `components/ui/`, since prop names differ from Radix in places.

```tsx
// Do
<Button nativeButton={false} render={<Link href='/settings' />}>
  Settings
</Button>
<DialogTrigger render={<Button variant='outline' />}>Open</DialogTrigger>

// Don't
<Button asChild>
  <Link href='/settings'>Settings</Link>
</Button>
<Button>
  <Link href='/settings'>Settings</Link>
</Button>
<DialogTrigger asChild>
  <Button variant='outline'>Open</Button>
</DialogTrigger>
```

`components/Navbar.tsx` and `components/Logo.tsx` show working examples.

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

Format, then run the checks, and fix any failures before calling the work done:

```bash
pnpm format
pnpm check   # format:check + lint + typecheck
```

CI runs `format:check`, `lint`, `typecheck`, and `build` (with no Supabase env vars) on every push and PR. For changes that affect routing, rendering, or config, also run `pnpm build`. If you added a migration, run `pnpm db:types`, include the regenerated file, and confirm `pnpm db:types:check` passes.

Never claim a check passed without running it. If something fails and you can't fix it, say so and include the error.

## Big Features

Before you start on a feature that's big or touches several areas at once (for example a new table plus server code plus UI, changes to auth, or anything that needs more than one PR):

1. **Offer the orchestrator skill, and wait for a yes** (see "Skills" below). Ask with the exact question in its "Confirm first" section. That question says what the orchestrator does and warns that it uses more usage than working directly, more so over long sessions. Start it only on a clear "yes". Anything else, including a question, means work directly. Never start it as a surprise.
2. **Write a plan** at `docs/planning/<feature-slug>/plan.md`, using the template in [docs/planning/README.md](docs/planning/README.md). Cover the goal, scope, areas affected, approach, data model, a PR-by-PR plan, and open questions. Show it to the user before building.
3. **Keep the plan current** as the work moves: tick off PRs, record decisions, update open questions. Commit it with the work, so teammates and their agents can pick up where you left off.

**Taking over a job:** if `docs/planning/<feature>/progress.md` exists and isn't `COMPLETE`, an orchestrator was working on it. Read its Handoff section first. Resume with the orchestrator skill, or do a single task by following its brief in `tasks/`.

Small, single-area changes don't need either; the issue and the PR are enough.

## Skills

Reusable workflows live in `.claude/skills/<name>/SKILL.md`. Claude Code loads them as slash commands (`/create-pr`). With any other agent, read the `SKILL.md` and follow it when the user asks for that workflow.

Agents may suggest a skill on their own, but a skill that costs a lot of usage or acts outside the repo (pushing, opening PRs) starts with a **"Confirm first"** step. Ask its question and wait for a clear "yes" before going on. A user typing the slash command, or asking for the workflow in their own words, already counts as yes.

| Skill          | What it does                                                                                                                                                                                           | When to use it                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `orchestrator` | Plans a big job, splits it into tasks, delegates them to sub-agents by difficulty, reviews, and verifies. Keeps a committed job folder in `docs/planning/<feature>/` that any agent can take over from | Big or multi-area features. Suggest it, then start only after the user says yes |
| `create-pr`    | Runs the checks, links the issue, and opens a PR with a Conventional Commit title and the PR template                                                                                                  | When the user asks for a PR, or after they say yes to your offer of one         |

**Every skill must be agent-agnostic.** A skill is plain Markdown that any agent can follow:

- Rely only on `git`, `gh`, `pnpm`, and the repo's own scripts, not on one tool's built-in features.
- Describe capabilities generically ("a sub-agent", "your task list", "ask the user"). Name a specific tool's option only as an example, and always say what to do when a tool lacks it.
- Keep the `name` and `description` frontmatter, so tools that index skills can find it.
- If the skill is costly or acts outside the repo, start it with a "Confirm first" step: the exact question to ask, and "continue only on a clear yes".

When you add a skill, add a row to the table above.

## GitHub Issues

Track work in GitHub issues so everyone, human or agent, can see what's planned, in flight, and done.

- **Use the Task template** (`.github/ISSUE_TEMPLATE/task.md`). Fill in Summary, Context, and Done when, and put what an agent needs to pick the work up cold into "Agent context": where and how it was found, repro steps and command output, relevant files, commits, and PRs, scope, and the checks that prove it's done.
- **Start from the issue.** When given an issue number, read it first (`gh issue view <N> --comments`) and treat its "Done when" list as the acceptance criteria.
- **Link PRs** with `Closes #NN` in the body.
- **File, don't fix, what's out of scope.** If you find a bug or follow-up outside the current task, don't fix it in the same change. Offer to open an issue for it with the Task template.
- **Ask before creating, editing, or closing issues.** They're visible to the whole team. Draft the issue in chat first, then create it with `gh issue create` once the user agrees.
- For a big feature, link the issue from its `plan.md`, and the plan from the issue.

## Working on a Team

Several people and agents work on this repo at once, so keep changes easy to merge:

- One feature per branch and PR. Don't fold unrelated refactors or reformatting of untouched files into a feature.
- Don't rename or move shared files (`components/`, `hooks/`, `utils/`, `lib/types/`, `app/layout.tsx`, `components/Navbar.tsx`) as a side effect. Keep edits to them small, or do them in a separate PR.
- Pull before creating a migration so its timestamp is after everyone else's. If `supabase migration up` reports out-of-order migrations after a pull, ask before running `pnpm db:reset`.
- Add dependencies with `pnpm add <pkg>` only when nothing installed covers the need, and say why in the PR. Check `package.json` first, since a lot is already installed (zod, react-hook-form, date-fns, recharts, lucide-react, sonner, …).

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
