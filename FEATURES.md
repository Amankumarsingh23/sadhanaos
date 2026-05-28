# SadhanaOS — Complete Feature Reference

> **Purpose of this file:** Complete documentation of every feature, screen, component, data model, and technical decision in SadhanaOS. Written for use by AI assistants in future sessions so they understand the full depth of what has been built.

---

## What SadhanaOS Is

SadhanaOS is a **brahmacharya spiritual practice operating system** — a full-stack web app (PWA) that serves as a sadhak's (spiritual practitioner's) complete digital ashram. It is built around the Hindu/Vedic tradition exclusively. It is NOT a generic habit tracker; it is a deeply spiritual tool with real Sanskrit texts, deity-specific guidance, and practices rooted in Dharmic tradition.

**Primary audience:** Hindu men on a brahmacharya journey, particularly students and young professionals preparing for career goals (IIT, placements, UPSC) who want to channel vital energy into discipline and achievement.

**Core philosophy:** The app treats the human body as a temple and brahmacharya (celibacy/vital energy conservation) as the foundation of all other achievement. It combines ancient wisdom with modern science (neuroplasticity, dopamine regulation).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Database & Auth | Supabase (Postgres + RLS + SSR Auth) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion v12 |
| Charts | Recharts v3 |
| AI | Groq SDK (llama-3.3-70b-versatile) |
| PDF | @react-pdf/renderer v4 |
| Fonts | Cormorant Garamond, Source Serif 4, Noto Serif Devanagari |
| Deployment | Vercel (Edge network, Mumbai region primary) |
| Analytics | Vercel Analytics |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup — force-dynamic
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (dashboard)/         # All protected pages — force-dynamic
│   │   ├── layout.tsx       # Wraps ShellClient
│   │   ├── dashboard/       # Home / Gurukulam
│   │   ├── log/             # Daily Sadhana Log
│   │   ├── urge-shield/     # Urge Shield
│   │   ├── dhyana/          # Meditation & Pranayama
│   │   ├── granthalaya/     # Scripture Library
│   │   │   ├── page.tsx     # Scripture grid
│   │   │   ├── [scripture]/ # Individual scripture reader
│   │   │   └── bookmarks/   # All bookmarked verses
│   │   ├── prarthana/       # Prayer & Gratitude
│   │   ├── skincare/        # Roop Sadhana (body as temple)
│   │   ├── chintan/         # Journaling & Reflection
│   │   ├── analytics/       # Darpan (data mirror)
│   │   ├── rishi/           # AI Spiritual Guide
│   │   ├── goals/           # Milestones & Sankalp
│   │   └── settings/        # Profile & Account
│   ├── api/
│   │   └── rishi/route.ts   # Groq streaming endpoint
│   ├── auth/callback/       # Supabase OAuth callback
│   └── page.tsx             # Marketing / landing
├── components/
│   ├── charts/              # Recharts wrappers
│   ├── layout/              # Shell, Sidebar, Header, BottomTabBar, PageWrapper
│   ├── pdf/                 # @react-pdf Sacred Report
│   ├── sacred/              # DiyaFlame, ShlokCard, BreathingCircle, MantraCounter
│   └── ui/                  # Button, Card, Modal, Toast, Skeleton, EmptyState, etc.
├── contexts/
│   └── ToastContext.tsx      # Global toast queue
├── hooks/
│   ├── useAuth.ts
│   ├── useDashboardData.ts
│   ├── useSupabase.ts
│   ├── useToast.ts
│   ├── useUrgeLog.ts
│   └── useUser.ts
├── lib/
│   ├── constants.ts          # NAV_ITEMS, BOTTOM_TAB_ITEMS, PAGE_TITLES, colors
│   ├── groq.ts               # Groq client (lazy init), Rishi system prompt, message builders
│   ├── scriptures.ts         # Scripture metadata, verse access functions
│   ├── supabase.ts           # createBrowserClient (@supabase/ssr)
│   ├── supabase-server.ts    # createServerClient factory (for server components)
│   └── utils.ts
├── types/
│   └── database.ts           # Full Supabase DB type definitions
└── proxy.ts                  # Auth middleware (Next.js 16 "proxy" convention)
```

---

## Database Schema (Supabase)

### `profiles`
Stores the user's spiritual identity and sadhana configuration.

```sql
id                 uuid (PK, references auth.users)
full_name          text
age                int
gender             text
sadhana_start_date date        -- Day 1 of their brahmacharya journey
target_days        int (90)    -- 90, 120, 365, or lifetime
ist_deity          text        -- Ishta Devata: 'krishna','ram','shiva','hanuman',etc.
prayer_schedule    jsonb       -- Stores: { times, sankalp, practices: { meditation, pranayama, ... } }
created_at         timestamptz
updated_at         timestamptz
```

The `prayer_schedule` JSON holds all sadhana configuration:
- `sankalp`: Their personal vow (sealed letter text)
- `practices.brahma_muhurta`: boolean
- `practices.meditation`: boolean
- `practices.meditation_minutes`: number
- `practices.pranayama`: boolean
- `practices.prayer`: boolean
- `practices.shloka_study`: boolean
- `practices.skincare`: boolean
- `practices.exercise`: boolean
- `practices.water_intake`: boolean
- `times.morning`: string (HH:MM)
- `times.evening`: string (HH:MM)

### `daily_logs`
One row per user per day. Central data table.

```sql
id                 uuid (PK)
user_id            uuid (FK profiles)
log_date           date                    -- YYYY-MM-DD, UNIQUE per user
streak_maintained  boolean
meditation_minutes int
pranayama_done     boolean
pranayama_type     text                    -- 'nadi_shodhana','bhramari','kapalbhati',etc.
prayers_completed  jsonb                   -- { morning: bool, evening: bool, ... }
skincare_morning   boolean
skincare_evening   boolean
water_glasses      int
sleep_hours        numeric(4,1)
exercise_done      boolean
gratitude_1        text                    -- First gratitude entry
gratitude_2        text
gratitude_3        text
mood_score         int (1-5)
energy_score       int (1-5)
clarity_score      int (1-5)
confidence_score   int (1-5)
journal_entry      text
daily_intention    text
shloka_learned_id  text                    -- ID of shloka studied today
notes              text
created_at         timestamptz
```

### `urge_logs`
Every urge event with full context.

```sql
id             uuid (PK)
user_id        uuid (FK)
logged_at      timestamptz
intensity      int (1-10)
trigger_tags   text[]      -- ['social_media','boredom','stress',...]
trigger_notes  text
action_taken   text        -- What the user did to resist
held_strong    boolean     -- true=resisted, false=relapsed
breathing_done boolean     -- Whether they used the 4-7-8 tool
```

### `weekly_reflections`
One row per user per week.

```sql
id                   uuid
user_id              uuid (FK)
week_number          int
week_start_date      date
mental_clarity       int (1-10)
emotional_stability  int (1-10)
spiritual_connection int (1-10)
physical_energy      int (1-10)
skin_quality         int (1-10)
sleep_quality        int (1-10)
social_confidence    int (1-10)
eye_contact          int (1-10)
biggest_challenge    text
biggest_win          text
what_i_learned       text
free_reflection      text
created_at           timestamptz
```

### `milestones`
Day-based achievements in the sadhana journey.

```sql
id          uuid
user_id     uuid (FK)
day_number  int           -- 7, 14, 21, 30, 45, 60, 75, 90, etc.
title       text
description text
achieved    boolean
achieved_at timestamptz
reflection  text          -- User writes their reflection when achieved
```

### `scripture_progress`
Tracks which verses each user has studied and bookmarked.

```sql
id             uuid
user_id        uuid (FK)
scripture_name text        -- 'bhagavad-gita', 'ashtavakra-gita', etc.
chapter        int
verse          int
completed      boolean
notes          text        -- Personal study notes on this verse
completed_at   timestamptz
bookmarked     boolean
UNIQUE(user_id, scripture_name, chapter, verse)
```

### `ai_reports`
Stores all Rishi AI responses for history.

```sql
id            uuid
user_id       uuid (FK)
report_type   text        -- 'weekly', 'monthly', 'guidance'
content       text        -- Full AI response text
data_snapshot jsonb       -- Context snapshot at time of generation
created_at    timestamptz
```

### `affirmations`
Custom and seeded affirmations for the dashboard carousel.

```sql
id           uuid
user_id      uuid (FK)
text_hindi   text
text_english text
source       text
active       boolean
created_at   timestamptz
```

### View: `v_current_streak`
```sql
SELECT user_id,
  COUNT(*) FILTER (WHERE streak_maintained) AS current_streak,
  COUNT(*) AS total_days_maintained
FROM daily_logs GROUP BY user_id
```

### RPC Functions
- `seed_milestones(p_user_id uuid)` — inserts default milestones (Day 7, 14, 21, 30, 45, 60, 75, 90)
- `seed_affirmations(p_user_id uuid)` — inserts 3 default Vedic affirmations

---

## Authentication

**Flow:**
1. Email/password: `supabase.auth.signInWithPassword()` → session stored in cookies by `@supabase/ssr`'s `createBrowserClient`
2. Google OAuth: `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: /auth/callback })`
3. `/auth/callback/route.ts`: exchanges code for session via `createServerClient` from `@supabase/ssr`

**Session management:**
- `@supabase/ssr` stores sessions in cookies (NOT localStorage) so the server proxy can read them
- `src/proxy.ts` (Next.js 16 "proxy" file convention, replaces middleware.ts) reads session and protects routes
- Protected routes: `/dashboard`, `/log`, `/urge-shield`, `/dhyana`, `/granthalaya`, `/prarthana`, `/skincare`, `/chintan`, `/analytics`, `/rishi`, `/goals`, `/settings`, `/onboarding`
- Authenticated users visiting `/login` or `/signup` are redirected to `/dashboard`

**Critical note:** The migration from `@supabase/auth-helpers-nextjs` (deprecated) to `@supabase/ssr` was done to fix the login redirect bug. `createBrowserClient` stores sessions in cookies so both client and server can read the session.

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://vuwjeloflhorbxhiyfob.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...  (JWT, public)
GROQ_API_KEY=gsk_...  (private, server-side only)
```

---

## Onboarding (`/onboarding`)

5-step wizard that collects the user's spiritual identity and creates their sadhana.

**Step 1 — Parichay (Introduction)**
- Full name
- Age
- Gender

**Step 2 — Ishta Devata**
- Which deity they worship: Krishna, Ram, Shiva, Durga, Hanuman, Ganesh, Saraswati, Vishnu, Other
- This drives the deity theme across the entire app (colors in PDF, Rishi's language, etc.)

**Step 3 — Sankalp**
- Target days: 90 (classic), 120, 365, Lifetime
- Sankalp text: their personal vow (stored in `prayer_schedule.sankalp`, sealed in Goals)

**Step 4 — Practices**
- Which practices they commit to: brahma muhurta, meditation (+ minutes), pranayama, prayer, shloka, skincare, exercise, water tracking

**Step 5 — Sadhana Diksha**
- Reviews their commitments
- Single button: "साधना आरम्भ करें" (Begin Sadhana)

**What happens on submit:**
1. `profiles` upsert with all collected data
2. `daily_logs` insert for today (blank starting entry)
3. `milestones` insert for all days ≤ target_days
4. `affirmations` insert (3 default Vedic affirmations)
5. Router redirects to `/dashboard` after OM overlay animation (2.4s)

---

## Dashboard (`/dashboard` — "Gurukulam")

The home screen. Multiple card-based sections:

**1. DiyaFlame + Streak Card**
- `DiyaFlame` component: Animated SVG diya (oil lamp) with 3 organic flicker layers using Framer Motion
- Flame grows brighter at higher streaks (flame size scales with streak count)
- When streak is 0: flame shows smoke/dying animation via `AnimatePresence mode="wait"`
- When streak resets: relighting animation (spark ignition)
- Streak count: read from `v_current_streak` view
- Day count: calculated from `profiles.sadhana_start_date`

**2. Today's Practices Card**
- Toggle buttons for each configured practice
- Updates `daily_logs` on toggle
- Shows completion percentage
- When all done: confetti-style celebration

**3. Intention Card**
- Editable daily intention text
- Saves to `daily_logs.daily_intention`

**4. Ritual Completion Card**
- Shows all practices with ✓/✗
- Today's Rituals (`आज की दिनचर्या`)

**5. Mood Wave Card**
- Sparkline showing last 7 days of mood scores
- Gentle curved line with gradient

**6. Affirmation Carousel**
- Cycles through user's active affirmations every 8 seconds
- AnimatePresence fade transitions
- Shows Hindi text + English + source
- Background OM watermark

**7. Today's Shloka Card**
- Deterministic daily verse: rotates through Bhagavad Gita verses based on date
- Sanskrit text + English meaning
- "Next shloka" and "Study in library" buttons

**8. Week View Section**
- Weekly ritual heatmap
- Streak timeline mini-chart

**Empty states:**
- No profile → "Every great journey begins with a single step" → CTA to onboarding
- No logs → "Your first day of sadhana awaits" → CTA to log

---

## Daily Log (`/log` — "Sadhana Log")

The most important page. Logs every day's complete sadhana.

**Date navigation:** Navigate previous days (can't navigate to future)

**Practice toggles (large, thumb-friendly):**
- Meditation (with minutes input slider)
- Pranayama (with technique selector)
- Prayer (morning/evening checkboxes)
- Shloka study (marks today's verse as completed)
- Skincare (morning/evening)
- Exercise
- Water intake (glasses counter 0-15)
- Sleep hours (previous night)

**Scores (1-5 scale for each):**
- Mood
- Energy
- Clarity
- Confidence

**Text fields:**
- Gratitude 1, 2, 3
- Journal entry
- Daily intention
- Notes

**Streak toggle:**
- "Was today's streak maintained?" — Yes/No
- Affects `streak_maintained` in daily_logs

**Auto-save:** Debounced saves to Supabase as the user types

---

## Urge Shield (`/urge-shield`)

Multi-tool for urge resistance. The critical intervention screen.

**Tab 1 — Breathing (default)**
- 4-7-8 breathing: Inhale 4 counts, Hold 7 counts, Exhale 8 counts
- `BreathingCircle` component: Animated SVG circle that expands/contracts with the breath phase
- Auto-cycles through phases
- After 3+ rounds: prompts to log the urge

**Tab 2 — Cold Exposure Timer**
- Countdown timer for cold water/shower
- Default 60 seconds, adjustable
- Instruction text for each second

**Tab 3 — Log Urge**
- Intensity slider (1-10)
- Trigger tags (multi-select): social_media, boredom, stress, loneliness, night, morning, idle, etc.
- Trigger notes text field
- Action taken
- Outcome: "Held Strong" or "Relapsed"
- Whether breathing was done
- Saves to `urge_logs` table

**Recovery journal:**
- Appears after logging
- "Write what you're feeling" textarea
- "Update today's log" link

**Emergency mode (via Rishi tab "आपातकालीन सहायता"):**
- Triggers Rishi emergency response
- Includes current streak, sankalp, last urge data
- Response is immediate, direct, includes a shloka + breathing instruction + physical action

---

## Dhyana & Pranayama (`/dhyana`)

Three tabs for meditation and breathwork practices.

**Tab 1 — Meditation**
- Duration selector: 5, 10, 15, 20, 30, 45, 60 minutes
- Full-screen breathing circle during session
- `BreathingCircle` component: gentle 4-second inhale/4-second exhale cycle
- Timer display
- On completion: auto-logs meditation minutes to `daily_logs.meditation_minutes`
- Session complete card: "सत्संग पूर्ण" with duration logged

**Tab 2 — Pranayama**
- Techniques available:
  - Nadi Shodhana (Alternate Nostril)
  - Bhramari (Humming Bee)
  - Kapalbhati (Skull Shining)
  - Anulom Vilom
  - Ujjayi (Ocean Breath)
  - Bhastrika (Bellows Breath)
  - Sheetali (Cooling Breath)
- Each technique: name in Hindi/Sanskrit, description, count pattern (inhale:hold:exhale:hold)
- Timer with phase indicator (colored bands)
- Rounds counter
- Yoga Sutras 2.49 quote on pranayama

**Tab 3 — Japa (Mantra Counter)**
- `MantraCounter` component
- Select deity/mantra or enter custom
- Pre-loaded mantras: OM, Gayatri, Maha Mrityunjaya, Hare Krishna, Ram Ram, Hanuman Chalisa count
- Mala counter: 108 beads per mala
- Tap to count, swipe to confirm mala
- Total malas stored in localStorage (`sadhanaos_japa`)
- Today's malas vs all-time malas

---

## Granthalaya (`/granthalaya` — "Sacred Library")

The scripture library with verified, accurate texts.

**Scripture accuracy policy (CRITICAL):**
All shlokas are verified against authoritative sources:
- Bhagavad Gita: Swami Chinmayananda (Chinmaya Mission)
- Ashtavakra Gita: Swami Nityaswarupananda (Advaita Ashrama)
- Vivekachudamani: Adi Shankaracharya / Swami Madhavananda
- Yoga Sutras: Patanjali / Swami Satchidananda
- Ramcharitmanas: Gita Press Gorakhpur edition
- Upanishads: Swami Gambhirananda
NO shlokas are paraphrased or fabricated. Chapter/verse numbers match standard editions.

**6 scripture texts:**
1. **Bhagavad Gita** (`bhagavad-gita`) — 18 chapters, 700 verses — the central text
2. **Ashtavakra Gita** (`ashtavakra-gita`) — 20 chapters — Advaita Vedanta
3. **Yoga Sutras of Patanjali** (`yoga-sutras`) — 4 padas — yoga philosophy
4. **Ramcharitmanas** (`ramcharitmanas`) — Tulsidas, Awadhi Hindi dohas
5. **Upanishads** (`upanishads`) — Selected verses from major Upanishads
6. **Wisdom — Others** (`wisdom-others`) — Vivekachudamani, other texts

**Scripture Grid (index page):**
- Card per scripture with icon, Hindi title, description, progress bar (studied/total)
- "Today's Verse" at top: deterministic daily rotation, shown with gold glow
- Bookmarks shortcut link
- Empty state for first-time visitors

**Scripture Reader (`/granthalaya/[scripture]`):**
- Chapter/group selector
- Verse list with Sanskrit, transliteration, Hindi meaning, English meaning
- Context and practical application (where available)
- Mark as studied button (saves to `scripture_progress`)
- Bookmark toggle
- Personal notes field
- Difficulty indicator (beginner/intermediate/advanced)
- Speaker/author attribution

**Bookmarks (`/granthalaya/bookmarks`):**
- All bookmarked verses across all scriptures
- Filter by scripture
- Notes visible inline

**UniversalVerse type:**
Every verse has: id, scriptureKey, chapter, verse, groupKey, groupLabel, verseLabel, sanskrit, transliteration?, hindi_meaning, english_meaning, context?, practical_application?, lesson?, related_theme[]?, difficulty?, speaker?, type?, author?

---

## Prarthana (`/prarthana` — "Prayer")

Morning and evening prayer sequences.

**Morning prayers:** Configurable sequence of traditional prayers
- Surya Namaskara invocation
- Guru Vandana
- Personal deity prayer
- Custom additions

**Evening prayers:**
- Sandhya Vandana
- Gratitude prayers
- Sankalp renewal

**Japa counter integration:**
- Quick access to mantra counting from within prayer
- Today's malas vs all-time tracking
- `readJapa()` / `writeJapa()` localStorage functions

---

## Skincare / Roop Sadhana (`/skincare`)

Treats skincare as a spiritual practice — the body as temple.

**Morning ritual checklist:**
- Face wash
- Moisturiser
- Sun protection
- Gua sha / face massage
- Eye care

**Evening ritual checklist:**
- Double cleanse
- Toner / essence
- Treatment (retinol, niacinamide, etc.)
- Moisturiser / night cream

**Ayurvedic recommendations:**
- Dosha-based skin type suggestions
- Traditional ingredients: kumkumadi, neem, turmeric, sandalwood
- Diet + lifestyle tips tied to skin health

**Saves to:** `daily_logs.skincare_morning` and `daily_logs.skincare_evening`

---

## Chintan (`/chintan` — "Reflection & Journal")

Deep introspection and journaling module.

**Gratitude section:**
- 3 gratitude entries per day
- Saves to `daily_logs.gratitude_1/2/3`

**Mood tracking:**
- Mood, energy, clarity, confidence (1-5 each)
- Syncs with daily_logs

**Weekly reflection:**
- 8-dimension self-assessment (1-10 each):
  - Mental clarity, Emotional stability, Spiritual connection
  - Physical energy, Skin quality, Sleep quality
  - Social confidence, Eye contact
- Biggest challenge and biggest win
- What I learned this week
- Free reflection text
- Saves to `weekly_reflections` table

**Journal entry:**
- Full free-form journaling
- Saves to `daily_logs.journal_entry`

**Gratitude word cloud:**
- Extracts most common words from gratitude entries
- Displayed as a word frequency visualization

**Custom journal prompts:**
- "What weakened me this week?"
- "What practice had the most impact?"
- "How did I serve dharma today?"
- Stored in localStorage (`sadhanaos_custom_entries`)

---

## Analytics / Darpan (`/analytics`)

Data visualization and pattern recognition. 9 chart types.

**Time range filter:** 7D, 14D, 30D, All

**Charts:**
1. **Streak Timeline** (`StreakTimelineChart`) — calendar heatmap of maintained/broken days
2. **Mood Trend** (`MoodTrendChart`) — mood line + meditation bars, background mood bands
3. **Urge Frequency** (`UrgeFrequencyChart`) — weekly urge count bars (colored by intensity) + win-rate line
4. **Urge Heatmap** (`UrgeHeatmapChart`) — day-of-week × hour-of-day grid showing when urges peak
5. **Ritual Consistency** (`RitualConsistencyChart`) — stacked bars showing daily practice completion
6. **Pranayama Progress** (`PranayamaProgressChart`) — weekly pranayama sessions
7. **Gratitude Word Cloud** (`GratitudeWordCloud`) — top words from gratitude entries
8. **Holistic Score** (`HolisticScoreChart`) — weekly A-F grade bars with grade legend
9. **Correlation Insights** (`CorrelationInsightsCard`) — automatically detects patterns (e.g., "meditation reduces urges by 43%", "7+ hours sleep → better mood")

**Holistic Score formula:**
- Streak maintained 7/7: 25 pts
- Ritual average (meditation + pranayama + prayer + skincare + exercise): 25 pts
- Meditation days: 15 pts
- Urges resisted: 15 pts
- Weekly reflection done: 10 pts
- Scripture studied: 10 pts
= 0-100, graded A(≥85) B(≥70) C(≥55) D(≥40) F(<40)

**PDF download button:** In the analytics header, if a weekly Rishi report exists in the DB, a "Download Sacred Report" button appears.

**States:**
- Loading: skeleton shimmer cards
- < 7 days data: "X more days of logging will unlock full analytics"
- 0 days data: "Your mirror is forming. Keep practicing."

---

## Rishi AI Guide (`/rishi` — "Rishi Margdarshan")

AI-powered spiritual mentor powered by Groq (llama-3.3-70b-versatile).

**Three modes:**

**1. साप्ताहिक मार्गदर्शन (Weekly Guidance)**
- Generates a full weekly guidance report based on the last 7 days of actual data
- Context includes: streak, mood average, meditation days, pranayama days, prayer days, exercise, urge count/resistance rate, water average, sleep average, latest challenge/win
- Response structure: Shloka → Analysis → What's working → What needs attention → 3 recommendations → Closing blessing
- Saves to `ai_reports` table
- Shows "Download Sacred Report" button after generation

**2. ऋषि से पूछें (Ask Rishi)**
- Free-form question answering
- Rishi has full context: user's name, deity, streak, day count, mood avg, urge pattern, meditation days
- 5 example quick-questions shown
- Streaming response

**3. आपातकालीन सहायता (Emergency Support)**
- Immediate urge-resistance support
- Context: current streak at stake, time of day, last urge (minutes ago + intensity), sankalp
- Response: 1 shloka + 1 breathing exercise (named, with counts) + 1 immediate physical action + sankalp reflected back
- Under 400 words, leads with shloka
- Tone: "like Krishna to Arjuna mid-battle — compassionate but fierce with truth"

**Rishi's Personality (system prompt):**
- Addresses user as "Sadhak" (साधक)
- References ishta devata in every response
- Speaks with warmth but directness
- Uses natural Hinglish (Hindi + English blend)
- References Hindu concepts: karma, dharma, tapas, vairagya, sattva/rajas/tamas
- Gives SPECIFIC data-driven advice (references actual numbers, not generic platitudes)
- Knows user's deity and voices accordingly (Krishna speaks to Arjuna, Ram's devotee addressed by Hanuman)

**Technical:**
- `POST /api/rishi` — streams response via ReadableStream
- Groq SDK with `stream: true`
- Lazy initialization: `getGroq()` function so `GROQ_API_KEY` isn't required at build time
- 503 response if key not configured
- Rate limiting: early users get unlimited; plan to cap at 5/day/user in future

**Past reports:**
- Shows last 20 reports collapsible
- Expandable preview cards

---

## Goals & Sankalp (`/goals` — "Lakshya")

Journey milestone tracking and the sealed sankalp letter.

**Hero Progress Card:**
- Day X of Y-day Sankalp
- Progress ring (SVG donut with animation)
- DiyaFlame component (grows with progress)

**Milestone Journey Timeline:**
- Vertical timeline showing days 7, 14, 21, 30, 45, 60, 75, 90
- Each milestone: title, description, status (achieved/upcoming), Sanskrit quote
- Achieved milestones: show date + reflection field
- Auto-marks milestones: if `currentDay >= dayNumber` and not yet achieved, updates Supabase

**Sealed Sankalp Letter:**
- Initial state: wax seal icon + "Your sankalp is sealed until the final day"
- Progress ring shows % of journey complete
- "Break the Seal" button (only shown at completion or manually)
- On break: confetti animation (40 Framer Motion particles in temple-gold palette) + letter reveal
- Letter shows the user's own sankalp text from onboarding
- Response letter editor: user can write a letter back to their past self
- Saves response to localStorage (`sadhanaos_response_letter`)

**Post-completion options (shown at 100%):**
- Extend journey: 90, 120, 365 days, or Lifetime
- On extension: updates `profiles.target_days`, inserts new milestone rows from JSON

**Stats grid:**
- Current streak
- Days completed
- Milestones achieved
- Best week score

---

## Settings (`/settings` — "Vidhi")

**Profile section:**
- Edit name, age, gender
- Change ishta devata (deity)
- Update avatar URL

**Sadhana Settings:**
- Change sadhana start date
- Change target days
- Toggle which practices to track (affects analytics scoring)
- Reminder times (morning + evening)
- Saves to `profiles.prayer_schedule` JSON

**Data Export:**
- Export daily logs as CSV
- Export urge logs as CSV
- Export weekly reflections as CSV
- Uses `Blob` + `URL.createObjectURL` download pattern

**Reset Sadhana:**
- Archives current journey summary to localStorage (`sadhanaos_archived_journeys`)
- Updates `profiles.sadhana_start_date` to today
- Deletes existing `daily_logs` and `milestones`
- Re-seeds milestones via `seed_milestones` RPC
- Two-step confirmation modal

**Account Deletion:**
- Two-step modal: warning → type "delete my account" to confirm
- Deletes all user data from all 7 tables
- Signs out

**About section:**
- App version
- Links to support

---

## Sacred Weekly Report PDF

5-page PDF generated client-side using `@react-pdf/renderer v4`.

**Fonts:** Served from `/public/fonts/` (not CDN) — always available offline:
- `cinzel-400.woff` — Roman inscriptions style, used for headings
- `cormorant-400.woff`, `cormorant-400i.woff`, `cormorant-600.woff`, `cormorant-700.woff` — elegant serif for body
- `devanagari-400.woff`, `devanagari-600.woff` — Noto Serif Devanagari for all Sanskrit text
- IMPORTANT: Devanagari has NO italic variant — never apply `fontStyle: 'italic'` to Devanagari text

**Deity color themes:** 8 full palettes (krishna/ram/shiva/durga/hanuman/ganesh/saraswati/vishnu/default)
Each has: dark, primary, gold, goldLight, goldDark, bg, mantra, deityHi, blessing

**Page 1 — Cover:**
- Deity color band (top 35%) with properly centered OM in 128×128 fixed container
- Dashed halo ring + deity-colored inner glow (SVG)
- Deity name in Devanagari below
- Wax seal (jagged polygon + layered circles + OM overlay, all SVG)
- User's name, week, date range, holistic grade badge
- Bottom deity color band

**Page 2 — Sacred Verse:**
- Double gold border with corner diamond ornaments (`PageBorder` component)
- Shloka extracted from Rishi's report (first paragraph)
- Markdown stripped (`stripMarkdown()` removes `**bold**`, `*italic*`, `# headings`)
- Devanagari lines rendered in Devanagari font at 19pt, others in Cormorant italic
- `LotusMandala` SVG: 8-petal lotus with Ellipse + transform, 16-point starburst, concentric rings
- Sacred Contemplation text: 3-line meditation instruction
- Deity mantra at base

**Page 3 — Sadhana Mirror:**
- Deity-colored header band
- Circular score gauge (SVG arc)
- 5 practice bars (Meditation, Pranayama, Prayer, Exercise, Streak Days)
- Stats row (streak, mood, water, urges)
- Urge shield report OR awareness teaching if no urge data
- "What These Numbers Mean" teaching box with 3 explanations

**Page 4 — Rishi's Guidance:**
- `PageBorder` frame
- "प्रिय साधक," opening in Devanagari
- Full report text with markdown stripped
- Gold diamond bullets for headings
- Devanagari phrases highlighted in deity primary color

**Page 5 — The Path Ahead:**
- Deity-colored header band
- 3 numbered recommendations in Roman-numeral circles (I, II, III)
- Context note from latest challenge
- Deity blessing in large Devanagari
- Second wax seal + "इति शुभम्" + "Rishi — Your Digital Guru"
- Deity color footer

**Download trigger:** Button appears in `/rishi` after weekly report is generated + saved. Also in `/analytics` header if latest report exists.
`PDFDownloadButton.tsx` is dynamically imported (`ssr: false`) to prevent server-side rendering issues.

---

## Layout Architecture

**ShellClient (`components/layout/ShellClient.tsx`):**
- Client component wrapping all dashboard pages
- `SacredLoader`: 5 rotating Devanagari messages during load + shimmer progress bar
- Fetches real streak from `v_current_streak`
- Wraps everything in `<ToastProvider>`
- Mounts `<BottomTabBar />` (md:hidden)
- `pb-20 md:pb-6` on content area to clear bottom bar

**Sidebar (`components/layout/Sidebar.tsx`):**
- Desktop navigation (hidden on mobile)
- All 12 NAV_ITEMS
- Sanskrit labels + English labels
- Active indicator with `layoutId` Framer Motion shared animation

**Header (`components/layout/Header.tsx`):**
- Sticky top header
- "Log Today" CTA button → `/log`
- Profile avatar

**BottomTabBar (`components/layout/BottomTabBar.tsx`):**
- Mobile only (`md:hidden`)
- 5 tabs: Home, Log, Shield, Dhyana, Rishi
- `layoutId="bottom-tab-indicator"` for smooth slide
- Safe area inset: `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}`
- **KNOWN ISSUE:** Only 5 of 12 pages accessible on mobile. Analytics, Goals, Granthalaya, Prarthana, Chintan, Skincare, Settings are unreachable. FIX PLANNED: Add "More" (⋯) tab.

**PageWrapper (`components/layout/PageWrapper.tsx`):**
- `'use client'` with `usePathname()`
- `motion.div key={pathname}` for page transitions
- Fade + slide animation on route change

**ToastContext (`contexts/ToastContext.tsx`):**
- Global toast queue
- `useToast()` hook with graceful fallback if used outside provider
- `<Toaster>` mounted in ShellClient

---

## PWA Configuration

**manifest.json** (`/public/manifest.json`):
- name: "SadhanaOS"
- theme_color: "#E8913A" (saffron)
- background_color: "#FFF9F0" (dawn-white)
- display: "standalone"
- start_url: "/dashboard"
- Shortcuts: "Log Today" → /log, "Urge Shield" → /urge-shield

**Icons** (`/public/icons/`):
- `icon.svg`: OM symbol (ॐ) in saffron on parchment, rounded corners
- `icon-maskable.svg`: Same with safe-zone padding

**`src/app/layout.tsx`:**
- `Viewport` export: `themeColor: '#E8913A'`, `viewportFit: 'cover'`, `userScalable: false`
- `Metadata.manifest`: '/manifest.json'
- `Metadata.appleWebApp`: capable, title, statusBarStyle

---

## Vercel & Next.js Config

**`vercel.json`:** Security headers (X-Frame-Options: DENY, X-XSS-Protection, Referrer-Policy, Permissions-Policy), icon cache (immutable 1yr), manifest no-cache

**`next.config.ts`:**
```typescript
reactStrictMode: true,
compress: true,
poweredByHeader: false,
images: { formats: ['image/avif', 'image/webp'] }
```

**`eslint.config.mjs`:** `react-hooks/set-state-in-effect` and `react-hooks/purity` configured as 'warn' (intentional React patterns in this codebase)

---

## Sacred Color Palette (Tailwind CSS)

Defined in `globals.css` as CSS custom properties:

| Name | Value | Usage |
|---|---|---|
| `parchment` | #FFF9F0 | Main background |
| `cream` | #FDF5E6 | Secondary bg |
| `sandstone` | #E8D5BE | Borders, dividers |
| `twilight` | #8B7355 | Secondary text |
| `indigo-deep` | #1A0F3A | Primary headings |
| `indigo-mid` | #3D2C8D | Accent text |
| `sacred-saffron` | #E8913A | Primary CTAs |
| `temple-gold` | #D4A847 | Gold accents |
| `sage-green` | #6B9E78 | Success, positive |
| `rose-red` | #C45C5C | Error, relapse |
| `dawn-white` | #FDFBF7 | Pure white equivalent |

**Custom Tailwind utilities (globals.css):**
- `.card-hover` — translateY(-2px) + warmer shadow on hover
- `.scrollbar-hide` — hides scrollbar cross-browser
- `.touch-target` — 44px minimum tap area via `::after` pseudo-element
- `.shadow-warm-sm`, `.shadow-gold-glow`, `.shadow-sacred` — custom shadows
- `.rounded-card` — consistent border radius

---

## Key Technical Patterns

**Server-side auth (proxy.ts):**
```typescript
// Reads/writes session cookies; protects routes; redirects logged-in users away from auth pages
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: [...] }
```

**Groq lazy initialization:**
```typescript
let _groq: Groq | null = null
export function groq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}
// Called as groq().chat.completions.create(...)
```

**Scripture data access:**
```typescript
getAllVerses(): UniversalVerse[]
getVersesByScripture(key: ScriptureKey): UniversalVerse[]
getScriptureMeta(key: ScriptureKey): ScriptureMeta
getShlokCardProps(verse: UniversalVerse): ShlokCardProps
getDailyShlokas(count?: number): UniversalVerse[]  // deterministic by date
```

**Dynamic imports for heavy client-only components:**
```typescript
const PDFDownloadButton = dynamic(
  () => import('@/components/pdf/PDFDownloadButton'),
  { ssr: false, loading: () => null }
)
```

---

## Known Issues / Planned Fixes

**Critical (Priority 1):**
- Mobile navigation: 7 of 12 pages unreachable on mobile (sidebar hidden, only 5 bottom tabs)
  → FIX: Add "⋯ More" tab opening a bottom sheet with remaining pages
- No floating Rishi button → should be accessible from every screen
  → FIX: Global FAB in ShellClient.tsx
- Rishi responses don't consistently reference ishta devata
  → FIX: Strengthen system prompt to force deity-specific voice

**Non-critical:**
- `schema.sql` in lib/ may be outdated (actual schema documented above is authoritative)
- SadhanaStreakChart, MoodChart, PracticeDistributionChart in charts/ — may be unused legacy
- Some charts in analytics use the old simplified schema field names

---

## What Makes This App Different

1. **Real Sanskrit** — Every shloka is verified against authoritative translations, not AI-generated
2. **Deity-specific** — The entire app adapts to which deity the user worships
3. **Holistic metric** — The A-F weekly score measures 6 dimensions, not just one habit
4. **Context-aware AI** — Rishi reads actual user data before responding (not generic advice)
5. **Sacred aesthetics** — Temple color palette, Devanagari throughout, parchment/gold design language
6. **Urge science** — Treats brahmacharya as neuroplasticity training, not just religious practice
7. **The sealed letter** — The sankalp system creates emotional investment in the 90-day journey

---

*This document was last updated: May 2026. For live code, always check the actual source files — this document describes intent and architecture, the code is authoritative for implementation details.*
