# next-shadcn-supabase-starter

A Next.js starter with shadcn/ui, Supabase auth wiring, and Tailwind CSS v4. Clone it, add your env vars, and start building.

**Stack:** Next.js 16 · React 19 · TypeScript 7 · shadcn/ui (radix-vega) · Supabase · pnpm

## Quick start

```bash
git clone https://github.com/rinmeng/next-shadcn-supabase-starter.git
cd next-shadcn-supabase-starter
pnpm install
cp .env.example .env.local
pnpm db:start   # local Supabase (requires Docker)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Local Supabase

`pnpm db:start` runs Supabase locally in Docker, applies `supabase/migrations/`, and runs `supabase/seed.sql`. This writes the URL and keys into `.env.local`. It replaces the file, so use `>>` instead to append:

```bash
pnpm exec supabase status -o env --override-name api.url=NEXT_PUBLIC_SUPABASE_URL --override-name auth.publishable_key=NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY --override-name auth.secret_key=SUPABASE_SECRET_KEY | grep -E "^(NEXT_PUBLIC_SUPABASE|SUPABASE_SECRET)" > .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

The publishable key is used in the browser and acts as the signed-in user, so RLS applies. The secret key is server-only and bypasses RLS. Use it only through `createAdminClient()` from `utils/supabase/admin.ts`.

To turn auth on, set `AUTH_ENABLED = true` in `config/auth.ts`. Then log in with the seeded user:

| Email               | Password      |
| ------------------- | ------------- |
| `admin@example.com` | `password123` |

Supabase Studio runs at [http://127.0.0.1:54323](http://127.0.0.1:54323). Run `pnpm db:status` to see the keys again, or `pnpm db:reset` to rebuild the database from migrations and seed.

### Hosted Supabase

Swap the three env vars for your project's values from [Project Settings → API Keys](https://supabase.com/dashboard/project/_/settings/api-keys). Then push your migrations:

```bash
pnpm exec supabase link --project-ref <ref>
pnpm exec supabase db push
```

The seed is local-only, so create users in the dashboard under Authentication → Users.

The app expects the publishable key name above, not `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Scripts

| Command             | What it does                            |
| ------------------- | --------------------------------------- |
| `pnpm dev`          | Start the dev server                    |
| `pnpm build`        | Production build                        |
| `pnpm start`        | Run the production server               |
| `pnpm lint`         | ESLint                                  |
| `pnpm format`       | Prettier (write)                        |
| `pnpm format:check` | Prettier (check only, used in CI)       |
| `pnpm typecheck`    | `tsc --noEmit` (TypeScript 7)           |
| `pnpm db:start`     | Start local Supabase (Docker)           |
| `pnpm db:stop`      | Stop local Supabase                     |
| `pnpm db:status`    | Show local URLs and keys                |
| `pnpm db:reset`     | Rebuild local DB from migrations + seed |

CI runs format check, lint, and typecheck on push/PR via `.github/workflows/ci.yml`.

## shadcn/ui

Components live in `components/ui/`. Most of the usual set is already installed.

Add more:

```bash
pnpm dlx shadcn@latest add [component]
```

This project uses the **radix-vega** style. Newer components (questionnaire, bubble, message, etc.) import `cn` from the [`cn`](https://github.com/shadcn-ui/cn) package. App code can use `@/lib/utils`, which re-exports the same thing.

If you're upgrading an older shadcn project, use the CLI migrations instead of hand-editing imports:

```bash
pnpm dlx shadcn@latest migrate cn      # clsx + tailwind-merge → cn
pnpm dlx shadcn@latest migrate radix   # @radix-ui/react-* → radix-ui
```

## Project layout

```text
app/              Pages and layouts (App Router)
components/       App components + components/ui/ (shadcn)
contexts/         AuthProvider, ToastProvider
hooks/            use-auth, use-toast, use-mobile
lib/              Supabase client, types, utils
utils/supabase/   Browser + middleware Supabase clients
proxy.ts          Session refresh middleware
```

Auth follows a simple pattern: context in `contexts/`, hook in `hooks/`, types in `lib/types/`. Providers are wired up in `app/layout.tsx`.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rinmeng/next-shadcn-supabase-starter)

Set the same Supabase env vars in your host's dashboard.

## License

MIT — see [LICENSE](LICENSE).
