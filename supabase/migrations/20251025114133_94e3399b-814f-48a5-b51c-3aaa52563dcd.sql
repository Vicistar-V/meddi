-- Create profiles table
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  full_name text,
  avatar_url text,
  caregiver_id uuid references public.profiles(id) on delete set null,
  patient_id uuid references public.profiles(id) on delete set null,
  primary key (id)
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles RLS policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Create medication status enum
create type medication_log_status as enum ('taken', 'skipped', 'missed');

-- Create medications table
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  name text not null,
  dosage text not null,
  instructions text,
  pill_image_url text
);

-- Enable RLS on medications
alter table public.medications enable row level security;

-- Medications RLS policies
create policy "Users can view their own medications"
  on public.medications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own medications"
  on public.medications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own medications"
  on public.medications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own medications"
  on public.medications for delete
  using (auth.uid() = user_id);

-- Create schedules table
create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  time_to_take time without time zone not null,
  days_of_week jsonb not null default '[]'::jsonb
);

-- Enable RLS on schedules
alter table public.schedules enable row level security;

-- Schedules RLS policies
create policy "Users can view their own schedules"
  on public.schedules for select
  using (auth.uid() = user_id);

create policy "Users can insert their own schedules"
  on public.schedules for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own schedules"
  on public.schedules for update
  using (auth.uid() = user_id);

create policy "Users can delete their own schedules"
  on public.schedules for delete
  using (auth.uid() = user_id);

-- Create medication_logs table
create table public.medication_logs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.schedules(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  taken_at timestamp with time zone default now(),
  status medication_log_status not null
);

-- Enable RLS on medication_logs
alter table public.medication_logs enable row level security;

-- Medication logs RLS policies
create policy "Users can view their own logs"
  on public.medication_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own logs"
  on public.medication_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own logs"
  on public.medication_logs for update
  using (auth.uid() = user_id);

-- Create trigger function to auto-create profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- Create trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();