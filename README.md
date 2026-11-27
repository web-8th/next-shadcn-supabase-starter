# next-shadcn-supabase-starter

A Next.js starter with shadcn/ui, Supabase auth wiring, and Tailwind CSS v4. Clone it, add your env vars, and start building.

**Stack:** Next.js 16 · React 19 · TypeScript 7 · shadcn/ui (base-lyra, on Base UI) · Supabase · pnpm

Using AI coding agents? They read [AGENTS.md](AGENTS.md) (Claude Code reads it through `CLAUDE.md`). It holds the project's conventions, the agent-agnostic skills in `.claude/skills/` (`orchestrator`, `create-pr`), and how to plan big features in `docs/planning/` and track work in GitHub issues. Keep it up to date as your project grows.

## Quick start

```bash
git clone https://github.com/web-8th/next-shadcn-supabase-starter.git
cd next-shadcn-supabase-starter
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The UI runs without Supabase, so frontend work can start right away. To enable auth and data, set up Supabase locally or use a hosted project.

### Local Supabase

Requires Docker.

```bash
pnpm db:start   # starts Supabase, applies supabase/migrations/, runs supabase/seed.sql
```

Then write the local URL and keys into `.env.local`. This replaces the whole file, which is fine because these three values are all it needs:

```bash
pnpm exec supabase status -o env --override-name api.url=NEXT_PUBLIC_SUPABASE_URL --override-name auth.publishable_key=NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY --override-name auth.secret_key=SUPABASE_SECRET_KEY | grep -E "^(NEXT_PUBLIC_SUPABASE|SUPABASE_SECRET)" > .env.local
```

Restart `pnpm dev` after changing `.env.local`. The file should look like:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54721
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

The publishable key is used in the browser and acts as the signed-in user, so RLS applies. The secret key is server-only and bypasses RLS. Use it only through `createAdminClient()` from `utils/supabase/admin.ts`.

To turn auth on, set `AUTH_ENABLED = true` in `config/auth.ts`. Then log in with the seeded user:

| Email               | Password      |
| ------------------- | ------------- |
| `admin@example.com` | `password123` |

| Service                                | URL                                              |
| -------------------------------------- | ------------------------------------------------ |
| Supabase Studio                        | [http://127.0.0.1:54723](http://127.0.0.1:54723) |
| Email inbox (auth emails sent locally) | [http://127.0.0.1:54724](http://127.0.0.1:54724) |

Run `pnpm db:status` to see the keys again, or `pnpm db:reset` to rebuild the database from migrations and seed.

Local Supabase runs on the **547xx** ports (API 54721, DB 54722, Studio 54723, email 54724) rather than the default 543xx, so it doesn't collide with other Supabase projects on your machine.

**"port is already allocated"**: something else is using one of those ports, often another project's local Supabase. Stop it with `pnpm exec supabase stop --project-id <other-project>` (`docker ps` shows the names), or change the ports in `supabase/config.toml`.

### Hosted Supabase

```bash
cp .env.example .env.local
```

Fill in the three values from [Project Settings → API Keys](https://supabase.com/dashboard/project/_/settings/api-keys). Then push your migrations:

```bash
pnpm exec supabase link --project-ref <ref>
pnpm exec supabase db push
```

The seed is local-only, so create users in the dashboard under Authentication → Users.

The app expects the publishable key name above, not `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Database

Schema changes are SQL migrations in `supabase/migrations/`:

```bash
pnpm exec supabase migration new create_todos   # creates a timestamped .sql file
# write the SQL, including RLS policies
pnpm exec supabase migration up                  # applies it locally, keeps your data
pnpm db:types                                    # regenerates lib/types/database.ts
```

`lib/types/database.ts` describes your schema in TypeScript. Every Supabase client is typed with it, so `supabase.from('todos')` autocompletes and a wrong table or column name fails `pnpm typecheck`. The file is generated, so don't edit it by hand. Rerun `pnpm db:types` after every migration and commit the result. The `Database types` CI workflow fails the PR if it doesn't match the migrations; `pnpm db:types:check` runs the same check locally.

[docs/examples/profiles-table.md](docs/examples/profiles-table.md) has a complete example table with RLS policies and a sign-up trigger to copy from.

### Which Supabase client to use

| Where                                            | Import                                                |
| ------------------------------------------------ | ----------------------------------------------------- |
| Client Components                                | `createClient()` from `@/utils/supabase/client`       |
| Server Components, Server Actions, Route Handler | `await createClient()` from `@/utils/supabase/server` |
| Signed-in user on the server                     | `await getUser()` from `@/utils/supabase/server`      |
| Privileged server work that bypasses RLS         | `createAdminClient()` from `@/utils/supabase/admin`   |
| Current user in Client Components                | `useAuth()` from `@/hooks/use-auth`                   |

## Scripts

| Command               | What it does                                     |
| --------------------- | ------------------------------------------------ |
| `pnpm dev`            | Start the dev server                             |
| `pnpm build`          | Production build                                 |
| `pnpm start`          | Run the production server                        |
| `pnpm check`          | Format check + lint + typecheck (what CI runs)   |
| `pnpm lint`           | oxlint                                           |
| `pnpm format`         | Prettier (write)                                 |
| `pnpm format:check`   | Prettier (check only)                            |
| `pnpm typecheck`      | `tsc --noEmit` (TypeScript 7)                    |
| `pnpm db:start`       | Start local Supabase (Docker)                    |
| `pnpm db:stop`        | Stop local Supabase                              |
| `pnpm db:status`      | Show local URLs and keys                         |
| `pnpm db:reset`       | Rebuild local DB from migrations + seed          |
| `pnpm db:types`       | Regenerate `lib/types/database.ts` from local DB |
| `pnpm db:types:check` | Fail if `database.ts` doesn't match the local DB |

CI runs format check, lint, typecheck, and build on push/PR via `.github/workflows/ci.yml`. When migrations or `database.ts` change, `.github/workflows/db-types.yml` also checks that the generated types match the migrations.

## shadcn/ui

Components live in `components/ui/`. Most of the usual set is already installed.

Add more:

```bash
pnpm dlx shadcn@latest add [component]
```

This project uses the **base-lyra** style, which is built on [Base UI](https://base-ui.com), not Radix. Most shadcn docs and examples online are written for Radix, so two things differ:

- **No `asChild`.** To render a component as another element, pass it through `render`:

  ```tsx
  // Do
  <Button nativeButton={false} render={<Link href='/about' />}>About</Button>
  <DialogTrigger render={<Button variant='outline' />}>Open</DialogTrigger>
  
  // Don't (Radix API, doesn't work here)
  <Button asChild><Link href='/about'>About</Link></Button>
  ```

- **`nativeButton={false}`** goes on a `Button` whenever `render` makes it something other than a `<button>` (a link, for example). This turns off native-button behavior that only applies to a real `<button>`.

Newer components (questionnaire, bubble, message, etc.) import `cn` from the [`cn`](https://github.com/shadcn-ui/cn) package. App code can use `@/lib/utils`, which re-exports the same thing.

## Project layout

```text
app/              Pages and layouts (App Router)
components/       App components + components/ui/ (shadcn)
config/           App flags (AUTH_ENABLED)
contexts/         AuthProvider, ToastProvider
docs/examples/    Reference snippets (example migration)
docs/planning/    One folder per big feature: plan, progress, task briefs
scripts/          Repo scripts (db-types.mjs)
.claude/skills/   Agent-agnostic workflows (orchestrator, create-pr)
.github/          CI workflows, PR template, Task issue template
hooks/            use-auth, use-toast, use-mobile
lib/              Types (incl. generated database.ts), utils
utils/supabase/   Browser, server, admin, and proxy Supabase clients
supabase/         Local Supabase config, migrations, seed
proxy.ts          Session refresh + route protection
```

Auth follows a simple pattern: context in `contexts/`, hook in `hooks/`, types in `lib/types/`. Providers are wired up in `app/layout.tsx`.

## Remove demo content

The starter ships with demo pages and branding. Before you build your own app:

- [ ] Replace `app/page.tsx` with your landing page
- [ ] Delete `app/features/` and `app/tech-stack/`, and remove them from `navLinks` in `components/Navbar.tsx`
- [ ] Rename "Next Starter" and swap the logos in `components/Logo.tsx`. Delete `public/rmlogov2.png`, `public/icons/8th_svg.svg`, and any other `public/icons/*` you don't use.
- [ ] Replace `app/favicon.ico`
- [ ] Update `title` and `description` in `metadata` in `app/layout.tsx`
- [ ] Replace the demo copy and GitHub link in `app/admin/page.tsx`, or delete the page and remove `/admin` from `proxy.ts`
- [ ] Update `name` in `package.json` and `project_id` in `supabase/config.toml`
- [ ] Rewrite this README for your project, and check that AGENTS.md still matches it
- [ ] Remove `lib/highlighter.tsx`, `hooks/use-highlighted-code.ts`, and `shiki` if you don't show code snippets

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/web-8th/next-shadcn-supabase-starter)

Set the same three Supabase env vars in your host's dashboard. In Supabase, under Authentication → URL Configuration, set the Site URL to your deployed URL.

## License

MIT — see [LICENSE](LICENSE).
