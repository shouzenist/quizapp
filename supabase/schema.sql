-- ========================================================
-- SCHEMA SQL: APLIKASI QUIZ INTERAKTIF (GURU & MURID)
-- Jalankan file ini di Supabase SQL Editor
-- ========================================================

-- Aktifkan ekstensi UUID
create extension if not exists "uuid-ossp";

-- 1. TABEL KUIS
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  subject text default 'Umum',
  quiz_code varchar(10) unique not null,
  is_active boolean default true,
  time_limit_minutes int default 0, -- 0 jika tanpa batas waktu
  shuffle_questions boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABEL SOAL
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  question_text text not null,
  image_url text,
  points int default 10 not null,
  order_index int default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TABEL PILIHAN JAWABAN
create table if not exists public.options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references public.questions(id) on delete cascade not null,
  option_text text not null,
  is_correct boolean default false not null
);

-- 4. TABEL HASIL PENGERJAAN MURID
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  student_name text not null,
  student_class text not null,
  score int default 0 not null,
  total_questions int default 0 not null,
  correct_answers int default 0 not null,
  tab_switch_count int default 0 not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. TABEL DETAIL JAWABAN MURID (OPSIONAL UNTUK ANALISIS)
create table if not exists public.submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  selected_option_id uuid references public.options(id) on delete set null,
  is_correct boolean default false not null
);

-- INDEXES UNTUK PERFORMA TINGGI
create index if not exists idx_quizzes_quiz_code on public.quizzes(quiz_code);
create index if not exists idx_questions_quiz_id on public.questions(quiz_id);
create index if not exists idx_options_question_id on public.options(question_id);
create index if not exists idx_submissions_quiz_id on public.submissions(quiz_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_answers enable row level security;

-- Hapus policy lama jika ada
drop policy if exists "Allow anon read active quizzes" on public.quizzes;
drop policy if exists "Allow all operations for authenticated teachers" on public.quizzes;
drop policy if exists "Allow anon read questions" on public.questions;
drop policy if exists "Allow authenticated manage questions" on public.questions;
drop policy if exists "Allow anon read options" on public.options;
drop policy if exists "Allow authenticated manage options" on public.options;
drop policy if exists "Allow public insert submissions" on public.submissions;
drop policy if exists "Allow read submissions for quiz owner" on public.submissions;
drop policy if exists "Allow public insert submission_answers" on public.submission_answers;
drop policy if exists "Allow read submission_answers" on public.submission_answers;
drop policy if exists "Allow all for quizzes" on public.quizzes;
drop policy if exists "Allow all for questions" on public.questions;
drop policy if exists "Allow all for options" on public.options;
drop policy if exists "Allow all for submissions" on public.submissions;
drop policy if exists "Allow all for submission_answers" on public.submission_answers;

-- Akses penuh untuk aplikasi kuis (pengamanan portal guru dikontrol oleh Password PIN Guru)
create policy "Allow all for quizzes" on public.quizzes for all using (true) with check (true);
create policy "Allow all for questions" on public.questions for all using (true) with check (true);
create policy "Allow all for options" on public.options for all using (true) with check (true);
create policy "Allow all for submissions" on public.submissions for all using (true) with check (true);
create policy "Allow all for submission_answers" on public.submission_answers for all using (true) with check (true);

-- ========================================================
-- DATA CONTOH AWAL (SEEDED QUIZ)
-- ========================================================
do $$
declare
  q_id uuid;
  quest_id uuid;
begin
  if not exists (select 1 from public.quizzes where quiz_code = 'PINTAR') then
    insert into public.quizzes (id, title, description, subject, quiz_code, is_active, time_limit_minutes)
    values (
      gen_random_uuid(),
      'Kuis Wawasan Nusantara & Sains Seru',
      'Uji seberapa luas pengetahuanmu tentang alam, sains, dan Indonesia! Jawab dengan teliti ya.',
      'Pengetahuan Umum',
      'PINTAR',
      true,
      5
    ) returning id into q_id;

    -- Soal 1
    insert into public.questions (id, quiz_id, question_text, points, order_index)
    values (gen_random_uuid(), q_id, 'Apa nama ibu kota negara Indonesia yang baru yang berada di Kalimantan Timur?', 20, 0)
    returning id into quest_id;

    insert into public.options (question_id, option_text, is_correct) values
      (quest_id, 'Nusantara (IKN)', true),
      (quest_id, 'Balikpapan', false),
      (quest_id, 'Samarinda', false),
      (quest_id, 'Banjarmasin', false);

    -- Soal 2
    insert into public.questions (id, quiz_id, question_text, points, order_index)
    values (gen_random_uuid(), q_id, 'Planet manakah yang dijuluki sebagai Planet Merah dalam tata surya kita?', 20, 1)
    returning id into quest_id;

    insert into public.options (question_id, option_text, is_correct) values
      (quest_id, 'Venus', false),
      (quest_id, 'Mars', true),
      (quest_id, 'Jupiter', false),
      (quest_id, 'Merkurius', false);

    -- Soal 3
    insert into public.questions (id, quiz_id, question_text, points, order_index)
    values (gen_random_uuid(), q_id, 'Organ tubuh manusia yang berfungsi memompa darah ke seluruh tubuh adalah...', 20, 2)
    returning id into quest_id;

    insert into public.options (question_id, option_text, is_correct) values
      (quest_id, 'Paru-paru', false),
      (quest_id, 'Lambung', false),
      (quest_id, 'Jantung', true),
      (quest_id, 'Hati', false);

    -- Soal 4
    insert into public.questions (id, quiz_id, question_text, points, order_index)
    values (gen_random_uuid(), q_id, 'Siapakah tokoh pahlawan nasional yang dikenal sebagai Bapak Pendidikan Nasional?', 20, 3)
    returning id into quest_id;

    insert into public.options (question_id, option_text, is_correct) values
      (quest_id, 'Ki Hajar Dewantara', true),
      (quest_id, 'Ir. Soekarno', false),
      (quest_id, 'Mohammad Hatta', false),
      (quest_id, 'R.A. Kartini', false);

    -- Soal 5
    insert into public.questions (id, quiz_id, question_text, points, order_index)
    values (gen_random_uuid(), q_id, 'Gas apakah yang diserap oleh tumbuhan hijau pada saat proses fotosintesis?', 20, 4)
    returning id into quest_id;

    insert into public.options (question_id, option_text, is_correct) values
      (quest_id, 'Oksigen', false),
      (quest_id, 'Nitrogen', false),
      (quest_id, 'Karbondioksida (CO2)', true),
      (quest_id, 'Hidrogen', false);
  end if;
end $$;
