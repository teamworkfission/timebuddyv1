-- Enable necessary extensions
create extension if not exists "citext";

-- User profiles table with role locking
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null unique,
  role text not null check (role in ('employee','employer')),
  role_locked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- RLS Policies
create policy "Users can read own profile" 
  on profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on profiles for update 
  using (auth.uid() = id);

-- Update timestamp trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on profiles
  for each row execute procedure public.handle_updated_at();
