# Example: a `profiles` table

A reference for adding your first app table. Nothing here is applied: copy it into a real
migration when your app needs it.

It covers the pattern every table should follow: create the table, enable RLS, add
policies, then triggers. This one also creates a profile row automatically whenever a
user signs up.

## 1. Create the migration

```bash
pnpm exec supabase migration new create_profiles
```

Paste the SQL below into the new file in `supabase/migrations/`.

```sql
-- Reusable trigger function that keeps an `updated_at` column current.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Signed-in users can read and update only their own profile.
-- Rows are inserted by the trigger below, so there is no insert policy.
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile whenever a user signs up. `security definer` lets the trigger
-- write to public.profiles even though the auth service has no policy for it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users that existed before this migration.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
```

## 2. Apply it and regenerate types

```bash
pnpm exec supabase migration up   # applies pending migrations, keeps your local data
pnpm db:types                     # rewrites lib/types/database.ts
```

`pnpm db:reset` also works, but it wipes local data and re-runs the seed.

## 3. Query it

In a Server Component or Server Action, the server client acts as the signed-in user, so
the RLS policies above apply:

```tsx
import { createClient } from '@/utils/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .single();

  return <p>{profile?.display_name ?? 'No display name yet'}</p>;
}
```

Use `Tables<'profiles'>` from `@/lib/types` for the row type.

To pass a display name at sign-up, include it in the user metadata:

```ts
supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
```

## Notes

- `(select auth.uid())` instead of a bare `auth.uid()` lets Postgres cache the value per
  query instead of calling it for every row.
- `set search_path = ''` on functions is a Supabase security recommendation. It forces
  fully qualified names like `public.profiles`.
- To make profiles publicly readable, replace the select policy with
  `using (true)` and `to anon, authenticated`.
