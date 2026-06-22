-- ─────────────────────────────────────────────────────────────────────────────
-- After Hours — Supabase SQL Schema
-- Paste this entire file into: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. PACKS TABLE
create table if not exists packs (
  id           text primary key,
  category_name text not null,
  author       text not null default 'Anonymous',
  intensity    text not null default 'Lite',
  is_public    boolean not null default false,
  source       text not null default 'local',
  user_id      uuid references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- 2. PROMPTS TABLE (dares/truths/shots inside a pack)
create table if not exists prompts (
  id        text primary key,
  pack_id   text not null references packs(id) on delete cascade,
  text      text not null,
  type      text not null default 'dare', -- 'dare' | 'truth' | 'shot' | 'wildcard'
  enabled   boolean not null default true,
  sort_order int not null default 0
);

-- 3. ROW LEVEL SECURITY
alter table packs   enable row level security;
alter table prompts enable row level security;

-- Anyone can read public packs
create policy "Public packs are viewable by all"
  on packs for select
  using (is_public = true);

-- Users can read their own packs (public or private)
create policy "Users can view their own packs"
  on packs for select
  using (auth.uid() = user_id);

-- Users can insert their own packs
create policy "Users can create packs"
  on packs for insert
  with check (auth.uid() = user_id);

-- Users can update their own packs
create policy "Users can update their own packs"
  on packs for update
  using (auth.uid() = user_id);

-- Users can delete their own packs
create policy "Users can delete their own packs"
  on packs for delete
  using (auth.uid() = user_id);

-- Prompts: readable if the parent pack is public or owned by the user
create policy "Prompts readable if pack is public"
  on prompts for select
  using (
    exists (
      select 1 from packs
      where packs.id = prompts.pack_id
        and (packs.is_public = true or packs.user_id = auth.uid())
    )
  );

-- Prompts: insertable if the user owns the parent pack
create policy "Users can add prompts to their packs"
  on prompts for insert
  with check (
    exists (
      select 1 from packs
      where packs.id = prompts.pack_id
        and packs.user_id = auth.uid()
    )
  );

-- Prompts: updatable if the user owns the parent pack
create policy "Users can update their prompts"
  on prompts for update
  using (
    exists (
      select 1 from packs
      where packs.id = prompts.pack_id
        and packs.user_id = auth.uid()
    )
  );

-- Prompts: deletable if the user owns the parent pack
create policy "Users can delete their prompts"
  on prompts for delete
  using (
    exists (
      select 1 from packs
      where packs.id = prompts.pack_id
        and packs.user_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- REPORTS TABLE (run this in Supabase SQL Editor too)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists reports (
  id          uuid primary key default gen_random_uuid(),
  pack_id     text not null references packs(id) on delete cascade,
  reason      text not null,
  reported_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table reports enable row level security;

-- Anyone (even logged out) can submit a report
create policy "Anyone can report a pack"
  on reports for insert
  with check (true);

-- Only the reporter can see their own reports
create policy "Users see their own reports"
  on reports for select
  using (auth.uid() = reported_by);
