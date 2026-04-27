-- English Variant — initial schema.
-- Minimal, honest tables. RLS is enabled on every user-scoped table.

-- ─── Enums ─────────────────────────────────────────────────────────────────
create type variant as enum ('uk', 'us');
create type reason_tag as enum ('travel', 'work', 'study', 'general_fluency');
create type contrast_category as enum ('vocabulary', 'spelling', 'pronunciation', 'grammar', 'usage');
create type exercise_kind as enum ('spot_the_dialect', 'choose_target', 'make_consistent', 'listen_and_identify');

-- ─── Profiles ──────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: owner read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: owner upsert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: owner update"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── User preferences ──────────────────────────────────────────────────────
create table public.user_preferences (
  user_id uuid primary key references auth.users on delete cascade,
  target_variant variant not null,
  reason_tags reason_tag[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "prefs: owner all"
  on public.user_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Content items ─────────────────────────────────────────────────────────
-- Content is public read; writes are restricted to service role.
create table public.content_items (
  id text primary key,
  category contrast_category not null,
  level smallint not null check (level between 1 and 3),
  tags text[] not null default '{}',
  uk jsonb not null,
  us jsonb not null,
  notes text,
  clues text[] not null,
  traps text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.content_items enable row level security;

create policy "content: public read"
  on public.content_items for select
  using (true);

create index content_items_category_idx on public.content_items (category);
create index content_items_level_idx on public.content_items (level);
create index content_items_tags_idx on public.content_items using gin (tags);

-- ─── Attempts ──────────────────────────────────────────────────────────────
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  content_id text references public.content_items on delete set null,
  exercise_kind exercise_kind not null,
  correct boolean not null,
  answer text not null,
  expected text not null,
  created_at timestamptz not null default now()
);

alter table public.attempts enable row level security;

create policy "attempts: owner read"
  on public.attempts for select
  using (auth.uid() = user_id);

create policy "attempts: owner insert"
  on public.attempts for insert
  with check (auth.uid() = user_id);

create index attempts_user_idx on public.attempts (user_id, created_at desc);

-- ─── Saved items ───────────────────────────────────────────────────────────
create table public.saved_items (
  user_id uuid not null references auth.users on delete cascade,
  content_id text not null references public.content_items on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

alter table public.saved_items enable row level security;

create policy "saved: owner all"
  on public.saved_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Review queue ──────────────────────────────────────────────────────────
create table public.review_queue (
  user_id uuid not null references auth.users on delete cascade,
  content_id text not null references public.content_items on delete cascade,
  miss_count integer not null default 1,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, content_id)
);

alter table public.review_queue enable row level security;

create policy "review: owner all"
  on public.review_queue for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- When an attempt is wrong, upsert into the review queue.
-- When it's right, decrement miss_count (floor at 0). Items at 0 are retired.
create or replace function public.sync_review_queue()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.content_id is null then
    return new;
  end if;

  if new.correct = false then
    insert into public.review_queue (user_id, content_id, miss_count, last_seen_at)
    values (new.user_id, new.content_id, 1, now())
    on conflict (user_id, content_id)
    do update set
      miss_count = public.review_queue.miss_count + 1,
      last_seen_at = now();
  else
    update public.review_queue
    set miss_count = greatest(miss_count - 1, 0), last_seen_at = now()
    where user_id = new.user_id and content_id = new.content_id;

    delete from public.review_queue
    where user_id = new.user_id and content_id = new.content_id and miss_count = 0;
  end if;

  return new;
end;
$$;

create trigger on_attempt_sync_review
  after insert on public.attempts
  for each row execute procedure public.sync_review_queue();

-- ─── Progress summary ──────────────────────────────────────────────────────
create table public.progress_summary (
  user_id uuid primary key references auth.users on delete cascade,
  total_attempts integer not null default 0,
  correct_attempts integer not null default 0,
  streak_days integer not null default 0,
  last_active_at timestamptz
);

alter table public.progress_summary enable row level security;

create policy "progress: owner read"
  on public.progress_summary for select
  using (auth.uid() = user_id);

create policy "progress: owner upsert"
  on public.progress_summary for insert
  with check (auth.uid() = user_id);

create policy "progress: owner update"
  on public.progress_summary for update
  using (auth.uid() = user_id);

-- Maintain progress_summary after each attempt.
create or replace function public.update_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_date_utc date := (now() at time zone 'utc')::date;
  last_date date;
begin
  insert into public.progress_summary (user_id, total_attempts, correct_attempts, streak_days, last_active_at)
  values (new.user_id, 1, case when new.correct then 1 else 0 end, 1, now())
  on conflict (user_id) do update set
    total_attempts = public.progress_summary.total_attempts + 1,
    correct_attempts = public.progress_summary.correct_attempts + (case when new.correct then 1 else 0 end),
    streak_days = case
      when public.progress_summary.last_active_at is null then 1
      when (public.progress_summary.last_active_at at time zone 'utc')::date = current_date_utc then public.progress_summary.streak_days
      when (public.progress_summary.last_active_at at time zone 'utc')::date = current_date_utc - 1 then public.progress_summary.streak_days + 1
      else 1
    end,
    last_active_at = now();
  return new;
end;
$$;

create trigger on_attempt_update_progress
  after insert on public.attempts
  for each row execute procedure public.update_progress();
