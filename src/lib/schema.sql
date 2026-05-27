-- ============================================================
-- SadhanaOS — Supabase Schema
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension (already enabled on Supabase by default)
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists profiles (
  id                  uuid primary key references auth.users on delete cascade,
  full_name           text,
  age                 integer,
  gender              text,
  sadhana_start_date  date,
  target_days         integer not null default 60,
  ist_deity           text,
  prayer_schedule     jsonb not null default '["Brahma Muhurta", "Sandhya", "Evening"]'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure handle_updated_at();

-- Auto-create profile row on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- 2. DAILY_LOGS
-- ============================================================
create table if not exists daily_logs (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references profiles on delete cascade,
  log_date            date not null,

  -- Brahmacharya
  streak_maintained   boolean not null default true,

  -- Meditation & Pranayama
  meditation_minutes  integer not null default 0,
  pranayama_done      boolean not null default false,
  pranayama_type      text check (pranayama_type in (
                        'anulom_vilom', 'bhramari', 'kapalbhati',
                        'box_breathing', '4_7_8'
                      )),

  -- Prayer
  prayers_completed   jsonb not null default '[]'::jsonb,

  -- Physical care
  skincare_morning    boolean not null default false,
  skincare_evening    boolean not null default false,
  water_glasses       integer not null default 0,
  sleep_hours         numeric(4,2),
  exercise_done       boolean not null default false,

  -- Gratitude
  gratitude_1         text,
  gratitude_2         text,
  gratitude_3         text,

  -- Scores (1-5)
  mood_score          integer check (mood_score between 1 and 5),
  energy_score        integer check (energy_score between 1 and 5),
  clarity_score       integer check (clarity_score between 1 and 5),
  confidence_score    integer check (confidence_score between 1 and 5),

  -- Journal
  journal_entry       text,
  daily_intention     text,
  shloka_learned_id   text,
  notes               text,

  created_at          timestamptz not null default now(),

  unique (user_id, log_date)
);

create index daily_logs_user_date on daily_logs (user_id, log_date desc);

-- ============================================================
-- 3. URGE_LOGS
-- ============================================================
create table if not exists urge_logs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles on delete cascade,
  logged_at       timestamptz not null default now(),
  intensity       integer not null check (intensity between 1 and 5),
  trigger_tags    text[] not null default '{}',
  trigger_notes   text,
  action_taken    text not null,
  held_strong     boolean not null,
  breathing_done  boolean not null default false
);

create index urge_logs_user_time on urge_logs (user_id, logged_at desc);

-- ============================================================
-- 4. WEEKLY_REFLECTIONS
-- ============================================================
create table if not exists weekly_reflections (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references profiles on delete cascade,
  week_number           integer not null,
  week_start_date       date not null,

  -- Ratings (1-10)
  mental_clarity        integer check (mental_clarity between 1 and 10),
  emotional_stability   integer check (emotional_stability between 1 and 10),
  spiritual_connection  integer check (spiritual_connection between 1 and 10),
  physical_energy       integer check (physical_energy between 1 and 10),
  skin_quality          integer check (skin_quality between 1 and 10),
  sleep_quality         integer check (sleep_quality between 1 and 10),
  social_confidence     integer check (social_confidence between 1 and 10),
  eye_contact           integer check (eye_contact between 1 and 10),

  -- Reflections
  biggest_challenge     text not null default '',
  biggest_win           text not null default '',
  what_i_learned        text not null default '',
  free_reflection       text,

  created_at            timestamptz not null default now(),

  unique (user_id, week_number)
);

-- ============================================================
-- 5. MILESTONES
-- ============================================================
create table if not exists milestones (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles on delete cascade,
  day_number    integer not null,
  title         text not null,
  description   text not null default '',
  achieved      boolean not null default false,
  achieved_at   timestamptz,
  reflection    text
);

create index milestones_user on milestones (user_id, day_number);

-- Seed canonical milestone definitions for a new user
create or replace function seed_milestones(p_user_id uuid)
returns void language plpgsql as $$
begin
  insert into milestones (user_id, day_number, title, description) values
    (p_user_id,  3,  'Pratham Pad (3 Days)',         'The first energy shift begins. Restlessness peaks and then quiets.'),
    (p_user_id,  7,  'Saptah Siddhi (7 Days)',        'One full week of tapasya. Mental fog starts to lift. Dreams may intensify.'),
    (p_user_id, 11,  'Ekadashi Shakti (11 Days)',      'Ekadashi energy. Fasting becomes natural. Subtle body activates.'),
    (p_user_id, 14,  'Dwitiya Saptah (14 Days)',       'Two weeks in. Skin begins to clear. Focus sharpens noticeably.'),
    (p_user_id, 21,  'Teen Saptah Tapa (21 Days)',     'Three weeks of tapas forms a new habit groove in the nervous system.'),
    (p_user_id, 30,  'Ek Maas Vrata (30 Days)',        'One month. Ojas builds. Confidence, eye contact, and voice deepen.'),
    (p_user_id, 45,  'Madhya Marga (45 Days)',         'The halfway mark on the 90-day path. Spiritual experiences increase.'),
    (p_user_id, 60,  'Shatabhisha Siddhi (60 Days)',   'The core vow complete. Brahmacharya is no longer effort — it is nature.'),
    (p_user_id, 90,  'Navama Saptah (90 Days)',        'Ninety days of sustained ojas. Transformation is now irreversible.')
  on conflict do nothing;
end;
$$;

-- Trigger to seed milestones for new profiles
create or replace function handle_new_profile()
returns trigger language plpgsql security definer as $$
begin
  perform seed_milestones(new.id);
  return new;
end;
$$;

create trigger on_profile_created
  after insert on profiles
  for each row execute procedure handle_new_profile();

-- ============================================================
-- 6. SCRIPTURE_PROGRESS
-- ============================================================
create table if not exists scripture_progress (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles on delete cascade,
  scripture_name  text not null,
  chapter         integer not null,
  verse           integer not null,
  completed       boolean not null default false,
  notes           text,
  completed_at    timestamptz,
  bookmarked      boolean not null default false,

  unique (user_id, scripture_name, chapter, verse)
);

create index scripture_progress_user on scripture_progress (user_id, scripture_name);

-- ============================================================
-- 7. AI_REPORTS
-- ============================================================
create table if not exists ai_reports (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references profiles on delete cascade,
  report_type    text not null check (report_type in ('weekly', 'monthly', 'guidance')),
  content        text not null,
  data_snapshot  jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index ai_reports_user_time on ai_reports (user_id, created_at desc);

-- ============================================================
-- 8. AFFIRMATIONS
-- ============================================================
create table if not exists affirmations (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles on delete cascade,
  text_hindi    text,
  text_english  text not null,
  source        text default 'custom',
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Seed default affirmations for a new profile
create or replace function seed_affirmations(p_user_id uuid)
returns void language plpgsql as $$
begin
  insert into affirmations (user_id, text_hindi, text_english, source) values
    (p_user_id, 'अहं ब्रह्मास्मि',        'I am Brahman — pure, infinite, unchanging.',       'upanishad'),
    (p_user_id, 'ॐ तत्सत्',               'That alone is Truth. I act from that Truth.',       'gita'),
    (p_user_id, 'मैं शक्तिशाली हूँ',       'My vital energy rises and transforms into light.',  'custom'),
    (p_user_id, NULL,                      'Every urge overcome is ojas gained.',               'custom'),
    (p_user_id, 'सत्यमेव जयते',           'Truth alone triumphs. I choose truth today.',       'upanishad')
  on conflict do nothing;
end;
$$;

-- Attach affirmation seeding to the same profile-creation trigger
create or replace function handle_new_profile()
returns trigger language plpgsql security definer as $$
begin
  perform seed_milestones(new.id);
  perform seed_affirmations(new.id);
  return new;
end;
$$;

-- (Re-create the trigger so it picks up the updated function)
drop trigger if exists on_profile_created on profiles;
create trigger on_profile_created
  after insert on profiles
  for each row execute procedure handle_new_profile();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles           enable row level security;
alter table daily_logs         enable row level security;
alter table urge_logs          enable row level security;
alter table weekly_reflections enable row level security;
alter table milestones         enable row level security;
alter table scripture_progress enable row level security;
alter table ai_reports         enable row level security;
alter table affirmations       enable row level security;

-- Helper: returns the authenticated user's UUID
-- (avoids repeating auth.uid() everywhere)

-- profiles
create policy "profiles: owner access"
  on profiles for all
  using (id = auth.uid())
  with check (id = auth.uid());

-- daily_logs
create policy "daily_logs: owner access"
  on daily_logs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- urge_logs
create policy "urge_logs: owner access"
  on urge_logs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- weekly_reflections
create policy "weekly_reflections: owner access"
  on weekly_reflections for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- milestones
create policy "milestones: owner access"
  on milestones for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- scripture_progress
create policy "scripture_progress: owner access"
  on scripture_progress for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ai_reports
create policy "ai_reports: owner access"
  on ai_reports for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- affirmations
create policy "affirmations: owner access"
  on affirmations for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- HELPER VIEWS (optional convenience, no RLS needed — policies
-- on the underlying tables apply automatically)
-- ============================================================

-- Current streak for a user
create or replace view v_current_streak as
select
  user_id,
  count(*) filter (where streak_maintained) as total_days_maintained,
  -- consecutive streak from today backwards
  (
    select count(*)
    from (
      select
        log_date,
        streak_maintained,
        log_date - (row_number() over (order by log_date desc))::integer as grp
      from daily_logs d2
      where d2.user_id = d.user_id
        and d2.streak_maintained = true
      order by log_date desc
    ) s
    where grp = (
      select log_date - 0
      from daily_logs d3
      where d3.user_id = d.user_id
        and d3.streak_maintained = true
      order by log_date desc
      limit 1
    )
  ) as current_streak
from daily_logs d
group by user_id;
