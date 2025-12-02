-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Tasks submitted by authenticated users
create table if not exists public.tasks (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    description text not null,
    code text not null,
    language text not null default 'unspecified',
    status text not null default 'pending',
    created_at timestamptz not null default timezone('utc', now())
);

-- AI evaluation output (a.k.a. reports)
create table if not exists public.reports (
    id uuid primary key default uuid_generate_v4(),
    task_id uuid not null references public.tasks(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    score integer,
    short_feedback text,
    strengths text[] not null default '{}',
    improvements text[] not null default '{}',
    full_report text,
    unlocked boolean not null default false,
    created_at timestamptz not null default timezone('utc', now())
);

-- Payments captured after Stripe checkout
create table if not exists public.payments (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    report_id uuid references public.reports(id) on delete set null,
    stripe_session_id text,
    stripe_payment_id text,
    amount numeric(10,2),
    currency text,
    status text,
    created_at timestamptz not null default timezone('utc', now())
);

-- Helpful indexes
create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists reports_user_id_idx on public.reports (user_id);
create index if not exists reports_task_id_idx on public.reports (task_id);
create index if not exists payments_user_id_idx on public.payments (user_id);

-- Row Level Security
alter table public.tasks enable row level security;
alter table public.reports enable row level security;
alter table public.payments enable row level security;

create policy "Users can manage their tasks" on public.tasks
    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can read their reports" on public.reports
    for select using (auth.uid() = user_id);

create policy "Users can insert their reports" on public.reports
    for insert with check (auth.uid() = user_id);

create policy "Users can update their reports" on public.reports
    for update using (auth.uid() = user_id);

create policy "Users can view their payments" on public.payments
    for select using (auth.uid() = user_id);

create policy "Users can insert their payments" on public.payments
    for insert with check (auth.uid() = user_id);
