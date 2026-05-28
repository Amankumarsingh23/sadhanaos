# SadhanaOS — Your Digital Ashram

> **साधना** — Disciplined spiritual practice toward self-realization.

SadhanaOS is a full-stack spiritual practice OS built for the brahmacharya journey. It replaces scattered habit trackers and journals with one sacred space: track rituals, resist urges, study scripture, meditate, reflect, and measure your inner growth over time.

---

## Features

| Module | Description |
|--------|-------------|
| **Daily Log** | Record meditation, pranayama, prayer, shloka, skincare, exercise — one tap per practice |
| **Urge Shield** | 4-7-8 breathing, cold exposure timer, urge logging with intensity tracking |
| **Dhyana** | Guided breathing circles, pranayama timer, mantra counter (japa mala) |
| **Granthalaya** | 6 sacred texts (Gita, Ashtavakra, Upanishads, Ramcharitmanas, Yoga Sutras, Vivekachudamani) with real verified shlokas, progress tracking, bookmarks |
| **Prarthana** | Daily prayer sequences, morning/evening schedules |
| **Chintan** | Journaling with gratitude, reflections, scripture notes |
| **Analytics** | Mood trends, ritual consistency, holistic score (A–F weekly grade), urge frequency charts |
| **Goals & Milestones** | Sealed sankalp letter, confetti reveal at completion, milestone journey timeline |
| **Rishi AI Guide** | Groq-powered spiritual mentor — asks, challenges, guides (powered by `llama-3.3-70b`) |
| **Settings** | Profile, sadhana config, CSV data export, sadhana reset, account deletion |

---

## Tech Stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript (strict)
- **Database & Auth** — Supabase (Postgres + Row Level Security + Auth)
- **Styling** — Tailwind CSS v4
- **Animation** — Framer Motion
- **Charts** — Recharts
- **AI** — Groq SDK (`llama-3.3-70b-versatile`)
- **Fonts** — Cormorant Garamond, Source Serif 4, Noto Serif Devanagari
- **Deployment** — Vercel

---

## Environment Variables

Create a `.env.local` file at the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Groq (for Rishi AI)
GROQ_API_KEY=your-groq-api-key
```

> Get your Supabase credentials from **Project Settings → API**.
> Get a Groq API key at **console.groq.com**.

---

## Supabase Setup

### 1. Create tables

Run the following SQL in your Supabase SQL editor:

```sql
-- User profile
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  name            text,
  avatar_url      text,
  sadhana_start_date date,
  target_days     int default 90,
  prayer_schedule jsonb default '{}'::jsonb,
  created_at      timestamptz default now()
);

-- Daily practice log
create table daily_logs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references profiles(id) on delete cascade,
  date                date not null,
  meditation_mins     int default 0,
  pranayama_done      boolean default false,
  prayer_done         boolean default false,
  shloka_done         boolean default false,
  skincare_done       boolean default false,
  exercise_done       boolean default false,
  mood                int check (mood between 1 and 5),
  notes               text,
  streak_maintained   boolean default true,
  unique (user_id, date)
);

-- Urge events
create table urge_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  logged_at   timestamptz default now(),
  intensity   int check (intensity between 1 and 10),
  trigger     text,
  outcome     text check (outcome in ('resisted','relapsed')),
  notes       text
);

-- Journal entries
create table journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  date        date not null,
  type        text,
  content     jsonb,
  created_at  timestamptz default now()
);

-- Milestones
create table milestones (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  day_number  int not null,
  title       text,
  description text,
  achieved    boolean default false,
  achieved_at timestamptz,
  reflection  text
);

-- Scripture progress
create table scripture_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) on delete cascade,
  scripture_name  text not null,
  verse_id        text not null,
  completed       boolean default false,
  bookmarked      boolean default false,
  notes           text,
  updated_at      timestamptz default now(),
  unique (user_id, scripture_name, verse_id)
);

-- Streak view
create or replace view v_current_streak as
select
  user_id,
  count(*) filter (where streak_maintained) as current_streak,
  count(*)                                  as total_days_maintained
from daily_logs
group by user_id;
```

### 2. Row Level Security

```sql
alter table profiles           enable row level security;
alter table daily_logs         enable row level security;
alter table urge_logs          enable row level security;
alter table journal_entries    enable row level security;
alter table milestones         enable row level security;
alter table scripture_progress enable row level security;

create policy "own profile"   on profiles           for all using (auth.uid() = id);
create policy "own logs"      on daily_logs         for all using (auth.uid() = user_id);
create policy "own urges"     on urge_logs          for all using (auth.uid() = user_id);
create policy "own journal"   on journal_entries    for all using (auth.uid() = user_id);
create policy "own milestones" on milestones        for all using (auth.uid() = user_id);
create policy "own scripture" on scripture_progress for all using (auth.uid() = user_id);
```

### 3. Auth redirect URL

In **Supabase → Authentication → URL Configuration**, add:

```
http://localhost:3000/auth/callback
https://your-app.vercel.app/auth/callback
```

---

## Local Development

```bash
# 1. Clone
git clone https://github.com/your-username/sadhanaos
cd sadhanaos

# 2. Install
npm install

# 3. Set up environment
cp .env.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, GROQ_API_KEY

# 4. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (picks up vercel.json automatically)
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add GROQ_API_KEY
```

After deploying, add your Vercel domain to Supabase's allowed redirect URLs.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup
│   ├── (dashboard)/     # Protected pages — no /dashboard prefix in URL
│   │   ├── dashboard/   # Home — streak, diya, today's log
│   │   ├── log/         # Daily practice logger
│   │   ├── urge-shield/ # Urge resistance tools
│   │   ├── dhyana/      # Meditation & breathing
│   │   ├── granthalaya/ # Sacred scripture library
│   │   ├── prarthana/   # Prayer sequences
│   │   ├── chintan/     # Journaling
│   │   ├── analytics/   # Charts & insights
│   │   ├── goals/       # Milestones & sankalp
│   │   ├── rishi/       # AI spiritual guide
│   │   └── settings/    # Profile & account
│   └── api/
│       ├── rishi/       # Groq streaming route
│       └── auth/        # Supabase auth callback
├── components/
│   ├── charts/          # Recharts chart components
│   ├── layout/          # Shell, sidebar, bottom tab bar
│   ├── sacred/          # DiyaFlame, ShlokCard, BreathingCircle
│   └── ui/              # Button, Card, Modal, Toast, EmptyState
├── contexts/            # ToastContext
├── lib/
│   ├── supabase.ts      # Supabase client
│   ├── scriptures.ts    # All verified scripture data
│   ├── groq.ts          # Groq client
│   └── constants.ts     # Nav items, page titles
└── middleware.ts         # Auth guard for protected routes
```

---

## Scripture Accuracy

All shlokas in the Granthalaya are verified against authoritative sources:

- **Bhagavad Gita** — Swami Chinmayananda (Chinmaya Mission)
- **Ashtavakra Gita** — Swami Nityaswarupananda (Advaita Ashrama)
- **Vivekachudamani** — Adi Shankaracharya / Swami Madhavananda
- **Yoga Sutras** — Patanjali / Swami Satchidananda
- **Ramcharitmanas** — Gita Press Gorakhpur edition
- **Upanishads** — Swami Gambhirananda

No shlokas are paraphrased or fabricated. Chapter/verse numbers match standard editions.

---

## PWA Installation

SadhanaOS ships as a Progressive Web App. On mobile:

1. Open in Chrome / Safari
2. Tap **Share → Add to Home Screen** (iOS) or the install banner (Android)
3. Launches in standalone mode with saffron theme and safe-area insets

To generate PNG icons from the source SVG (optional, for broader compatibility):

```bash
# Inkscape CLI
inkscape public/icons/icon.svg -w 192 -h 192 -o public/icons/icon-192.png
inkscape public/icons/icon.svg -w 512 -h 512 -o public/icons/icon-512.png
# Then update manifest.json icon entries to reference the .png files
```

---

Built with devotion. 🙏
