-- ============================================================
-- APPLIED INTELLIGENCE — Database Schema
-- ============================================================
-- Run this in Supabase SQL Editor (or via Claude Code migration)
--
-- Three tiers:
--   1. CORE — auth profiles, prompt templates, output config
--   2. MODULE 1 — Book Insights (build first)
--   3. MODULE 2 & 3 — Negotiation + Team (light sketch, built later)
--
-- Every table has user_id + RLS. No data leaks between users.
-- ============================================================


-- ============================================================
-- CORE TABLES
-- ============================================================

-- User profile — the "who am I" layer
-- Set during onboarding, read by every AI call
-- One row per user. This is THE source of truth for identity context.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  -- Identity basics
  display_name text not null,
  location text,                          -- e.g. "Sydney, Australia"
  languages text[] default '{"English"}', -- spoken languages
  default_output_language text not null default 'English',  -- "English" or "Nepali"

  -- Communication style (feeds every prompt)
  tone_preference text not null default 'casual',           -- casual | formal | balanced
  directness text not null default 'direct',                -- direct | diplomatic | balanced
  humour_style text not null default 'dry',                 -- dry | warm | none

  -- Professional context
  job_title text,
  industry text,
  stakeholder_types text[],               -- e.g. {"business users", "developers", "executives"}

  -- Side hustle / business context
  business_type text,                     -- e.g. "Photography & Videography"
  target_clients text,                    -- e.g. "Community cricket clubs, weddings, small businesses"
  price_range text,                       -- e.g. "$200-$2000 per project"
  common_objections text[],              -- e.g. {"too expensive", "can do it ourselves", "need to see portfolio"}

  -- Sport / leadership context (optional)
  sport text,                             -- e.g. "Cricket"
  team_role text,                         -- e.g. "Captain"
  team_name text,                         -- e.g. "Warriors Cricket Club"
  team_level text,                        -- community | competitive | semi-pro | professional
  captaincy_style text,                   -- e.g. "Lead by example, quiet intensity, direct but supportive"

  -- Reading context
  reading_genres text[],                  -- e.g. {"self-help", "business", "psychology", "biography"}
  why_i_read text,                        -- e.g. "To find practical tools I can apply immediately"

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);


-- Prompt templates — stored in DB, not code
-- Versioned so you can iterate without redeploying
create table public.prompt_templates (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  module text not null,                   -- "books" | "negotiation" | "team"
  action text not null,                   -- e.g. "extract_insight" | "generate_strategies" | "generate_speech"
  version int not null default 1,
  is_active boolean not null default true, -- only one active version per module+action

  -- The actual prompt
  system_prompt text not null,            -- system message template with {{placeholders}}
  user_prompt_template text not null,     -- user message template with {{placeholders}}

  -- Config
  model text not null default 'claude-sonnet-4-20250514',
  max_tokens int not null default 2000,
  temperature float not null default 0.7,

  -- Meta
  notes text,                             -- why this version exists, what changed
  created_at timestamptz not null default now(),

  -- Enforce one active version per module+action
  unique(module, action, version)
);

-- No RLS on prompts — they're global config, not user data
-- In production, you'd restrict writes to admin role only


-- Output style guide — language-specific formatting rules
-- The AI reads this to know HOW to write in each language
create table public.output_style_guides (
  id uuid primary key default gen_random_uuid(),
  language text not null unique,          -- "English" | "Nepali"
  style_instructions text not null,       -- full style guide the AI reads
  examples text not null,                 -- 5-10 example outputs showing the right tone
  anti_examples text,                     -- examples of what NOT to do
  updated_at timestamptz not null default now()
);


-- ============================================================
-- MODULE 1: BOOK INSIGHTS
-- ============================================================

-- Books — your reading library
create table public.books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  author text,
  genre text,                             -- maps to reading_genres in profile
  status text not null default 'reading', -- reading | finished | abandoned
  cover_image_url text,                   -- optional, for UI niceness

  -- Stats (computed, but cached here for quick display)
  total_insights int not null default 0,
  applied_insights int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.books enable row level security;
create policy "Users can CRUD own books" on public.books for all using (auth.uid() = user_id);

-- Create index for common query: "show me my books"
create index idx_books_user_id on public.books(user_id);


-- Book insights — the extracted knowledge
create table public.book_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,

  -- What was captured
  source_type text not null default 'text',  -- text | image
  source_text text,                          -- pasted text (nullable if image)
  source_image_url text,                     -- uploaded image URL (nullable if text)
  user_reaction_note text,                   -- "why this hit me" — optional but gold

  -- What the AI extracted
  ai_core_idea text,                         -- the insight in plain language
  ai_why_it_matters text,                    -- personalised to user's context
  ai_raw_response jsonb,                     -- full AI response for debugging/reprocessing

  -- Meta
  output_language text not null default 'English',
  prompt_version_used int,                   -- which prompt template version produced this
  user_rating smallint,                      -- 1-5 stars, or null if not rated

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.book_insights enable row level security;
create policy "Users can CRUD own insights" on public.book_insights for all using (auth.uid() = user_id);

create index idx_book_insights_user_id on public.book_insights(user_id);
create index idx_book_insights_book_id on public.book_insights(book_id);


-- Insight actions — the practical steps to take
-- Separate table because one insight can produce 1-3 actions
create table public.insight_actions (
  id uuid primary key default gen_random_uuid(),
  insight_id uuid not null references public.book_insights(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  action_text text not null,                 -- the specific thing to do
  context_tags text[] not null default '{}', -- where it applies: {"professional", "photography_business", "cricket", "personal"}
  suggested_timeframe text,                  -- "this week" | "today" | "next meeting" | "ongoing"

  -- Tracking
  status text not null default 'pending',    -- pending | tried_worked | tried_flopped | skipped
  outcome_notes text,                        -- what happened when you tried it
  completed_at timestamptz,

  created_at timestamptz not null default now()
);

alter table public.insight_actions enable row level security;
create policy "Users can CRUD own actions" on public.insight_actions for all using (auth.uid() = user_id);

create index idx_insight_actions_insight_id on public.insight_actions(insight_id);
create index idx_insight_actions_user_id on public.insight_actions(user_id);
create index idx_insight_actions_status on public.insight_actions(status);


-- Resurfacing queue — scheduled check-ins
create table public.resurfacing_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_id uuid not null references public.book_insights(id) on delete cascade,

  scheduled_for timestamptz not null,        -- when to show the check-in
  resurface_type text not null default '7d', -- 7d | 14d | 30d | custom

  -- Response tracking
  sent_at timestamptz,                       -- when it was actually shown to user
  responded_at timestamptz,                  -- when user responded
  response text,                             -- tried | not_tried | revisit_later
  response_notes text,                       -- user's free-text on what happened

  created_at timestamptz not null default now()
);

alter table public.resurfacing_queue enable row level security;
create policy "Users can CRUD own resurfacing" on public.resurfacing_queue for all using (auth.uid() = user_id);

create index idx_resurfacing_user_pending on public.resurfacing_queue(user_id, scheduled_for)
  where responded_at is null;


-- AI output log — every AI call, for debugging and tuning
-- Not module-specific — logs calls from ALL modules
create table public.ai_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  module text not null,                      -- "books" | "negotiation" | "team"
  action text not null,                      -- matches prompt_templates.action

  -- What went in
  input_payload jsonb not null,              -- the full context sent to the AI
  prompt_version_used int,

  -- What came out
  output_payload jsonb not null,             -- full AI response
  model_used text not null,
  tokens_input int,
  tokens_output int,
  latency_ms int,

  -- Quality signal
  user_rating smallint,                      -- thumbs up (1) / thumbs down (0), or 1-5

  created_at timestamptz not null default now()
);

alter table public.ai_outputs enable row level security;
create policy "Users can view own outputs" on public.ai_outputs for select using (auth.uid() = user_id);
create policy "Users can insert own outputs" on public.ai_outputs for insert with check (auth.uid() = user_id);

create index idx_ai_outputs_user_module on public.ai_outputs(user_id, module);


-- ============================================================
-- MODULE 2: NEGOTIATION / PEOPLE SKILLS (light sketch)
-- Build these tables when Module 1 is shipped and in daily use
-- ============================================================

-- Person profiles — reusable across negotiation scenarios
-- Also reusable for team module (players) with a type flag
create table public.contact_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  profile_type text not null default 'stakeholder',  -- stakeholder | client | player | other
  role text,                                          -- their role/position
  traits text[],                                      -- e.g. {"price-sensitive", "values speed", "avoids conflict"}
  communication_style text,                           -- how they prefer to communicate
  history_notes text,                                 -- running notes on interactions

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.contact_profiles enable row level security;
create policy "Users can CRUD own contacts" on public.contact_profiles for all using (auth.uid() = user_id);

create index idx_contact_profiles_user_id on public.contact_profiles(user_id);


-- Negotiation scenarios
create table public.scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  goal text not null,                        -- sell | negotiate_price | push_back | deliver_bad_news | ask | gather_requirements | repair
  situation_description text not null,
  contact_profile_id uuid references public.contact_profiles(id) on delete set null,
  output_language text not null default 'English',

  created_at timestamptz not null default now()
);

alter table public.scenarios enable row level security;
create policy "Users can CRUD own scenarios" on public.scenarios for all using (auth.uid() = user_id);


-- Strategies generated per scenario
create table public.strategies (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  label text not null,                       -- e.g. "Hold firm" | "Find middle ground"
  prioritises text,                          -- what this approach optimises for
  tradeoff text,                             -- what you risk
  opening_line text,
  talking_points text[],
  anticipated_pushback text[],
  exit_lines text[],

  created_at timestamptz not null default now()
);

alter table public.strategies enable row level security;
create policy "Users can CRUD own strategies" on public.strategies for all using (auth.uid() = user_id);


-- Roleplay sessions
create table public.roleplay_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id uuid not null references public.scenarios(id) on delete cascade,
  strategy_id uuid not null references public.strategies(id) on delete cascade,

  transcript jsonb not null default '[]',    -- array of {role, content, timestamp}
  critique text,                             -- AI's post-roleplay feedback

  ended_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.roleplay_sessions enable row level security;
create policy "Users can CRUD own roleplay" on public.roleplay_sessions for all using (auth.uid() = user_id);


-- Negotiation lessons learned
create table public.negotiation_lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_id uuid references public.scenarios(id) on delete set null,

  lesson_text text not null,
  tags text[] not null default '{}',
  outcome text,                              -- won | lost | partial | ongoing

  created_at timestamptz not null default now()
);

alter table public.negotiation_lessons enable row level security;
create policy "Users can CRUD own lessons" on public.negotiation_lessons for all using (auth.uid() = user_id);


-- ============================================================
-- MODULE 3: TEAM MOTIVATION / CAPTAINCY (light sketch)
-- Build these tables when Module 2 is shipped
-- ============================================================

-- Teams
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  sport text not null,
  level text not null default 'community',   -- community | competitive | semi-pro | professional
  season_context text,                        -- current season notes, form, morale

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teams enable row level security;
create policy "Users can CRUD own teams" on public.teams for all using (auth.uid() = user_id);


-- Players (extends contact_profiles with sport-specific fields)
create table public.players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  contact_profile_id uuid references public.contact_profiles(id) on delete set null,

  playing_role text,                          -- batsman | bowler | all-rounder | keeper
  motivators text[],                          -- what fires them up
  avoid_notes text,                           -- what to avoid saying/doing
  recent_form text,                           -- current form notes

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.players enable row level security;
create policy "Users can CRUD own players" on public.players for all using (auth.uid() = user_id);


-- Speeches
create table public.speeches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,

  situation text not null,                    -- pre_match | drinks_break | post_loss | post_win | individual | presentation
  target_length_seconds int,
  output_language text not null default 'English',
  mentioned_players uuid[],                   -- player IDs specifically addressed
  content text not null,                      -- the speech itself

  -- Feedback
  used_at timestamptz,                        -- when it was actually delivered
  landed_rating smallint,                     -- 1-5 how well it landed
  landing_notes text,                         -- what worked, what didn't

  prompt_version_used int,
  created_at timestamptz not null default now()
);

alter table public.speeches enable row level security;
create policy "Users can CRUD own speeches" on public.speeches for all using (auth.uid() = user_id);


-- ============================================================
-- HELPER: Updated_at trigger
-- Auto-updates updated_at on any row change
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to all tables with updated_at
create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.books
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.book_insights
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.contact_profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.teams
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.players
  for each row execute function public.handle_updated_at();


-- ============================================================
-- SEED DATA: Output style guides
-- ============================================================

insert into public.output_style_guides (language, style_instructions, examples, anti_examples) values
(
  'English',
  'Write in casual, spoken English. Vary sentence lengths — some short, some longer. No forced transitions (never say "Firstly", "Moreover", "In conclusion"). No bullet points unless the user explicitly asks. Sound like a smart friend giving advice over coffee, not a textbook. Be specific and actionable — never generic. Use "you" directly. Contractions are fine. Occasional dry wit is welcome but don''t force it.',
  E'GOOD: "Here''s what I''d actually try — next time your client pushes back on price, don''t justify. Ask them what their budget is. Silence after that question does the heavy lifting."\n\nGOOD: "This connects to something you saved from Atomic Habits three weeks ago — the idea that environment beats willpower. So instead of trying to remember to practice, put the guitar next to your desk. Remove the friction."\n\nGOOD: "That was a tough loss. But here''s what I noticed — when the pressure came on in the 35th over, nobody talked. The field went quiet. That''s the moment you step in. Not with a plan, just with presence. Walk to your bowler, say something simple, reset."',
  E'BAD: "Firstly, it is important to consider the key factors involved in this negotiation."\n\nBAD: "Here are 7 actionable tips for improving your leadership skills: 1. Be authentic..."\n\nBAD: "In conclusion, applying these insights will help you grow as a professional and a leader."'
),
(
  'Nepali',
  'Write in spoken bilingual Nepali — the way educated young Nepalis actually talk. Mix Devanagari Nepali with English words naturally (technical terms, common English words like "confidence", "mindset", "actually", "basically" stay in English). Never use rigid literary/written Nepali. Never translate English words that people normally say in English. Contractions and colloquial forms are fine. The tone should feel like you''re talking to a close friend or teammate — warm, direct, real. Use "तिमी" (informal you), not "तपाईं" (formal you) unless the context is genuinely formal.',
  E'GOOD: "भोलि client सँग meeting छ भने, एउटा कुरा try गर — price justify नगर। सिधा सोध कि तपाईंको budget कति हो। त्यो question पछि silence राख। Silence ले काम गर्छ।"\n\nGOOD: "यो idea Atomic Habits बाट तिमीले तीन हप्ता अगाडि save गरेको थियौ — environment beats willpower भन्ने। So guitar desk छेउमा राख। Friction हटा।"\n\nGOOD: "Tough loss थियो। तर मैले notice गरें — 35th over मा pressure आउँदा कसैले बोलेन। Field quiet भयो। त्यो moment मा तिमी step in गर। Plan चाहिँदैन, बस presence देखा।"',
  E'BAD: "सर्वप्रथम, यस वार्तामा संलग्न प्रमुख कारकहरूलाई विचार गर्नु महत्त्वपूर्ण छ।" (too literary/formal)\n\nBAD: "तपाईंले यी insights लाई apply गर्नुभयो भने तपाईंको professional र leadership growth हुनेछ।" (robotic, formal तपाईं where it doesn''t fit)\n\nBAD: Direct translation of English structure into Nepali without natural code-switching.'
);
