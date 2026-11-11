-- gamifying-life: the cloud copy of the events list.
-- Paste this whole file into Supabase → SQL Editor → New query → Run. Safe to read in public:
-- it holds no keys or data, only the shape of the table and who may see which rows.

-- One row per event, the same events the app keeps in localStorage.
create table public.events (
  id         uuid primary key,                      -- made on the device (crypto.randomUUID)
  user_id    uuid not null default auth.uid()       -- whoever is signed in when the row is written
             references auth.users on delete cascade,
  data       jsonb not null,                        -- the event itself, e.g. {"date": "...", "activity": "chore"}
  deleted    boolean not null default false,        -- a removed event stays as a "tombstone" so the
                                                    -- other device learns it was removed
  updated_at timestamptz not null default now()     -- set by the server (trigger below), never by a device
);

-- Pulling asks "my rows changed since time T"; this index makes that quick.
create index events_user_updated on public.events (user_id, updated_at);

-- The server stamps every insert and update with its own clock, so a phone and a Mac
-- with slightly different clocks can't confuse the "changed since" question.
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_set_updated_at
before insert or update on public.events
for each row execute function public.set_updated_at();

-- Row Level Security: with it on, every query only sees rows that pass a policy.
-- The anon key in the public code can't read anything without a signed-in user,
-- and a signed-in user only ever sees their own rows.
alter table public.events enable row level security;

create policy "read own events" on public.events
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "add own events" on public.events
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "change own events" on public.events
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- No delete policy on purpose: the app never deletes rows, it marks them deleted.

-- Only signed-in users get to touch the table at all; signed-out visitors get nothing.
revoke all on public.events from anon;
grant select, insert, update on public.events to authenticated;
