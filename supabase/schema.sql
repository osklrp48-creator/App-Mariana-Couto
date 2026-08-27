-- Mariana Couto Podologia — schema do banco na nuvem (Supabase)
--
-- Como usar: no painel do Supabase, vá em "SQL Editor" > "New query", cole
-- este arquivo inteiro e clique em "Run". Só precisa rodar uma vez.
--
-- Cada linha de cada tabela pertence a um usuário (user_id = auth.uid()),
-- preenchido automaticamente pelo Supabase a partir de quem está logado —
-- o app nunca precisa informar esse campo. As políticas de RLS abaixo
-- garantem que cada conta só enxerga os próprios dados.

create table if not exists public.patients (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  phone text not null,
  address text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.treatments (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  default_value numeric not null default 0,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  patient_id text not null,
  treatment_id text not null,
  date text not null,
  time text not null,
  status text not null default 'Agendado',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revenue_id text,
  notified_60 boolean not null default false,
  notified_30 boolean not null default false
);

create table if not exists public.expenses (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  appointment_id text not null,
  date text not null,
  value numeric not null default 0,
  category text not null default 'Deslocamento',
  description text not null default '',
  auto boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.revenues (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  patient_id text,
  appointment_id text,
  treatment_id text,
  value numeric not null default 0,
  date text not null,
  payment_method text,
  status text not null default 'Pendente',
  description text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists patients_user_idx on public.patients (user_id);
create index if not exists treatments_user_idx on public.treatments (user_id);
create index if not exists appointments_user_idx on public.appointments (user_id);
create index if not exists expenses_user_idx on public.expenses (user_id);
create index if not exists revenues_user_idx on public.revenues (user_id);

alter table public.patients enable row level security;
alter table public.treatments enable row level security;
alter table public.appointments enable row level security;
alter table public.expenses enable row level security;
alter table public.revenues enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['patients', 'treatments', 'appointments', 'expenses', 'revenues']
  loop
    execute format('drop policy if exists "select own" on public.%I', t);
    execute format('create policy "select own" on public.%I for select using (user_id = auth.uid())', t);

    execute format('drop policy if exists "insert own" on public.%I', t);
    execute format('create policy "insert own" on public.%I for insert with check (user_id = auth.uid())', t);

    execute format('drop policy if exists "update own" on public.%I', t);
    execute format('create policy "update own" on public.%I for update using (user_id = auth.uid()) with check (user_id = auth.uid())', t);

    execute format('drop policy if exists "delete own" on public.%I', t);
    execute format('create policy "delete own" on public.%I for delete using (user_id = auth.uid())', t);
  end loop;
end $$;

-- Habilita as atualizações em tempo real (para os dois celulares se
-- sincronizarem na hora). Se der erro "already member of publication",
-- pode ignorar — significa que já estava habilitado.
alter publication supabase_realtime add table public.patients;
alter publication supabase_realtime add table public.treatments;
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.revenues;
